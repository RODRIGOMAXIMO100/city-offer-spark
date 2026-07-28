import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate unique session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Extract client IP
function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerId, deviceId, fingerprintHash } = await req.json();

    if (!offerId) {
      return new Response(
        JSON.stringify({ error: "Offer ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientIp = getClientIp(req);
    const sessionToken = generateSessionToken();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean up old sessions (older than 1 hour)
    await supabase.rpc("cleanup_old_sessions");

    // Create new session
    const { error: sessionError } = await supabase
      .from("page_sessions")
      .insert({
        session_token: sessionToken,
        offer_id: offerId,
        client_ip: clientIp,
        device_id: deviceId || null,
        fingerprint_hash: fingerprintHash || null,
      });

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      throw new Error("Erro ao criar sessão");
    }

    console.log(`Session started - Offer: ${offerId}, IP: ${clientIp}, Token: ${sessionToken.substring(0, 8)}...`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken: sessionToken,
        startedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in start-session:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
