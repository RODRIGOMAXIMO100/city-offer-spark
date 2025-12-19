export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_levels: {
        Row: {
          badge_color: string
          benefits: string[] | null
          commission_multiplier: number | null
          id: number
          min_clicks: number
          name: string
        }
        Insert: {
          badge_color: string
          benefits?: string[] | null
          commission_multiplier?: number | null
          id?: number
          min_clicks: number
          name: string
        }
        Update: {
          badge_color?: string
          benefits?: string[] | null
          commission_multiplier?: number | null
          id?: number
          min_clicks?: number
          name?: string
        }
        Relationships: []
      }
      affiliate_monthly_history: {
        Row: {
          affiliate_id: string
          created_at: string | null
          earnings: number | null
          id: string
          leads_count: number | null
          level_achieved: string | null
          month_year: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string | null
          earnings?: number | null
          id?: string
          leads_count?: number | null
          level_achieved?: string | null
          month_year: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string | null
          earnings?: number | null
          id?: string
          leads_count?: number | null
          level_achieved?: string | null
          month_year?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_monthly_history_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_monthly_history_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_stats: {
        Row: {
          affiliate_id: string
          clicks_this_month: number | null
          clicks_this_week: number | null
          current_level_id: number | null
          id: string
          level_progress: number | null
          rank_position: number | null
          total_clicks: number | null
          total_earnings: number | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          clicks_this_month?: number | null
          clicks_this_week?: number | null
          current_level_id?: number | null
          id?: string
          level_progress?: number | null
          rank_position?: number | null
          total_clicks?: number | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          clicks_this_month?: number | null
          clicks_this_week?: number | null
          current_level_id?: number | null
          id?: string
          level_progress?: number | null
          rank_position?: number | null
          total_clicks?: number | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_stats_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: true
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_stats_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_stats_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "affiliate_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      available_cities: {
        Row: {
          activated_at: string | null
          active: boolean | null
          city_name: string
          created_at: string | null
          id: string
          priority: number | null
          scheduled_activation: string | null
          state_code: string
          waitlist_count: number | null
        }
        Insert: {
          activated_at?: string | null
          active?: boolean | null
          city_name: string
          created_at?: string | null
          id?: string
          priority?: number | null
          scheduled_activation?: string | null
          state_code: string
          waitlist_count?: number | null
        }
        Update: {
          activated_at?: string | null
          active?: boolean | null
          city_name?: string
          created_at?: string | null
          id?: string
          priority?: number | null
          scheduled_activation?: string | null
          state_code?: string
          waitlist_count?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category: string
          content: string
          created_at: string | null
          excerpt: string
          faq: Json | null
          featured_image: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          scheduled_for: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_name?: string | null
          category?: string
          content: string
          created_at?: string | null
          excerpt: string
          faq?: Json | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string
          faq?: Json | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      blog_themes: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          id: string
          keywords: string[]
          last_used_at: string | null
          theme: string
          use_count: number | null
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          keywords: string[]
          last_used_at?: string | null
          theme: string
          use_count?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          keywords?: string[]
          last_used_at?: string | null
          theme?: string
          use_count?: number | null
        }
        Relationships: []
      }
      city_waitlist: {
        Row: {
          city_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          notified_at: string | null
          phone: string | null
          role: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          notified_at?: string | null
          phone?: string | null
          role: string
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notified_at?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_waitlist_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "available_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      click_rate_limits: {
        Row: {
          blocked: boolean | null
          click_count: number | null
          fingerprint: string | null
          first_click_at: string | null
          id: string
          ip_address: string
          last_click_at: string | null
          offer_id: string
        }
        Insert: {
          blocked?: boolean | null
          click_count?: number | null
          fingerprint?: string | null
          first_click_at?: string | null
          id?: string
          ip_address: string
          last_click_at?: string | null
          offer_id: string
        }
        Update: {
          blocked?: boolean | null
          click_count?: number | null
          fingerprint?: string | null
          first_click_at?: string | null
          id?: string
          ip_address?: string
          last_click_at?: string | null
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "click_rate_limits_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          blocked: boolean | null
          browser_timezone: string | null
          device_id: string
          expected_country: string | null
          fingerprint_data: Json | null
          first_seen_at: string | null
          geo_mismatch_count: number | null
          id: string
          ip_address: string
          is_suspicious: boolean | null
          last_seen_at: string | null
          last_vpn_check_at: string | null
          vpn_detected_count: number | null
        }
        Insert: {
          blocked?: boolean | null
          browser_timezone?: string | null
          device_id: string
          expected_country?: string | null
          fingerprint_data?: Json | null
          first_seen_at?: string | null
          geo_mismatch_count?: number | null
          id?: string
          ip_address: string
          is_suspicious?: boolean | null
          last_seen_at?: string | null
          last_vpn_check_at?: string | null
          vpn_detected_count?: number | null
        }
        Update: {
          blocked?: boolean | null
          browser_timezone?: string | null
          device_id?: string
          expected_country?: string | null
          fingerprint_data?: Json | null
          first_seen_at?: string | null
          geo_mismatch_count?: number | null
          id?: string
          ip_address?: string
          is_suspicious?: boolean | null
          last_seen_at?: string | null
          last_vpn_check_at?: string | null
          vpn_detected_count?: number | null
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_blacklist: {
        Row: {
          added_by: string | null
          created_at: string | null
          id: string
          reason: string | null
          type: string
          value: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          type: string
          value: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          type?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_blacklist_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_blacklist_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          offer_id: string
          phone_hash: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          offer_id: string
          phone_hash: string
        }
        Update: {
          created_at?: string | null
          id?: string
          offer_id?: string
          phone_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_rate_limits_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          affiliate_id: string | null
          client_ip: string | null
          created_at: string | null
          device_id: string | null
          fingerprint_hash: string | null
          id: string
          is_valid: boolean | null
          name: string
          offer_id: string
          phone_whatsapp: string
          session_token: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id?: string | null
          client_ip?: string | null
          created_at?: string | null
          device_id?: string | null
          fingerprint_hash?: string | null
          id?: string
          is_valid?: boolean | null
          name: string
          offer_id: string
          phone_whatsapp: string
          session_token?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string | null
          client_ip?: string | null
          created_at?: string | null
          device_id?: string | null
          fingerprint_hash?: string | null
          id?: string
          is_valid?: boolean | null
          name?: string
          offer_id?: string
          phone_whatsapp?: string
          session_token?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_clicks: {
        Row: {
          affiliate_id: string | null
          click_type: string | null
          client_ip: string | null
          created_at: string
          expected_timezone: string | null
          geo_mismatch: boolean | null
          id: string
          ip_city: string | null
          ip_country: string | null
          ip_org: string | null
          is_proxy: boolean | null
          is_vpn: boolean | null
          offer_id: string | null
          timezone_offset: number | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id?: string | null
          click_type?: string | null
          client_ip?: string | null
          created_at?: string
          expected_timezone?: string | null
          geo_mismatch?: boolean | null
          id?: string
          ip_city?: string | null
          ip_country?: string | null
          ip_org?: string | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          offer_id?: string | null
          timezone_offset?: number | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string | null
          click_type?: string | null
          client_ip?: string | null
          created_at?: string
          expected_timezone?: string | null
          geo_mismatch?: boolean | null
          id?: string
          ip_city?: string | null
          ip_country?: string | null
          ip_org?: string | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          offer_id?: string | null
          timezone_offset?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_clicks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_scores: {
        Row: {
          calculated_at: string
          ctr_score: number
          id: string
          offer_id: string
          quality_score: number
          relevance_score: number
          reputation_score: number
          total_score: number
        }
        Insert: {
          calculated_at?: string
          ctr_score?: number
          id?: string
          offer_id: string
          quality_score?: number
          relevance_score?: number
          reputation_score?: number
          total_score?: number
        }
        Update: {
          calculated_at?: string
          ctr_score?: number
          id?: string
          offer_id?: string
          quality_score?: number
          relevance_score?: number
          reputation_score?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_scores_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_views: {
        Row: {
          client_ip: string | null
          created_at: string
          id: string
          offer_id: string
        }
        Insert: {
          client_ip?: string | null
          created_at?: string
          id?: string
          offer_id: string
        }
        Update: {
          client_ip?: string | null
          created_at?: string
          id?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_views_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          active: boolean
          city: string
          clicks_count: number
          company_id: string
          created_at: string
          current_offer_score: number
          deleted_at: string | null
          description: string | null
          expires_at: string
          id: string
          images: string[] | null
          leads_count: number | null
          link_destination: string
          link_type: Database["public"]["Enums"]["link_type"]
          max_cpc_bid: number
          price_new: number
          price_old: number
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          active?: boolean
          city: string
          clicks_count?: number
          company_id: string
          created_at?: string
          current_offer_score?: number
          deleted_at?: string | null
          description?: string | null
          expires_at?: string
          id?: string
          images?: string[] | null
          leads_count?: number | null
          link_destination: string
          link_type?: Database["public"]["Enums"]["link_type"]
          max_cpc_bid?: number
          price_new: number
          price_old: number
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          active?: boolean
          city?: string
          clicks_count?: number
          company_id?: string
          created_at?: string
          current_offer_score?: number
          deleted_at?: string | null
          description?: string | null
          expires_at?: string
          id?: string
          images?: string[] | null
          leads_count?: number | null
          link_destination?: string
          link_type?: Database["public"]["Enums"]["link_type"]
          max_cpc_bid?: number
          price_new?: number
          price_old?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sessions: {
        Row: {
          client_ip: string
          device_id: string | null
          fingerprint_hash: string | null
          id: string
          offer_id: string
          session_token: string
          started_at: string | null
          validated: boolean | null
        }
        Insert: {
          client_ip: string
          device_id?: string | null
          fingerprint_hash?: string | null
          id?: string
          offer_id: string
          session_token: string
          started_at?: string | null
          validated?: boolean | null
        }
        Update: {
          client_ip?: string
          device_id?: string | null
          fingerprint_hash?: string | null
          id?: string
          offer_id?: string
          session_token?: string
          started_at?: string | null
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "page_sessions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_brl: number
          amount_credits: number
          asaas_payment_id: string | null
          confirmed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          installments: number | null
          payment_method: string
          pix_code: string | null
          pix_qr_code: string | null
          profile_id: string
          status: string
        }
        Insert: {
          amount_brl: number
          amount_credits: number
          asaas_payment_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installments?: number | null
          payment_method: string
          pix_code?: string | null
          pix_qr_code?: string | null
          profile_id: string
          status?: string
        }
        Update: {
          amount_brl?: number
          amount_credits?: number
          asaas_payment_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installments?: number | null
          payment_method?: string
          pix_code?: string | null
          pix_qr_code?: string | null
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          affiliate_share: number
          created_at: string
          default_cpc: number
          id: string
          max_cpc: number
          min_cpc: number
          updated_at: string
        }
        Insert: {
          affiliate_share?: number
          created_at?: string
          default_cpc?: number
          id?: string
          max_cpc?: number
          min_cpc?: number
          updated_at?: string
        }
        Update: {
          affiliate_share?: number
          created_at?: string
          default_cpc?: number
          id?: string
          max_cpc?: number
          min_cpc?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          asaas_customer_id: string | null
          avatar_url: string | null
          balance: number
          balance_frozen: boolean | null
          banned: boolean | null
          banned_at: string | null
          banned_by: string | null
          banned_reason: string | null
          cep: string | null
          city: string
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco_fiscal: string | null
          fraud_score: number | null
          id: string
          instagram_url: string | null
          name: string
          niche_confidence: number | null
          niche_id: string | null
          niche_last_updated: string | null
          nome_completo: string | null
          pix_key: string | null
          pix_tipo: string | null
          preferences: string[] | null
          razao_social: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          avatar_url?: string | null
          balance?: number
          balance_frozen?: boolean | null
          banned?: boolean | null
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          cep?: string | null
          city?: string
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco_fiscal?: string | null
          fraud_score?: number | null
          id?: string
          instagram_url?: string | null
          name: string
          niche_confidence?: number | null
          niche_id?: string | null
          niche_last_updated?: string | null
          nome_completo?: string | null
          pix_key?: string | null
          pix_tipo?: string | null
          preferences?: string[] | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          avatar_url?: string | null
          balance?: number
          balance_frozen?: boolean | null
          banned?: boolean | null
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          cep?: string | null
          city?: string
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco_fiscal?: string | null
          fraud_score?: number | null
          id?: string
          instagram_url?: string | null
          name?: string
          niche_confidence?: number | null
          niche_id?: string | null
          niche_last_updated?: string | null
          nome_completo?: string | null
          pix_key?: string | null
          pix_tipo?: string | null
          preferences?: string[] | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      short_links: {
        Row: {
          affiliate_id: string
          clicks: number | null
          code: string
          created_at: string | null
          id: string
          offer_id: string
        }
        Insert: {
          affiliate_id: string
          clicks?: number | null
          code: string
          created_at?: string | null
          id?: string
          offer_id: string
        }
        Update: {
          affiliate_id?: string
          clicks?: number | null
          code?: string
          created_at?: string | null
          id?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "short_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "short_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_rate_limits: {
        Row: {
          blocked: boolean | null
          created_at: string | null
          email: string | null
          id: string
          ip_address: string
        }
        Insert: {
          blocked?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          blocked?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          changefreq: string | null
          created_at: string | null
          id: string
          include_in_sitemap: boolean | null
          name: string
          path: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          changefreq?: string | null
          created_at?: string | null
          id?: string
          include_in_sitemap?: boolean | null
          name: string
          path: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          changefreq?: string | null
          created_at?: string | null
          id?: string
          include_in_sitemap?: boolean | null
          name?: string
          path?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          offer_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          offer_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          offer_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          action_type: string
          balance_at_ban: number
          banned_by: string
          created_at: string | null
          evidence: Json | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          action_type?: string
          balance_at_ban?: number
          banned_by: string
          created_at?: string | null
          evidence?: Json | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          action_type?: string
          balance_at_ban?: number
          banned_by?: string
          created_at?: string | null
          evidence?: Json | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          bonus_earned: number | null
          checklist_items: Json | null
          completed_at: string | null
          created_at: string | null
          dismissed: boolean | null
          id: string
          role: string
          tour_completed: boolean | null
          tour_current_step: number | null
          updated_at: string | null
          user_id: string
          welcome_bonus_claimed: boolean | null
        }
        Insert: {
          bonus_earned?: number | null
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          role: string
          tour_completed?: boolean | null
          tour_current_step?: number | null
          updated_at?: string | null
          user_id: string
          welcome_bonus_claimed?: boolean | null
        }
        Update: {
          bonus_earned?: number | null
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          role?: string
          tour_completed?: boolean | null
          tour_current_step?: number | null
          updated_at?: string | null
          user_id?: string
          welcome_bonus_claimed?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          amount_brl: number
          asaas_transfer_id: string | null
          cpf: string
          created_at: string | null
          fraud_reasons: string[] | null
          fraud_score: number | null
          id: string
          nome_completo: string
          pix_key: string
          pix_tipo: string
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_brl: number
          asaas_transfer_id?: string | null
          cpf: string
          created_at?: string | null
          fraud_reasons?: string[] | null
          fraud_score?: number | null
          id?: string
          nome_completo: string
          pix_key: string
          pix_tipo: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_brl?: number
          asaas_transfer_id?: string | null
          cpf?: string
          created_at?: string | null
          fraud_reasons?: string[] | null
          fraud_score?: number | null
          id?: string
          nome_completo?: string
          pix_key?: string
          pix_tipo?: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      affiliate_ranking_public: {
        Row: {
          affiliate_id: string | null
          affiliate_name: string | null
          badge_color: string | null
          current_level_id: number | null
          level_name: string | null
          rank_position: number | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_stats_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: true
            referencedRelation: "company_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_stats_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_stats_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "affiliate_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      company_public_info: {
        Row: {
          city: string | null
          id: string | null
          instagram_url: string | null
          name: string | null
        }
        Insert: {
          city?: string | null
          id?: string | null
          instagram_url?: string | null
          name?: string | null
        }
        Update: {
          city?: string | null
          id?: string | null
          instagram_url?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_and_reset_monthly_stats: { Args: never; Returns: undefined }
      calculate_offer_score: { Args: { p_offer_id: string }; Returns: number }
      calculate_real_cpc: {
        Args: { p_city: string; p_offer_id: string }
        Returns: number
      }
      calculate_real_cpl: {
        Args: { p_city: string; p_offer_id: string }
        Returns: number
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_sessions: { Args: never; Returns: undefined }
      cleanup_old_signup_rate_limits: { Args: never; Returns: undefined }
      create_fraud_alert: {
        Args: {
          p_alert_type: string
          p_data?: Json
          p_description: string
          p_severity: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      credit_onboarding_bonus: {
        Args: { p_amount: number; p_bonus_type: string; p_user_id: string }
        Returns: boolean
      }
      get_affiliate_level: { Args: { total_clicks: number }; Returns: number }
      get_affiliate_level_monthly: {
        Args: { monthly_leads: number }
        Returns: number
      }
      get_commission_multiplier: {
        Args: { affiliate_profile_id: string }
        Returns: number
      }
      get_current_profile_id: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_offer_clicks: { Args: { offer_id: string }; Returns: undefined }
      increment_offer_leads: { Args: { offer_id: string }; Returns: undefined }
      increment_offer_views: { Args: { offer_id: string }; Returns: undefined }
      recalculate_affiliate_stats: {
        Args: { affiliate_profile_id: string }
        Returns: undefined
      }
      recalculate_all_affiliate_stats: { Args: never; Returns: undefined }
      recalculate_all_monthly_levels: { Args: never; Returns: undefined }
      recalculate_all_offer_scores: { Args: never; Returns: undefined }
      reset_weekly_clicks: { Args: never; Returns: undefined }
      update_affiliate_fraud_score: {
        Args: { p_affiliate_id: string; p_score_delta: number }
        Returns: number
      }
      update_affiliate_stats: {
        Args: { affiliate_profile_id: string; earnings: number }
        Returns: undefined
      }
      update_affiliate_stats_lead: {
        Args: { affiliate_profile_id: string; earnings: number }
        Returns: undefined
      }
      update_ranking_positions: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "COMPANY" | "AFFILIATE" | "CLIENT" | "ADMIN"
      link_type: "WHATSAPP" | "MENU" | "SITE"
      transaction_type:
        | "DEPOSIT"
        | "CLICK_COST"
        | "CLICK_EARNING"
        | "WITHDRAW"
        | "PLATFORM_FEE"
        | "LEAD_COST"
        | "LEAD_EARNING"
        | "ADMIN_ADJUSTMENT"
      withdrawal_status:
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | "PROCESSING"
        | "COMPLETED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["COMPANY", "AFFILIATE", "CLIENT", "ADMIN"],
      link_type: ["WHATSAPP", "MENU", "SITE"],
      transaction_type: [
        "DEPOSIT",
        "CLICK_COST",
        "CLICK_EARNING",
        "WITHDRAW",
        "PLATFORM_FEE",
        "LEAD_COST",
        "LEAD_EARNING",
        "ADMIN_ADJUSTMENT",
      ],
      withdrawal_status: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "PROCESSING",
        "COMPLETED",
      ],
    },
  },
} as const
