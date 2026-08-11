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
      answers: {
        Row: {
          id: string
          is_correct: boolean
          member_id: string | null
          question_id: string | null
          selected_option: string
          submitted_at: string | null
          time_taken_seconds: number | null
        }
        Insert: {
          id?: string
          is_correct: boolean
          member_id?: string | null
          question_id?: string | null
          selected_option: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Update: {
          id?: string
          is_correct?: boolean
          member_id?: string | null
          question_id?: string | null
          selected_option?: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
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
      challenge_leaderboard: {
        Row: {
          assessed_at: string | null
          average_time: number | null
          challenge_id: string | null
          correct_count: number | null
          id: string
          member_id: string | null
          rank: number | null
          total_answered: number | null
        }
        Insert: {
          assessed_at?: string | null
          average_time?: number | null
          challenge_id?: string | null
          correct_count?: number | null
          id?: string
          member_id?: string | null
          rank?: number | null
          total_answered?: number | null
        }
        Update: {
          assessed_at?: string | null
          average_time?: number | null
          challenge_id?: string | null
          correct_count?: number | null
          id?: string
          member_id?: string | null
          rank?: number | null
          total_answered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_leaderboard_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_leaderboard_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_winners: {
        Row: {
          announced_at: string | null
          challenge_id: string | null
          created_at: string | null
          id: string
          member_id: string | null
          prize_fulfilled: boolean | null
          rank: number
        }
        Insert: {
          announced_at?: string | null
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          prize_fulfilled?: boolean | null
          rank: number
        }
        Update: {
          announced_at?: string | null
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          prize_fulfilled?: boolean | null
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_winners_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_winners_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          prize_description: string | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          prize_description?: string | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          prize_description?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
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
      debate_comments: {
        Row: {
          content: string
          created_at: string | null
          downvotes: number | null
          id: string
          is_hidden: boolean | null
          member_id: string | null
          parent_id: string | null
          topic_id: string | null
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          is_hidden?: boolean | null
          member_id?: string | null
          parent_id?: string | null
          topic_id?: string | null
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          downvotes?: number | null
          id?: string
          is_hidden?: boolean | null
          member_id?: string | null
          parent_id?: string | null
          topic_id?: string | null
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "debate_comments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debate_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "debate_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debate_comments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "debate_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      debate_topics: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
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
      member_badges: {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          member_id: string | null
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          member_id?: string | null
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          member_id: string | null
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          member_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          member_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          member_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          member_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          member_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          facebook_username: string | null
          full_name: string
          id: string
          is_active: boolean | null
          join_date: string | null
          location: string | null
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          facebook_username?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          location?: string | null
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          facebook_username?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          location?: string | null
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          published_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
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
      questions: {
        Row: {
          challenge_id: string | null
          correct_option: string
          created_at: string | null
          day_number: number
          explanation: string | null
          id: string
          image_url: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          published_at: string | null
          question_text: string
          updated_at: string | null
        }
        Insert: {
          challenge_id?: string | null
          correct_option: string
          created_at?: string | null
          day_number: number
          explanation?: string | null
          id?: string
          image_url?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          published_at?: string | null
          question_text: string
          updated_at?: string | null
        }
        Update: {
          challenge_id?: string | null
          correct_option?: string
          created_at?: string | null
          day_number?: number
          explanation?: string | null
          id?: string
          image_url?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          published_at?: string | null
          question_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
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
