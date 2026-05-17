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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      answers: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          question_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          question_id: string
          value: Json
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          question_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "answers_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_illustrations: {
        Row: {
          category: string
          created_at: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
        }
        Relationships: []
      }
      date_options: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          poll_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          poll_id: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          poll_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "date_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      date_polls: {
        Row: {
          closed_at: string | null
          created_at: string
          event_id: string
          id: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      date_votes: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          option_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          option_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          option_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_votes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "date_options"
            referencedColumns: ["id"]
          },
        ]
      }
      effects: {
        Row: {
          category: string
          config: Json
          created_at: string
          engine: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          category: string
          config: Json
          created_at?: string
          engine: string
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          engine?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      event_cohosts: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cohosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cohosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          audience_filter: string
          body: string
          created_at: string
          event_id: string
          id: string
          sender_user_id: string
          sent_at: string
        }
        Insert: {
          audience_filter: string
          body: string
          created_at?: string
          event_id: string
          id?: string
          sender_user_id: string
          sent_at?: string
        }
        Update: {
          audience_filter?: string
          body?: string
          created_at?: string
          event_id?: string
          id?: string
          sender_user_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sections: {
        Row: {
          created_at: string
          event_id: string
          icon: string
          id: string
          kind: string
          label: string
          order_index: number
          value_text: string | null
          value_url: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          icon: string
          id?: string
          kind: string
          label: string
          order_index?: number
          value_text?: string | null
          value_url?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          icon?: string
          id?: string
          kind?: string
          label?: string
          order_index?: number
          value_text?: string | null
          value_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_maybe: boolean
          allow_rsvp_edit: boolean
          audience: string
          capacity: number | null
          chip_in_text: string | null
          cost_per_person_text: string | null
          cover_image_source: string | null
          cover_image_url: string | null
          cover_overlay_color: string | null
          cover_overlay_enabled: boolean
          cover_overlay_font_id: string | null
          cover_overlay_text: string | null
          created_at: string
          description: string | null
          effect_id: string | null
          ends_at: string | null
          event_password: string | null
          font_preset_id: string
          host_id: string
          id: string
          is_tbd: boolean
          location_address: string | null
          location_hidden_until_rsvp: boolean
          location_text: string | null
          location_url: string | null
          plus_one_enabled: boolean
          plus_one_max_adults: number
          plus_one_max_children: number
          plus_ones: number
          reminders_enabled: boolean
          require_names: boolean
          rsvp_button_style: string
          show_guest_count: boolean
          show_guest_names: boolean
          show_timestamps: boolean
          slug: string
          starts_at: string | null
          status: string
          text_color: string
          text_effect: string
          theme_color_override: string | null
          theme_id: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_maybe?: boolean
          allow_rsvp_edit?: boolean
          audience?: string
          capacity?: number | null
          chip_in_text?: string | null
          cost_per_person_text?: string | null
          cover_image_source?: string | null
          cover_image_url?: string | null
          cover_overlay_color?: string | null
          cover_overlay_enabled?: boolean
          cover_overlay_font_id?: string | null
          cover_overlay_text?: string | null
          created_at?: string
          description?: string | null
          effect_id?: string | null
          ends_at?: string | null
          event_password?: string | null
          font_preset_id: string
          host_id: string
          id?: string
          is_tbd?: boolean
          location_address?: string | null
          location_hidden_until_rsvp?: boolean
          location_text?: string | null
          location_url?: string | null
          plus_one_enabled?: boolean
          plus_one_max_adults?: number
          plus_one_max_children?: number
          plus_ones?: number
          reminders_enabled?: boolean
          require_names?: boolean
          rsvp_button_style?: string
          show_guest_count?: boolean
          show_guest_names?: boolean
          show_timestamps?: boolean
          slug: string
          starts_at?: string | null
          status?: string
          text_color?: string
          text_effect?: string
          theme_color_override?: string | null
          theme_id: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Update: {
          allow_maybe?: boolean
          allow_rsvp_edit?: boolean
          audience?: string
          capacity?: number | null
          chip_in_text?: string | null
          cost_per_person_text?: string | null
          cover_image_source?: string | null
          cover_image_url?: string | null
          cover_overlay_color?: string | null
          cover_overlay_enabled?: boolean
          cover_overlay_font_id?: string | null
          cover_overlay_text?: string | null
          created_at?: string
          description?: string | null
          effect_id?: string | null
          ends_at?: string | null
          event_password?: string | null
          font_preset_id?: string
          host_id?: string
          id?: string
          is_tbd?: boolean
          location_address?: string | null
          location_hidden_until_rsvp?: boolean
          location_text?: string | null
          location_url?: string | null
          plus_one_enabled?: boolean
          plus_one_max_adults?: number
          plus_one_max_children?: number
          plus_ones?: number
          reminders_enabled?: boolean
          require_names?: boolean
          rsvp_button_style?: string
          show_guest_count?: boolean
          show_guest_names?: boolean
          show_timestamps?: boolean
          slug?: string
          starts_at?: string | null
          status?: string
          text_color?: string
          text_effect?: string
          theme_color_override?: string | null
          theme_id?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_cover_overlay_font_id_fkey"
            columns: ["cover_overlay_font_id"]
            isOneToOne: false
            referencedRelation: "font_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_font_preset_id_fkey"
            columns: ["font_preset_id"]
            isOneToOne: false
            referencedRelation: "font_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      font_presets: {
        Row: {
          category: string
          created_at: string
          font_family: string
          font_weight: number
          id: string
          letter_spacing: string
          name: string
          supports_az: boolean
          supports_ru: boolean
          text_transform: string
        }
        Insert: {
          category: string
          created_at?: string
          font_family: string
          font_weight: number
          id?: string
          letter_spacing?: string
          name: string
          supports_az?: boolean
          supports_ru?: boolean
          text_transform?: string
        }
        Update: {
          category?: string
          created_at?: string
          font_family?: string
          font_weight?: number
          id?: string
          letter_spacing?: string
          name?: string
          supports_az?: boolean
          supports_ru?: boolean
          text_transform?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          claimed_user_id: string | null
          created_at: string
          email: string | null
          event_id: string
          guest_message: string | null
          host_notes: string | null
          id: string
          invite_channel: string | null
          invite_token: string
          invited_at: string | null
          name: string
          phone: string | null
          plus_one_adults: number
          plus_one_children: number
          responded_at: string | null
          rsvp: string
        }
        Insert: {
          claimed_user_id?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          guest_message?: string | null
          host_notes?: string | null
          id?: string
          invite_channel?: string | null
          invite_token: string
          invited_at?: string | null
          name?: string
          phone?: string | null
          plus_one_adults?: number
          plus_one_children?: number
          responded_at?: string | null
          rsvp?: string
        }
        Update: {
          claimed_user_id?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          guest_message?: string | null
          host_notes?: string | null
          id?: string
          invite_channel?: string | null
          invite_token?: string
          invited_at?: string | null
          name?: string
          phone?: string | null
          plus_one_adults?: number
          plus_one_children?: number
          responded_at?: string | null
          rsvp?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_claimed_user_id_fkey"
            columns: ["claimed_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          event_id: string
          height: number
          id: string
          storage_path: string
          thumbnail_path: string | null
          uploader_guest_id: string | null
          uploader_user_id: string | null
          width: number
        }
        Insert: {
          created_at?: string
          event_id: string
          height: number
          id?: string
          storage_path: string
          thumbnail_path?: string | null
          uploader_guest_id?: string | null
          uploader_user_id?: string | null
          width: number
        }
        Update: {
          created_at?: string
          event_id?: string
          height?: number
          id?: string
          storage_path?: string
          thumbnail_path?: string | null
          uploader_guest_id?: string | null
          uploader_user_id?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploader_guest_id_fkey"
            columns: ["uploader_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploader_user_id_fkey"
            columns: ["uploader_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          label: string
          options: Json | null
          order_index: number
          required: boolean
          type: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          label: string
          options?: Json | null
          order_index?: number
          required?: boolean
          type: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          label?: string
          options?: Json | null
          order_index?: number
          required?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_reminders: {
        Row: {
          event_id: string
          guest_id: string
          id: string
          reminder_kind: string
          sent_at: string
        }
        Insert: {
          event_id: string
          guest_id: string
          id?: string
          reminder_kind: string
          sent_at?: string
        }
        Update: {
          event_id?: string
          guest_id?: string
          id?: string
          reminder_kind?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_reminders_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          background_type: string
          background_value: Json
          category: string
          created_at: string
          id: string
          name: string
          order_index: number
          recommended_text_color: string
        }
        Insert: {
          background_type: string
          background_value: Json
          category: string
          created_at?: string
          id?: string
          name: string
          order_index?: number
          recommended_text_color: string
        }
        Update: {
          background_type?: string
          background_value?: Json
          category?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          recommended_text_color?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_cohost_candidate: {
        Args: { p_email: string; p_event_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      is_event_host_or_cohost: {
        Args: { p_event_id: string }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
