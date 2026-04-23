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
      ai_usage: {
        Row: {
          cost_cents: number
          created_at: string
          id: string
          input_tokens: number
          model: string
          module: Database["public"]["Enums"]["ai_usage_module"]
          output_tokens: number
          prompt_version: string | null
          ref_id: string | null
          ref_type: string | null
          user_id: string
        }
        Insert: {
          cost_cents?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model: string
          module: Database["public"]["Enums"]["ai_usage_module"]
          output_tokens?: number
          prompt_version?: string | null
          ref_id?: string | null
          ref_type?: string | null
          user_id: string
        }
        Update: {
          cost_cents?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string
          module?: Database["public"]["Enums"]["ai_usage_module"]
          output_tokens?: number
          prompt_version?: string | null
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      algorithm_insights: {
        Row: {
          active_from: string
          active_to: string | null
          approved_at: string
          approved_by: string | null
          bullets: string[]
          id: string
          next_review_due: string | null
          section: Database["public"]["Enums"]["algorithm_insight_section"]
          sources: string[]
          user_id: string
          version: number
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          approved_at?: string
          approved_by?: string | null
          bullets: string[]
          id?: string
          next_review_due?: string | null
          section: Database["public"]["Enums"]["algorithm_insight_section"]
          sources?: string[]
          user_id: string
          version: number
        }
        Update: {
          active_from?: string
          active_to?: string | null
          approved_at?: string
          approved_by?: string | null
          bullets?: string[]
          id?: string
          next_review_due?: string | null
          section?: Database["public"]["Enums"]["algorithm_insight_section"]
          sources?: string[]
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      attachments: {
        Row: {
          ai_suggested_description: string | null
          alt_text: string | null
          created_at: string
          id: string
          metadata: Json
          order_index: number
          post_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          url_or_placeholder: string
          user_id: string
        }
        Insert: {
          ai_suggested_description?: string | null
          alt_text?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          order_index?: number
          post_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          url_or_placeholder: string
          user_id: string
        }
        Update: {
          ai_suggested_description?: string | null
          alt_text?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          order_index?: number
          post_id?: string
          type?: Database["public"]["Enums"]["attachment_type"]
          url_or_placeholder?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_settings: {
        Row: {
          hard_stop_at_percent: number
          monthly_cap_cents: number
          updated_at: string
          user_id: string
          warn_at_percent: number
        }
        Insert: {
          hard_stop_at_percent?: number
          monthly_cap_cents?: number
          updated_at?: string
          user_id: string
          warn_at_percent?: number
        }
        Update: {
          hard_stop_at_percent?: number
          monthly_cap_cents?: number
          updated_at?: string
          user_id?: string
          warn_at_percent?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_name: string
          generation_guidance: string | null
          id: string
          slug: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          generation_guidance?: string | null
          id?: string
          slug: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          generation_guidance?: string | null
          id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          core_model: string | null
          created_at: string
          id: string
          legal_name: string | null
          name: string
          scraped_urls: string[]
          services: string[]
          tagline: string | null
          target_segments: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          core_model?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          name: string
          scraped_urls?: string[]
          services?: string[]
          tagline?: string | null
          target_segments?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          core_model?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          name?: string
          scraped_urls?: string[]
          services?: string[]
          tagline?: string | null
          target_segments?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          actor: string
          created_at: string
          id: string
          payload: Json
          ref_id: string | null
          ref_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor: string
          created_at?: string
          id?: string
          payload?: Json
          ref_id?: string | null
          ref_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor?: string
          created_at?: string
          id?: string
          payload?: Json
          ref_id?: string | null
          ref_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      hooks: {
        Row: {
          category_ids: string[]
          created_at: string
          fetched_at: string
          id: string
          idea_id: string | null
          published_at: string | null
          raw_content: string | null
          relevance_score: number | null
          source_id: string | null
          status: Database["public"]["Enums"]["hook_status"]
          summary: string
          title: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category_ids?: string[]
          created_at?: string
          fetched_at?: string
          id?: string
          idea_id?: string | null
          published_at?: string | null
          raw_content?: string | null
          relevance_score?: number | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["hook_status"]
          summary: string
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category_ids?: string[]
          created_at?: string
          fetched_at?: string
          id?: string
          idea_id?: string | null
          published_at?: string | null
          raw_content?: string | null
          relevance_score?: number | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["hook_status"]
          summary?: string
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hooks_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hooks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          ai_summary: string | null
          audio_duration_seconds: number | null
          audio_url: string | null
          content: string
          created_at: string
          created_via: string
          id: string
          input_type: Database["public"]["Enums"]["idea_input_type"]
          raw_transcription: string | null
          status: Database["public"]["Enums"]["idea_status"]
          suggested_category_ids: string[]
          suggested_pain_point_ids: string[]
          suggested_usp_ids: string[]
          tags: string[]
          updated_at: string
          used_in_post_ids: string[]
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          audio_duration_seconds?: number | null
          audio_url?: string | null
          content: string
          created_at?: string
          created_via?: string
          id?: string
          input_type: Database["public"]["Enums"]["idea_input_type"]
          raw_transcription?: string | null
          status?: Database["public"]["Enums"]["idea_status"]
          suggested_category_ids?: string[]
          suggested_pain_point_ids?: string[]
          suggested_usp_ids?: string[]
          tags?: string[]
          updated_at?: string
          used_in_post_ids?: string[]
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          audio_duration_seconds?: number | null
          audio_url?: string | null
          content?: string
          created_at?: string
          created_via?: string
          id?: string
          input_type?: Database["public"]["Enums"]["idea_input_type"]
          raw_transcription?: string | null
          status?: Database["public"]["Enums"]["idea_status"]
          suggested_category_ids?: string[]
          suggested_pain_point_ids?: string[]
          suggested_usp_ids?: string[]
          tags?: string[]
          updated_at?: string
          used_in_post_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      language_corpus: {
        Row: {
          chunk: string
          collected_at: string
          embedding: string | null
          id: string
          source_url: string | null
          topic_tags: string[]
          user_id: string
        }
        Insert: {
          chunk: string
          collected_at?: string
          embedding?: string | null
          id?: string
          source_url?: string | null
          topic_tags?: string[]
          user_id: string
        }
        Update: {
          chunk?: string
          collected_at?: string
          embedding?: string | null
          id?: string
          source_url?: string | null
          topic_tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      pain_points: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          priority: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          name: string
          priority?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          priority?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          active: boolean
          created_at: string
          guidance: string[]
          hard_rules: string[]
          id: string
          name: string
          preference_weights: Json
          snippets: string[]
          target_audience_notes: string | null
          tone_of_voice: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          guidance?: string[]
          hard_rules?: string[]
          id?: string
          name: string
          preference_weights?: Json
          snippets?: string[]
          target_audience_notes?: string | null
          tone_of_voice?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          guidance?: string[]
          hard_rules?: string[]
          id?: string
          name?: string
          preference_weights?: Json
          snippets?: string[]
          target_audience_notes?: string | null
          tone_of_voice?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_categories: {
        Row: {
          category_id: string
          is_primary: boolean
          post_id: string
        }
        Insert: {
          category_id: string
          is_primary?: boolean
          post_id: string
        }
        Update: {
          category_id?: string
          is_primary?: boolean
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          clicks: number
          comments: number
          follower_delta: number
          id: string
          impressions: number
          measured_at: string
          post_id: string
          raw_payload: Json | null
          reactions: number
          shares: number
          user_id: string
        }
        Insert: {
          clicks?: number
          comments?: number
          follower_delta?: number
          id?: string
          impressions?: number
          measured_at?: string
          post_id: string
          raw_payload?: Json | null
          reactions?: number
          shares?: number
          user_id: string
        }
        Update: {
          clicks?: number
          comments?: number
          follower_delta?: number
          id?: string
          impressions?: number
          measured_at?: string
          post_id?: string
          raw_payload?: Json | null
          reactions?: number
          shares?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          algorithm_insight_version: number | null
          algorithm_notes: string | null
          algorithm_score: number | null
          body: string
          body_history: Json
          created_at: string
          cta_mode: Database["public"]["Enums"]["cta_mode"]
          hook_ids: string[]
          id: string
          linkedin_urn: string | null
          pain_point_id: string | null
          persona_id: string
          primary_category_id: string
          published_at: string | null
          related_usp_ids: string[]
          scheduled_for: string | null
          status: Database["public"]["Enums"]["post_status"]
          tuner_diff: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          algorithm_insight_version?: number | null
          algorithm_notes?: string | null
          algorithm_score?: number | null
          body?: string
          body_history?: Json
          created_at?: string
          cta_mode?: Database["public"]["Enums"]["cta_mode"]
          hook_ids?: string[]
          id?: string
          linkedin_urn?: string | null
          pain_point_id?: string | null
          persona_id: string
          primary_category_id: string
          published_at?: string | null
          related_usp_ids?: string[]
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          tuner_diff?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          algorithm_insight_version?: number | null
          algorithm_notes?: string | null
          algorithm_score?: number | null
          body?: string
          body_history?: Json
          created_at?: string
          cta_mode?: Database["public"]["Enums"]["cta_mode"]
          hook_ids?: string[]
          id?: string
          linkedin_urn?: string | null
          pain_point_id?: string | null
          persona_id?: string
          primary_category_id?: string
          published_at?: string | null
          related_usp_ids?: string[]
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          tuner_diff?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_pain_point_id_fkey"
            columns: ["pain_point_id"]
            isOneToOne: false
            referencedRelation: "pain_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean
          created_at: string
          fetch_config: Json
          id: string
          last_fetched_at: string | null
          name: string
          type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fetch_config?: Json
          id?: string
          last_fetched_at?: string | null
          name: string
          type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fetch_config?: Json
          id?: string
          last_fetched_at?: string | null
          name?: string
          type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          algorithm_notes: string | null
          algorithm_score: number | null
          body: string
          chosen: boolean
          chosen_at: string | null
          created_at: string
          generation_id: string
          generator_meta: Json
          id: string
          persona_id: string
          tuner_diff: Json | null
          user_id: string
        }
        Insert: {
          algorithm_notes?: string | null
          algorithm_score?: number | null
          body: string
          chosen?: boolean
          chosen_at?: string | null
          created_at?: string
          generation_id: string
          generator_meta?: Json
          id?: string
          persona_id: string
          tuner_diff?: Json | null
          user_id: string
        }
        Update: {
          algorithm_notes?: string | null
          algorithm_score?: number | null
          body?: string
          chosen?: boolean
          chosen_at?: string | null
          created_at?: string
          generation_id?: string
          generator_meta?: Json
          id?: string
          persona_id?: string
          tuner_diff?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      usps: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string
          description: string
          id: string
          name: string
          proof: string | null
          related_pain_point_ids: string[]
          source_url: string | null
          status: Database["public"]["Enums"]["usp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string
          description: string
          id?: string
          name: string
          proof?: string | null
          related_pain_point_ids?: string[]
          source_url?: string | null
          status?: Database["public"]["Enums"]["usp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          proof?: string | null
          related_pain_point_ids?: string[]
          source_url?: string | null
          status?: Database["public"]["Enums"]["usp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_initial_insights: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      ai_usage_module:
        | "generator"
        | "tuner"
        | "filter"
        | "evaluator"
        | "research"
        | "usp_extractor"
        | "transcription"
        | "idea_postprocess"
        | "text_polisher"
        | "marketer_review"
        | "classifier"
      algorithm_insight_section: "technical" | "b2b_practice" | "cultural"
      attachment_type: "image" | "carousel_slide" | "document"
      cta_mode: "none" | "soft" | "direct"
      hook_status: "new" | "reviewed" | "used" | "archived"
      idea_input_type: "text" | "voice"
      idea_status: "new" | "refined" | "used" | "archived"
      post_status:
        | "draft"
        | "suggested"
        | "approved"
        | "scheduled"
        | "published"
        | "failed"
        | "archived"
      source_type:
        | "rss"
        | "scrape"
        | "manual"
        | "internal_avia"
        | "report"
        | "idea_bank"
      usp_status: "suggested" | "active" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
      ai_usage_module: [
        "generator",
        "tuner",
        "filter",
        "evaluator",
        "research",
        "usp_extractor",
        "transcription",
        "idea_postprocess",
        "text_polisher",
        "marketer_review",
        "classifier",
      ],
      algorithm_insight_section: ["technical", "b2b_practice", "cultural"],
      attachment_type: ["image", "carousel_slide", "document"],
      cta_mode: ["none", "soft", "direct"],
      hook_status: ["new", "reviewed", "used", "archived"],
      idea_input_type: ["text", "voice"],
      idea_status: ["new", "refined", "used", "archived"],
      post_status: [
        "draft",
        "suggested",
        "approved",
        "scheduled",
        "published",
        "failed",
        "archived",
      ],
      source_type: [
        "rss",
        "scrape",
        "manual",
        "internal_avia",
        "report",
        "idea_bank",
      ],
      usp_status: ["suggested", "active", "archived"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
