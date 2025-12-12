import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Anti-fraud config
const COOLDOWN_HOURS = 24;
const GLOBAL_RATE_LIMIT_PER_HOUR = 50;
const MIN_SESSION_AGE_MS = 1500;

// Brazil timezone ranges (UTC-2 to UTC-5)
const BRAZIL_TIMEZONE_MIN = -5 * 60; // -300 minutes (Acre)
const BRAZIL_TIMEZONE_MAX = -2 * 60; // -120 minutes (Fernando de Noronha)

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Check if timezone offset is consistent with Brazil
function isTimezoneConsistentWithBrazil(timezoneOffset: number | null | undefined): boolean {
  if (timezoneOffset === null || timezoneOffset === undefined) return true;
  return timezoneOffset >= BRAZIL_TIMEZONE_MIN && timezoneOffset <= BRAZIL_TIMEZONE_MAX;
}

// Get expected timezone name from offset
function getExpectedTimezone(timezoneOffset: number | null | undefined): string {
  if (timezoneOffset === null || timezoneOffset === undefined) return "unknown";
  const hours = Math.abs(Math.floor(timezoneOffset / 60));
  const sign = timezoneOffset <= 0 ? "-" : "+";
  return `UTC${sign}${hours}`;
}

// ========== SUSPICIOUS ASN LIST (Hosting/VPN providers) ==========
const SUSPICIOUS_ASNS = [
  // Major Cloud Providers
  'AS14061',  // DigitalOcean
  'AS16509',  // Amazon AWS
  'AS13335',  // Cloudflare
  'AS20473',  // Vultr
  'AS63949',  // Linode (Akamai)
  'AS396982', // Google Cloud
  'AS8075',   // Microsoft Azure
  'AS15169',  // Google LLC
  'AS14618',  // Amazon.com
  'AS45102',  // Alibaba Cloud
  'AS37963',  // Alibaba China
  
  // European Hosting
  'AS24940',  // Hetzner
  'AS12876',  // Scaleway
  'AS51167',  // Contabo
  'AS201011', // Netcup
  'AS16276',  // OVH SAS
  'AS35540',  // OVH Hosting
  'AS60781',  // Leaseweb
  'AS28753',  // Leaseweb DE
  'AS30633',  // Leaseweb NL
  'AS60068',  // Datacamp Limited
  
  // US Hosting
  'AS36352',  // ColoCrossing
  'AS46606',  // Unified Layer
  'AS55286',  // B2 Net Solutions
  'AS32097',  // WholeSale Internet
  'AS20278',  // Nexeon Technologies
  'AS29802',  // HVC Data Center
  'AS30633',  // Leaseweb USA
  'AS62567',  // DigitalOcean NYC
  'AS394711', // Limenet
  'AS62563',  // GTHost
  
  // Known VPN Providers
  'AS9009',   // M247 (Many VPNs use this)
  'AS212238', // NordVPN
  'AS136787', // TEFINCOM (NordVPN)
  'AS209103', // Private Internet Access
  'AS398722', // ExpressVPN  
  'AS394354', // Surfshark
  'AS202425', // IP Volume Inc (VPN reseller)
  'AS206092', // IPXO (IP reseller)
  'AS44477',  // Stark Industries (VPN/Hosting)
  'AS9808',   // Guangdong Mobile (frequent VPN exit)
  'AS49981',  // WorldStream (VPN hosting)
  'AS200651', // Flokinet (Privacy hosting)
  'AS51396',  // Pfcloud (VPN)
  'AS41378',  // Kirino LLC (VPN)
  'AS35913',  // DediPath (VPN hosting)
  'AS40676',  // Psychz Networks
  'AS25820',  // IT7 Networks (VPN)
  'AS44592',  // SkyLink Data Center
  'AS62468',  // Amarutu Technology (VPN)
  'AS9370',   // Sakura Internet (VPN exit)
  'AS202448', // MVPS (VPN)
  'AS211252', // Delis LLC (VPN)
  'AS211298', // Konstantin Kiselev (VPN)
  'AS211321', // Xhost Internet (VPN)
  'AS56971',  // CGI Global (VPN)
  'AS51852',  // Private Layer (VPN)
  'AS42708',  // Portlane (VPN)
  'AS197540', // Netcup GmbH (VPN)
  'AS35540',  // OVH Hosting
  
  // Datacenter/Proxy Networks
  'AS174',    // Cogent (datacenter)
  'AS3356',   // Level3/Lumen (datacenter)
  'AS6939',   // Hurricane Electric
  'AS7922',   // Comcast Business (datacenter ranges)
  'AS32748',  // Steadfast Networks
  'AS33387',  // DataShack
  'AS30083',  // HEG US (datacenter)
  'AS397423', // Tier.Net Technologies
  'AS395003', // Cherry Servers
  'AS18779',  // EGIHosting
  'AS54825',  // Packet Host (Equinix Metal)
  'AS19624',  // Data Foundry
];

