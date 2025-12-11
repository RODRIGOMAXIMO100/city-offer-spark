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
          device_id: string
          fingerprint_data: Json | null
          first_seen_at: string | null
          id: string
          ip_address: string
          is_suspicious: boolean | null
          last_seen_at: string | null
        }
        Insert: {
          blocked?: boolean | null
          device_id: string
          fingerprint_data?: Json | null
          first_seen_at?: string | null
          id?: string
          ip_address: string
          is_suspicious?: boolean | null
          last_seen_at?: string | null
        }
        Update: {
          blocked?: boolean | null
          device_id?: string
          fingerprint_data?: Json | null
          first_seen_at?: string | null
          id?: string
          ip_address?: string
          is_suspicious?: boolean | null
          last_seen_at?: string | null
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
          id: string
          offer_id: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id?: string | null
          click_type?: string | null
          client_ip?: string | null
          created_at?: string
          id?: string
          offer_id?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string | null
          click_type?: string | null
          client_ip?: string | null
          created_at?: string
          id?: string
          offer_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
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
          balance: number
          cep: string | null
          city: string
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco_fiscal: string | null
          id: string
          instagram_url: string | null
          name: string
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
          balance?: number
          cep?: string | null
          city?: string
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco_fiscal?: string | null
          id?: string
          instagram_url?: string | null
          name: string
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
          balance?: number
          cep?: string | null
          city?: string
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco_fiscal?: string | null
          id?: string
          instagram_url?: string | null
          name?: string
          nome_completo?: string | null
          pix_key?: string | null
          pix_tipo?: string | null
          preferences?: string[] | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "profiles"
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
      [_ in never]: never
    }
    Functions: {
      calculate_offer_score: { Args: { p_offer_id: string }; Returns: number }
      calculate_real_cpc: {
        Args: { p_city: string; p_offer_id: string }
        Returns: number
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_sessions: { Args: never; Returns: undefined }
      get_affiliate_level: { Args: { total_clicks: number }; Returns: number }
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
      increment_offer_views: { Args: { offer_id: string }; Returns: undefined }
      recalculate_affiliate_stats: {
        Args: { affiliate_profile_id: string }
        Returns: undefined
      }
      recalculate_all_affiliate_stats: { Args: never; Returns: undefined }
      recalculate_all_offer_scores: { Args: never; Returns: undefined }
      reset_weekly_clicks: { Args: never; Returns: undefined }
      update_affiliate_stats: {
        Args: { affiliate_profile_id: string; earnings: number }
        Returns: undefined
      }
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
