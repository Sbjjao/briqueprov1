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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          social: string | null
          trust: number
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          social?: string | null
          trust?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          social?: string | null
          trust?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      extra_costs: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          item_id: string
          kind: Database["public"]["Enums"]["cost_kind"]
          spent_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          item_id: string
          kind?: Database["public"]["Enums"]["cost_kind"]
          spent_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string
          kind?: Database["public"]["Enums"]["cost_kind"]
          spent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_costs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_events: {
        Row: {
          amount: number | null
          created_at: string
          detail: string | null
          happened_at: string
          id: string
          item_id: string
          kind: Database["public"]["Enums"]["event_kind"]
          title: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          detail?: string | null
          happened_at?: string
          id?: string
          item_id: string
          kind?: Database["public"]["Enums"]["event_kind"]
          title: string
          user_id?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          detail?: string | null
          happened_at?: string
          id?: string
          item_id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          acquired_at: string | null
          brand: string | null
          category: Database["public"]["Enums"]["item_category"]
          color: string | null
          created_at: string
          description: string | null
          estimated_value: number
          id: string
          model: string | null
          name: string
          origin_trade_id: string | null
          parent_item_id: string | null
          payment_method: string | null
          photos: string[]
          purchase_value: number
          quantity: number
          seller_contact_id: string | null
          serial: string | null
          status: Database["public"]["Enums"]["item_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number
          id?: string
          model?: string | null
          name: string
          origin_trade_id?: string | null
          parent_item_id?: string | null
          payment_method?: string | null
          photos?: string[]
          purchase_value?: number
          quantity?: number
          seller_contact_id?: string | null
          serial?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          acquired_at?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number
          id?: string
          model?: string | null
          name?: string
          origin_trade_id?: string | null
          parent_item_id?: string | null
          payment_method?: string | null
          photos?: string[]
          purchase_value?: number
          quantity?: number
          seller_contact_id?: string | null
          serial?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_seller_contact_id_fkey"
            columns: ["seller_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          buyer_contact_id: string | null
          created_at: string
          fees: number
          id: string
          item_id: string
          listed_value: number
          min_value: number
          payment_method: string | null
          shipping: number
          sold_at: string
          sold_value: number
          user_id: string
        }
        Insert: {
          buyer_contact_id?: string | null
          created_at?: string
          fees?: number
          id?: string
          item_id: string
          listed_value?: number
          min_value?: number
          payment_method?: string | null
          shipping?: number
          sold_at?: string
          sold_value?: number
          user_id?: string
        }
        Update: {
          buyer_contact_id?: string | null
          created_at?: string
          fees?: number
          id?: string
          item_id?: string
          listed_value?: number
          min_value?: number
          payment_method?: string | null
          shipping?: number
          sold_at?: string
          sold_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          cash_paid: number
          cash_received: number
          contact_id: string | null
          created_at: string
          id: string
          in_assigned_value: number
          in_item_id: string | null
          notes: string | null
          out_assigned_value: number
          out_item_id: string | null
          traded_at: string
          user_id: string
        }
        Insert: {
          cash_paid?: number
          cash_received?: number
          contact_id?: string | null
          created_at?: string
          id?: string
          in_assigned_value?: number
          in_item_id?: string | null
          notes?: string | null
          out_assigned_value?: number
          out_item_id?: string | null
          traded_at?: string
          user_id?: string
        }
        Update: {
          cash_paid?: number
          cash_received?: number
          contact_id?: string | null
          created_at?: string
          id?: string
          in_assigned_value?: number
          in_item_id?: string | null
          notes?: string | null
          out_assigned_value?: number
          out_item_id?: string | null
          traded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_in_item_id_fkey"
            columns: ["in_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_out_item_id_fkey"
            columns: ["out_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cost_kind: "frete" | "manutencao" | "pecas" | "taxas" | "outros"
      event_kind:
        | "compra"
        | "gasto"
        | "anuncio"
        | "proposta"
        | "troca"
        | "venda"
        | "nota"
      item_category:
        | "eletronicos"
        | "carros_pecas"
        | "games"
        | "celulares"
        | "informatica"
        | "colecionaveis"
        | "outros"
      item_status:
        | "em_negociacao"
        | "em_estoque"
        | "em_manutencao"
        | "anunciado"
        | "reservado"
        | "trocado"
        | "vendido"
        | "cancelado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      cost_kind: ["frete", "manutencao", "pecas", "taxas", "outros"],
      event_kind: [
        "compra",
        "gasto",
        "anuncio",
        "proposta",
        "troca",
        "venda",
        "nota",
      ],
      item_category: [
        "eletronicos",
        "carros_pecas",
        "games",
        "celulares",
        "informatica",
        "colecionaveis",
        "outros",
      ],
      item_status: [
        "em_negociacao",
        "em_estoque",
        "em_manutencao",
        "anunciado",
        "reservado",
        "trocado",
        "vendido",
        "cancelado",
      ],
    },
  },
} as const
