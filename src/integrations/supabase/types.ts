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
      offers: {
        Row: {
          active: boolean
          city: string
          clicks_count: number
          company_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          expires_at: string
          id: string
          link_destination: string
          link_type: Database["public"]["Enums"]["link_type"]
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
          deleted_at?: string | null
          description?: string | null
          expires_at?: string
          id?: string
          link_destination: string
          link_type?: Database["public"]["Enums"]["link_type"]
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
          deleted_at?: string | null
          description?: string | null
          expires_at?: string
          id?: string
          link_destination?: string
          link_type?: Database["public"]["Enums"]["link_type"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
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
    },
  },
} as const