// Brazilian ISPs that are ALLOWED (not in suspicious list)
// Claro, Vivo, TIM, Oi, NET, etc. are legitimate residential ISPs

// IPinfo Lite API - FREE & UNLIMITED
interface IPInfoLiteResponse {
  ip: string;
  country: string;
  country_name: string;
  continent: string;
  asn: string;
  as_name: string;
  as_domain: string;
}

async function checkIPWithLite(ip: string): Promise<{
  isFromBrazil: boolean;
  isSuspiciousASN: boolean;
  country: string | null;
  asn: string | null;
  asName: string | null;
  asDomain: string | null;
}> {
  const ipinfoApiKey = Deno.env.get("IPINFO_API_KEY");
  
  // Default response if API key not configured or IP is unknown
  if (!ipinfoApiKey || ip === "unknown") {
    return { 
      isFromBrazil: true, // Assume Brazil if can't check
      isSuspiciousASN: false, 
      country: null, 
      asn: null, 
      asName: null, 
      asDomain: null 
    };
  }

  try {
    const response = await fetch(`https://api.ipinfo.io/lite/${ip}?token=${ipinfoApiKey}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.error(`IPInfo Lite API error: ${response.status}`);
      return { 
        isFromBrazil: true, 
        isSuspiciousASN: false, 
        country: null, 
        asn: null, 
        asName: null, 
        asDomain: null 
      };
    }

    const data: IPInfoLiteResponse = await response.json();
    
    const isFromBrazil = data.country === 'BR';
    const isSuspiciousASN = SUSPICIOUS_ASNS.includes(data.asn);

    console.log(`IPInfo Lite check for ${ip}: Country=${data.country}, ASN=${data.asn}, Org=${data.as_name}, Suspicious=${isSuspiciousASN}`);

    return {
      isFromBrazil,
      isSuspiciousASN,
      country: data.country || null,
      asn: data.asn || null,
      asName: data.as_name || null,
      asDomain: data.as_domain || null,
    };
  } catch (error) {
    console.error("Error checking IP with Lite API:", error);
    return { 
      isFromBrazil: true, 
      isSuspiciousASN: false, 
      country: null, 
      asn: null, 
      asName: null, 
      asDomain: null 
    };
  }
}

// ========== TRACKING FUNCTIONS ==========

function generateTrackedWhatsAppLink(
  baseLink: string,
  offerTitle: string,
  offerId: string,
  affiliateId?: string | null
): string {
  const waNumber = baseLink.replace('https://wa.me/', '').split('?')[0];
  const message = `Olá!\nVi a oferta "${offerTitle}" no CliLin.`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${waNumber}?text=${encodedMessage}`;
}

function generateTrackedSiteLink(
  baseLink: string,
  offerTitle: string,
  offerId: string,
  city: string,
  affiliateId?: string | null
): string {
  try {
    const url = new URL(baseLink);
    url.searchParams.set('utm_source', 'clilin');
    url.searchParams.set('utm_medium', 'offer');
    
    const campaign = offerTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 50);
    url.searchParams.set('utm_campaign', campaign);
    
    const term = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');
    url.searchParams.set('utm_term', term);
    
    if (affiliateId) {
      url.searchParams.set('utm_content', `ref_${affiliateId.substring(0, 8)}`);
    }
    
    url.searchParams.set('clilin_ref', offerId.substring(0, 8));
    return url.toString();
  } catch {
    return baseLink;
  }
}

function getTrackedRedirectUrl(
  linkDestination: string,
  linkType: string,
  offerTitle: string,
  offerId: string,
  city: string,
  affiliateId?: string | null
): string {
  if (linkType === 'WHATSAPP' || linkDestination.includes('wa.me')) {
    return generateTrackedWhatsAppLink(linkDestination, offerTitle, offerId, affiliateId);
  }
  return generateTrackedSiteLink(linkDestination, offerTitle, offerId, city, affiliateId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      offerId, 
      affiliateId, 
      fingerprint, 
      userAgent, 
      clickType = 'MAIN',
      sessionToken,
      deviceId,
      advancedFingerprint,
      timezoneOffset,
      browserTimezone
    } = await req.json();

    const clientIp = getClientIp(req);

    console.log(`Processing click - Offer: ${offerId}, IP: ${clientIp}, Type: ${clickType}, TZ: ${timezoneOffset}`);

    if (!offerId) {
      return new Response(
        JSON.stringify({ error: "Offer ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get offer details with company profile
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(`
        id,
        title,
        link_type,
        company_id,
        link_destination,
        active,
        city,
        max_cpc_bid,
        current_offer_score,
        profiles!offers_company_id_fkey(id, balance, user_id, instagram_url)
      `)
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      console.error("Offer not found:", offerError);
      return new Response(
        JSON.stringify({ error: "Oferta não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!offer.active) {
      return new Response(
        JSON.stringify({ error: "Oferta não está mais ativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyProfile = offer.profiles as any;

    // If it's an Instagram click, it's FREE - just record and return
    if (clickType === 'INSTAGRAM') {
      await supabase.from("offer_clicks").insert({
        offer_id: offerId,
        affiliate_id: affiliateId || null,
        client_ip: clientIp,
        user_agent: userAgent,
        click_type: 'INSTAGRAM',
      });

      console.log(`Instagram click recorded for offer ${offerId} - FREE`);

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: companyProfile.instagram_url || offer.link_destination,
          clickType: 'INSTAGRAM',
          charged: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== IP VERIFICATION WITH IPINFO LITE ==========
    const ipCheck = await checkIPWithLite(clientIp);
    
    // Block non-Brazilian IPs
    if (!ipCheck.isFromBrazil && ipCheck.country !== null) {
      console.log(`Non-Brazilian IP detected: ${clientIp}, Country: ${ipCheck.country} - Blocking click`);
      
      await supabase.from("offer_clicks").insert({
        offer_id: offerId,
        affiliate_id: null,
        client_ip: clientIp,
        user_agent: userAgent,
        click_type: 'GEO_BLOCKED',
        is_vpn: false,
        is_proxy: false,
        ip_country: ipCheck.country,
        ip_city: null,
        ip_org: ipCheck.asName,
      });

      const blockedRedirectUrl = getTrackedRedirectUrl(
        offer.link_destination,
        offer.link_type,
        offer.title,
        offerId,
        offer.city,
        null
      );

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: blockedRedirectUrl,
          clickType: 'GEO_BLOCKED',
          charged: false,
          reason: "non_brazilian_ip"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Block suspicious ASNs (hosting/VPN providers)
    if (ipCheck.isSuspiciousASN) {
      console.log(`Suspicious ASN detected: ${ipCheck.asn} (${ipCheck.asName}) - Blocking click`);
      
      if (deviceId) {
        const { data: existingDevice } = await supabase
          .from("device_fingerprints")
          .select("*")
          .eq("device_id", deviceId)
          .maybeSingle();

        if (existingDevice) {
          await supabase
            .from("device_fingerprints")
            .update({ 
              vpn_detected_count: (existingDevice.vpn_detected_count || 0) + 1,
              last_vpn_check_at: new Date().toISOString(),
              is_suspicious: true
            })
            .eq("id", existingDevice.id);
        }
      }

      await supabase.from("offer_clicks").insert({
        offer_id: offerId,
        affiliate_id: null,
        client_ip: clientIp,
        user_agent: userAgent,
        click_type: 'VPN_BLOCKED',
        is_vpn: true,
        is_proxy: false,
        ip_country: ipCheck.country,
        ip_city: null,
        ip_org: `${ipCheck.asn} - ${ipCheck.asName}`,
      });

      const blockedRedirectUrl = getTrackedRedirectUrl(
        offer.link_destination,
        offer.link_type,
        offer.title,
        offerId,
        offer.city,
        null
      );

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: blockedRedirectUrl,
          clickType: 'VPN_BLOCKED',
          charged: false,
          reason: "suspicious_asn_detected"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== GEOLOCATION VERIFICATION ==========
    const geoMismatch = !isTimezoneConsistentWithBrazil(timezoneOffset);
    const expectedTimezone = getExpectedTimezone(timezoneOffset);

    // Additional check: IP country should be BR for Brazil-focused platform (already handled above)
    const ipCountryMismatch = ipCheck.country && ipCheck.country !== "BR";

    if (geoMismatch && timezoneOffset !== null && timezoneOffset !== undefined) {
      console.log(`Geolocation mismatch detected - TZ offset: ${timezoneOffset} (expected Brazil: -120 to -300)`);
      
      if (deviceId) {
        const { data: existingDevice } = await supabase
          .from("device_fingerprints")
          .select("*")
          .eq("device_id", deviceId)
          .maybeSingle();

        if (existingDevice) {
          await supabase
            .from("device_fingerprints")
            .update({ 
              geo_mismatch_count: (existingDevice.geo_mismatch_count || 0) + 1,
              browser_timezone: browserTimezone || expectedTimezone,
              is_suspicious: (existingDevice.geo_mismatch_count || 0) >= 2
            })
            .eq("id", existingDevice.id);
        }
      }
    }

    // ========== ANTI-FRAUD CHECKS FOR MAIN CLICKS ==========

    // 1. Session validation
    if (sessionToken) {
      const { data: session } = await supabase
        .from("page_sessions")
        .select("*")
        .eq("session_token", sessionToken)
        .eq("offer_id", offerId)
        .maybeSingle();

      if (session && !session.validated) {
        const sessionAge = Date.now() - new Date(session.started_at).getTime();
        
        if (sessionAge < MIN_SESSION_AGE_MS) {
          console.log(`Session too young - Age: ${sessionAge}ms`);
          return new Response(
            JSON.stringify({ 
              error: "Clique muito rápido. Aguarde um momento.",
              blocked: true,
              reason: "session_too_young"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("page_sessions")
          .update({ validated: true })
          .eq("id", session.id);
      }
    }

    // 2. Advanced fingerprint check
    if (deviceId && advancedFingerprint) {
      const { data: existingDevice } = await supabase
        .from("device_fingerprints")
        .select("*")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (existingDevice?.blocked) {
        console.log(`Blocked device detected - DeviceId: ${deviceId}`);
        return new Response(
          JSON.stringify({ 
            error: "Dispositivo bloqueado por atividade suspeita.",
            blocked: true,
            reason: "device_blocked"
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingDevice && existingDevice.ip_address !== clientIp) {
        const timeSinceLastSeen = Date.now() - new Date(existingDevice.last_seen_at).getTime();
        const hoursAgo = timeSinceLastSeen / (1000 * 60 * 60);

        if (hoursAgo < 1) {
          console.log(`Suspicious: same deviceId from different IP within 1 hour`);
          await supabase
            .from("device_fingerprints")
            .update({ is_suspicious: true })
            .eq("id", existingDevice.id);
        }
      }

      await supabase
        .from("device_fingerprints")
        .upsert({
          device_id: deviceId,
          ip_address: clientIp,
          fingerprint_data: advancedFingerprint,
          last_seen_at: new Date().toISOString(),
          browser_timezone: browserTimezone || null,
          expected_country: ipCheck.country || null,
        }, { onConflict: 'device_id,ip_address' });
    }

    // 3. Global rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentClickCount } = await supabase
      .from("offer_clicks")
      .select("*", { count: "exact", head: true })
      .eq("client_ip", clientIp)
      .gte("created_at", oneHourAgo);

    if (recentClickCount && recentClickCount >= GLOBAL_RATE_LIMIT_PER_HOUR) {
      console.log(`Rate limit exceeded for IP ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: "Muitos cliques detectados. Tente novamente mais tarde.",
          blocked: true,
          reason: "rate_limit"
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Check 24h cooldown per IP/offer
    const cooldownTime = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
    const { data: existingRateLimit } = await supabase
      .from("click_rate_limits")
      .select("*")
      .eq("offer_id", offerId)
      .eq("ip_address", clientIp)
      .gte("last_click_at", cooldownTime)
      .maybeSingle();

    if (existingRateLimit) {
      console.log(`Duplicate click detected - IP: ${clientIp}, Offer: ${offerId}`);
      
      await supabase
        .from("click_rate_limits")
        .update({ 
          click_count: existingRateLimit.click_count + 1,
          last_click_at: new Date().toISOString()
        })
        .eq("id", existingRateLimit.id);

      await supabase.from("offer_clicks").insert({
        offer_id: offerId,
        affiliate_id: null,
        client_ip: clientIp,
        user_agent: userAgent,
        click_type: 'DUPLICATE',
        timezone_offset: timezoneOffset,
        expected_timezone: expectedTimezone,
        geo_mismatch: geoMismatch,
        is_vpn: ipCheck.isSuspiciousASN,
        is_proxy: false,
        ip_country: ipCheck.country,
        ip_city: null,
        ip_org: ipCheck.asName,
      });

      const duplicateRedirectUrl = getTrackedRedirectUrl(
        offer.link_destination,
        offer.link_type,
        offer.title,
        offerId,
        offer.city,
        null
      );

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: duplicateRedirectUrl,
          clickType: 'DUPLICATE',
          charged: false,
          reason: "already_clicked_today"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Check for affiliate self-click fraud
    let validAffiliateId = affiliateId;
    if (affiliateId) {
      const { data: affiliateProfile } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("id", affiliateId)
        .maybeSingle();

      if (affiliateProfile) {
        const { data: affiliateClicks } = await supabase
          .from("offer_clicks")
          .select("client_ip")
          .eq("affiliate_id", affiliateId)
          .limit(20);

        const affiliateIps = new Set(affiliateClicks?.map(c => c.client_ip));
        
        if (affiliateIps.has(clientIp)) {
          console.log(`Self-click detected - Affiliate: ${affiliateId}, IP: ${clientIp}`);
          validAffiliateId = null;
        }
      }
    }

    // ========== CALCULATE DYNAMIC CPC ==========
    const { data: realCpc } = await supabase
      .rpc("calculate_real_cpc", { p_offer_id: offerId, p_city: offer.city });
    
    const cpcCost = realCpc || 5;
    
    console.log(`Dynamic CPC calculated - Offer: ${offerId}, CPC: ${cpcCost}, Score: ${offer.current_offer_score}`);

    const { data: pricingConfig } = await supabase
      .from("pricing_config")
      .select("*")
      .limit(1)
      .single();
    
    const affiliateShare = pricingConfig?.affiliate_share || 0.60;

    // Check company balance
    if (companyProfile.balance < cpcCost) {
      await supabase
        .from("offers")
        .update({ active: false })
        .eq("id", offerId);

      return new Response(
        JSON.stringify({ error: "Empresa sem créditos suficientes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Record rate limit entry
    await supabase.from("click_rate_limits").upsert({
      offer_id: offerId,
      ip_address: clientIp,
      fingerprint: fingerprint || null,
      click_count: 1,
      first_click_at: new Date().toISOString(),
      last_click_at: new Date().toISOString(),
    }, { onConflict: 'offer_id,ip_address' });

    // 2. Debit company
    const { error: debitError } = await supabase
      .from("profiles")
      .update({ balance: companyProfile.balance - cpcCost })
      .eq("id", companyProfile.id);

    if (debitError) {
      console.error("Error debiting company:", debitError);
      throw new Error("Erro ao processar pagamento");
    }

    // 3. Record company transaction
    await supabase.from("transactions").insert({
      user_id: companyProfile.id,
      amount: -cpcCost,
      type: "CLICK_COST",
      description: `Clique na oferta (CPC: ${cpcCost})`,
      offer_id: offerId,
    });

    // 4. Credit affiliate if valid AND not banned
    let actualAffiliatePayout = 0;
    if (validAffiliateId) {
      const { data: affiliateProfile } = await supabase
        .from("profiles")
        .select("id, balance, banned, balance_frozen")
        .eq("id", validAffiliateId)
        .single();

      // Skip payout if affiliate is banned or balance is frozen
      if (affiliateProfile?.banned || affiliateProfile?.balance_frozen) {
        console.log(`Affiliate ${validAffiliateId} is banned/frozen - no payout`);
        validAffiliateId = null;
      } else if (affiliateProfile) {

      if (affiliateProfile) {
        const { data: multiplierResult } = await supabase
          .rpc("get_commission_multiplier", { affiliate_profile_id: validAffiliateId });

        const multiplier = multiplierResult || 1.0;
        const basePayout = Math.floor(cpcCost * affiliateShare);
        actualAffiliatePayout = Math.floor(basePayout * multiplier);

        await supabase
          .from("profiles")
          .update({ balance: affiliateProfile.balance + actualAffiliatePayout })
          .eq("id", affiliateProfile.id);

        await supabase.from("transactions").insert({
          user_id: affiliateProfile.id,
          amount: actualAffiliatePayout,
          type: "CLICK_EARNING",
          description: `Comissão por clique (CPC: ${cpcCost}, ${multiplier}x)`,
          offer_id: offerId,
        });

        await supabase.rpc("update_affiliate_stats", { 
          affiliate_profile_id: validAffiliateId, 
          earnings: actualAffiliatePayout 
        });

        // Check if affiliate entered Top 10 weekly
        const { data: topAffiliates } = await supabase
          .from("affiliate_stats")
          .select("affiliate_id, clicks_this_week")
          .order("clicks_this_week", { ascending: false })
          .limit(10);

        if (topAffiliates) {
          const position = topAffiliates.findIndex(a => a.affiliate_id === validAffiliateId) + 1;
          
          if (position > 0 && position <= 10) {
            const { data: existingNotif } = await supabase
              .from("notifications")
              .select("id")
              .eq("user_id", validAffiliateId)
              .eq("type", "TOP_10")
              .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingNotif) {
              await supabase.from("notifications").insert({
                user_id: validAffiliateId,
                type: "TOP_10",
                title: "Parabéns! Você entrou no Top 10! 🏆",
                message: `Você está na posição #${position} do ranking semanal!`,
                data: { position },
              });
            }
          }
        }
      }
      }
    }

    // 5. Record click with all tracking data
    await supabase.from("offer_clicks").insert({
      offer_id: offerId,
      affiliate_id: validAffiliateId || null,
      client_ip: clientIp,
      user_agent: userAgent,
      click_type: 'MAIN',
      timezone_offset: timezoneOffset,
      expected_timezone: expectedTimezone,
      geo_mismatch: geoMismatch || ipCountryMismatch,
      is_vpn: ipCheck.isSuspiciousASN,
      is_proxy: false,
      ip_country: ipCheck.country,
      ip_city: null,
      ip_org: ipCheck.asName,
    });

    // 6. Increment click count
    await supabase.rpc("increment_offer_clicks", { offer_id: offerId });

    const trackedRedirectUrl = getTrackedRedirectUrl(
      offer.link_destination,
      offer.link_type,
      offer.title,
      offerId,
      offer.city,
      validAffiliateId
    );

    console.log(`Main click processed - Offer: ${offerId}, CPC: ${cpcCost}, Affiliate: ${validAffiliateId ? `+${actualAffiliatePayout}` : 'none'}, ASN: ${ipCheck.asn}, Country: ${ipCheck.country}`);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: trackedRedirectUrl,
        clickType: 'MAIN',
        charged: true,
        cpc: cpcCost,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-click:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});