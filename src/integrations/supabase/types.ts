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
      author_profile: {
        Row: {
          background_facts: string[]
          bio: string | null
          brand_accent_color: string | null
          contact_email: string | null
          created_at: string
          hero_photo_url: string | null
          hero_video_url: string | null
          id: string
          location: string | null
          name: string
          quotes: string[]
          tagline: string | null
          updated_at: string
        }
        Insert: {
          background_facts?: string[]
          bio?: string | null
          brand_accent_color?: string | null
          contact_email?: string | null
          created_at?: string
          hero_photo_url?: string | null
          hero_video_url?: string | null
          id?: string
          location?: string | null
          name: string
          quotes?: string[]
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          background_facts?: string[]
          bio?: string | null
          brand_accent_color?: string | null
          contact_email?: string | null
          created_at?: string
          hero_photo_url?: string | null
          hero_video_url?: string | null
          id?: string
          location?: string | null
          name?: string
          quotes?: string[]
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          cover_image_url: string | null
          created_at: string
          display_order: number
          full_description: string | null
          genre: string | null
          id: string
          is_featured: boolean
          purchase_link: string | null
          short_description: string | null
          status: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          display_order?: number
          full_description?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean
          purchase_link?: string | null
          short_description?: string | null
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          display_order?: number
          full_description?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean
          purchase_link?: string | null
          short_description?: string | null
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          background: string | null
          book_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          name: string
          quote: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          background?: string | null
          book_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          quote?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          background?: string | null
          book_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          quote?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_links: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          platform_name: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          platform_name: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          platform_name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      landing_page_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          section_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_media: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_visible: boolean
          media_type: string
          page_key: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_visible?: boolean
          media_type?: string
          page_key: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_visible?: boolean
          media_type?: string
          page_key?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      press_mentions: {
        Row: {
          created_at: string
          display_order: number
          headline: string | null
          id: string
          link: string | null
          logo_url: string | null
          source_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          headline?: string | null
          id?: string
          link?: string | null
          logo_url?: string | null
          source_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          headline?: string | null
          id?: string
          link?: string | null
          logo_url?: string | null
          source_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          display_order: number
          id: string
          quote_text: string
          rating: number | null
          reviewer_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          quote_text: string
          rating?: number | null
          reviewer_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          quote_text?: string
          rating?: number | null
          reviewer_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_featured: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_featured?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_featured?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
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
