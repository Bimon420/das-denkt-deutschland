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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      generation_logs: {
        Row: {
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          rejected_count: number
          success: boolean
          topics_count: number
        }
        Insert: {
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          rejected_count?: number
          success: boolean
          topics_count?: number
        }
        Update: {
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          rejected_count?: number
          success?: boolean
          topics_count?: number
        }
        Relationships: []
      }
      canon_snapshots: {
        Row: {
          backup_url: string | null
          content: string
          created_at: string
          gdrive_backed_up_at: string | null
          gdrive_backup_id: string | null
          hash: string
          id: number
          version: string
        }
        Insert: {
          backup_url?: string | null
          content: string
          created_at?: string
          gdrive_backed_up_at?: string | null
          gdrive_backup_id?: string | null
          hash: string
          id?: number
          version: string
        }
        Update: {
          backup_url?: string | null
          content?: string
          created_at?: string
          gdrive_backed_up_at?: string | null
          gdrive_backup_id?: string | null
          hash?: string
          id?: number
          version?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page: string
        }
        Insert: {
          created_at?: string
          id?: string
          page?: string
        }
        Update: {
          created_at?: string
          id?: string
          page?: string
        }
        Relationships: []
      }
      topic_suggestions: {
        Row: {
          created_at: string
          id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          url?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      topic_votes: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "topic_votes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category: string
          created_at: string
          id: string
          left_hidden_meaning: string | null
          left_negative_effects: string | null
          left_position: string
          left_quote: string
          left_sources: Json
          left_speaker: string
          mitte_view: string
          published_at: string
          right_hidden_meaning: string | null
          right_negative_effects: string | null
          right_position: string
          right_quote: string
          right_sources: Json
          right_speaker: string
          tag_type: string
          topic: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          left_hidden_meaning?: string | null
          left_negative_effects?: string | null
          left_position: string
          left_quote: string
          left_sources?: Json
          left_speaker: string
          mitte_view: string
          published_at?: string
          right_hidden_meaning?: string | null
          right_negative_effects?: string | null
          right_position: string
          right_quote: string
          right_sources?: Json
          right_speaker: string
          tag_type: string
          topic: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          left_hidden_meaning?: string | null
          left_negative_effects?: string | null
          left_position?: string
          left_quote?: string
          left_sources?: Json
          left_speaker?: string
          mitte_view?: string
          published_at?: string
          right_hidden_meaning?: string | null
          right_negative_effects?: string | null
          right_position?: string
          right_quote?: string
          right_sources?: Json
          right_speaker?: string
          tag_type?: string
          topic?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
