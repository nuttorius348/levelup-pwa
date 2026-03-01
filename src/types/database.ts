// ============================================================
// Database Types — Supabase schema for LevelUp PWA
// Replace with `npx supabase gen types typescript` when using CLI
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          level: number;
          total_xp: number;
          current_level_xp: number;
          coins: number;
          streak_days: number;
          longest_streak: number;
          last_active_date: string | null;
          timezone: string;
          theme: string;
          notifications_enabled: boolean;
          notification_preferences: Json;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          total_xp?: number;
          current_level_xp?: number;
          coins?: number;
          streak_days?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          timezone?: string;
          theme?: string;
          notifications_enabled?: boolean;
          notification_preferences?: Json;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          total_xp?: number;
          current_level_xp?: number;
          coins?: number;
          streak_days?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          timezone?: string;
          theme?: string;
          notifications_enabled?: boolean;
          notification_preferences?: Json;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          level: number;
          total_xp: number;
          current_level_xp: number;
          coins: number;
          streak_days: number;
          longest_streak: number;
          last_active_date: string | null;
          timezone: string;
          theme: string;
          notifications_enabled: boolean;
          notification_preferences: Json;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          total_xp?: number;
          current_level_xp?: number;
          coins?: number;
          streak_days?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          timezone?: string;
          theme?: string;
          notifications_enabled?: boolean;
          notification_preferences?: Json;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          total_xp?: number;
          current_level_xp?: number;
          coins?: number;
          streak_days?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          timezone?: string;
          theme?: string;
          notifications_enabled?: boolean;
          notification_preferences?: Json;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      xp_ledger: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          base_xp: number;
          multiplier: number;
          final_xp: number;
          coins_earned: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          base_xp: number;
          multiplier: number;
          final_xp: number;
          coins_earned: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          base_xp?: number;
          multiplier?: number;
          final_xp?: number;
          coins_earned?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          base_xp: number;
          multiplier: number;
          final_xp: number;
          coins_earned: number;
          source_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          base_xp: number;
          multiplier: number;
          final_xp: number;
          coins_earned: number;
          source_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          base_xp?: number;
          multiplier?: number;
          final_xp?: number;
          coins_earned?: number;
          source_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_xp_caps: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          cap_date: string;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          cap_date: string;
          xp_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          cap_date?: string;
          xp_earned?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          icon: string;
          color: string;
          sort_order: number;
          is_active: boolean;
          recurrence: Json;
          xp_reward: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          icon?: string;
          color?: string;
          sort_order?: number;
          is_active?: boolean;
          recurrence?: Json;
          xp_reward?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          sort_order?: number;
          is_active?: boolean;
          recurrence?: Json;
          xp_reward?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      routine_items: {
        Row: {
          id: string;
          routine_id: string;
          title: string;
          sort_order: number;
          xp_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          title: string;
          sort_order?: number;
          xp_value?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          routine_id?: string;
          title?: string;
          sort_order?: number;
          xp_value?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      routine_completions: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string;
          routine_item_id: string | null;
          completed_date: string;
          xp_earned: number;
          streak_multiplier: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id: string;
          routine_item_id?: string | null;
          completed_date: string;
          xp_earned?: number;
          streak_multiplier?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          routine_id?: string;
          routine_item_id?: string | null;
          completed_date?: string;
          xp_earned?: number;
          streak_multiplier?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          difficulty: string;
          estimated_minutes: number | null;
          tutorial_url: string | null;
          thumbnail_url: string | null;
          exercises: Json;
          is_template: boolean;
          is_favorite: boolean;
          times_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string;
          difficulty?: string;
          estimated_minutes?: number | null;
          tutorial_url?: string | null;
          thumbnail_url?: string | null;
          exercises?: Json;
          is_template?: boolean;
          is_favorite?: boolean;
          times_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          difficulty?: string;
          estimated_minutes?: number | null;
          tutorial_url?: string | null;
          thumbnail_url?: string | null;
          exercises?: Json;
          is_template?: boolean;
          is_favorite?: boolean;
          times_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          difficulty: string;
          estimated_minutes: number | null;
          tutorial_url: string | null;
          thumbnail_url: string | null;
          exercises: Json;
          is_template: boolean;
          is_system: boolean;
          created_by: string | null;
          is_favorite: boolean;
          times_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string;
          difficulty?: string;
          estimated_minutes?: number | null;
          tutorial_url?: string | null;
          thumbnail_url?: string | null;
          exercises?: Json;
          is_template?: boolean;
          is_system?: boolean;
          created_by?: string | null;
          is_favorite?: boolean;
          times_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          difficulty?: string;
          estimated_minutes?: number | null;
          tutorial_url?: string | null;
          thumbnail_url?: string | null;
          exercises?: Json;
          is_template?: boolean;
          is_system?: boolean;
          created_by?: string | null;
          is_favorite?: boolean;
          times_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string | null;
          title: string;
          duration_minutes: number | null;
          calories_estimated: number | null;
          exercises_completed: Json;
          notes: string | null;
          mood_before: number | null;
          mood_after: number | null;
          xp_earned: number;
          streak_multiplier: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id?: string | null;
          title: string;
          duration_minutes?: number | null;
          calories_estimated?: number | null;
          exercises_completed?: Json;
          notes?: string | null;
          mood_before?: number | null;
          mood_after?: number | null;
          xp_earned?: number;
          streak_multiplier?: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string | null;
          title?: string;
          duration_minutes?: number | null;
          calories_estimated?: number | null;
          exercises_completed?: Json;
          notes?: string | null;
          mood_before?: number | null;
          mood_after?: number | null;
          xp_earned?: number;
          streak_multiplier?: number;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          type: string;
          value: number;
          achieved_at: string;
          workout_log_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          type: string;
          value: number;
          achieved_at?: string;
          workout_log_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          type?: string;
          value?: number;
          achieved_at?: string;
          workout_log_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_overload_history: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          date: string;
          best_weight: number;
          best_reps: number;
          best_volume: number;
          total_volume: number;
          estimated_1rm: number;
          sets: number;
          difficulty: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          date: string;
          best_weight?: number;
          best_reps?: number;
          best_volume?: number;
          total_volume?: number;
          estimated_1rm?: number;
          sets?: number;
          difficulty?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          date?: string;
          best_weight?: number;
          best_reps?: number;
          best_volume?: number;
          total_volume?: number;
          estimated_1rm?: number;
          sets?: number;
          difficulty?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      stretch_sessions: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string;
          routine_title: string;
          difficulty: string;
          duration_seconds: number;
          poses_completed: number;
          poses_skipped: number;
          total_hold_time: number;
          xp_earned: number;
          coins_earned: number;
          is_morning: boolean;
          xp_breakdown: Json;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          routine_id: string;
          routine_title: string;
          difficulty: string;
          duration_seconds?: number;
          poses_completed?: number;
          poses_skipped?: number;
          total_hold_time?: number;
          xp_earned?: number;
          coins_earned?: number;
          is_morning?: boolean;
          xp_breakdown?: Json;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          routine_id?: string;
          routine_title?: string;
          difficulty?: string;
          duration_seconds?: number;
          poses_completed?: number;
          poses_skipped?: number;
          total_hold_time?: number;
          xp_earned?: number;
          coins_earned?: number;
          is_morning?: boolean;
          xp_breakdown?: Json;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      stretch_progression: {
        Row: {
          user_id: string;
          current_difficulty: string;
          total_sessions: number;
          consecutive_days: number;
          last_session_date: string | null;
          intermediate_unlocked: boolean;
          advanced_unlocked: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_difficulty?: string;
          total_sessions?: number;
          consecutive_days?: number;
          last_session_date?: string | null;
          intermediate_unlocked?: boolean;
          advanced_unlocked?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_difficulty?: string;
          total_sessions?: number;
          consecutive_days?: number;
          last_session_date?: string | null;
          intermediate_unlocked?: boolean;
          advanced_unlocked?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      outfit_ratings: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          image_hash: string | null;
          rating_score: number | null;
          overall_score: number | null;
          style_tags: string[] | null;
          color_harmony: number | null;
          fit_score: number | null;
          occasion_match: string | null;
          feedback_text: string | null;
          ai_feedback: string | null;
          suggestions: string[] | null;
          ai_suggestions: string[] | null;
          ai_provider: string;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          image_hash?: string | null;
          rating_score?: number | null;
          overall_score?: number | null;
          style_tags?: string[] | null;
          color_harmony?: number | null;
          fit_score?: number | null;
          occasion_match?: string | null;
          feedback_text?: string | null;
          ai_feedback?: string | null;
          suggestions?: string[] | null;
          ai_suggestions?: string[] | null;
          ai_provider: string;
          xp_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          image_hash?: string | null;
          rating_score?: number | null;
          overall_score?: number | null;
          style_tags?: string[] | null;
          color_harmony?: number | null;
          fit_score?: number | null;
          occasion_match?: string | null;
          feedback_text?: string | null;
          ai_feedback?: string | null;
          suggestions?: string[] | null;
          ai_suggestions?: string[] | null;
          ai_provider?: string;
          xp_earned?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      levels: {
        Row: {
          level: number;
          xp_required: number;
          xp_to_next: number | null;
          title: string | null;
          icon: string | null;
          coin_reward: number;
          created_at: string;
        };
        Insert: {
          level: number;
          xp_required: number;
          xp_to_next?: number | null;
          title?: string | null;
          icon?: string | null;
          coin_reward?: number;
          created_at?: string;
        };
        Update: {
          level?: number;
          xp_required?: number;
          xp_to_next?: number | null;
          title?: string | null;
          icon?: string | null;
          coin_reward?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          icon: string | null;
          image_url: string | null;
          cost_coins: number;
          cost_level: number;
          is_limited_edition: boolean;
          stock_remaining: number | null;
          rarity: string | null;
          effects: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          icon?: string | null;
          image_url?: string | null;
          cost_coins?: number;
          cost_level?: number;
          is_limited_edition?: boolean;
          stock_remaining?: number | null;
          rarity?: string | null;
          effects?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          icon?: string | null;
          image_url?: string | null;
          cost_coins?: number;
          cost_level?: number;
          is_limited_edition?: boolean;
          stock_remaining?: number | null;
          rarity?: string | null;
          effects?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_rewards: {
        Row: {
          id: string;
          user_id: string;
          reward_id: string;
          is_equipped: boolean;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reward_id: string;
          is_equipped?: boolean;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reward_id?: string;
          is_equipped?: boolean;
          purchased_at?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_type: string;
          category: string;
          source_id: string | null;
          start_time: string;
          end_time: string;
          start_at: string;
          end_at: string | null;
          all_day: boolean;
          recurrence_rule: string | null;
          color: string | null;
          reminder_minutes: number[] | null;
          completed: boolean;
          is_completed: boolean;
          completed_at: string | null;
          routine_id: string | null;
          xp_awarded: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          event_type?: string;
          category?: string;
          source_id?: string | null;
          start_time?: string;
          end_time?: string;
          start_at?: string;
          end_at?: string | null;
          all_day?: boolean;
          recurrence_rule?: string | null;
          color?: string | null;
          reminder_minutes?: number[] | null;
          completed?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          routine_id?: string | null;
          xp_awarded?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          event_type?: string;
          category?: string;
          source_id?: string | null;
          start_time?: string;
          end_time?: string;
          start_at?: string;
          end_at?: string | null;
          all_day?: boolean;
          recurrence_rule?: string | null;
          color?: string | null;
          reminder_minutes?: number[] | null;
          completed?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          routine_id?: string | null;
          xp_awarded?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      shop_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          subcategory: string | null;
          icon_url: string | null;
          preview_url: string | null;
          price_coins: number;
          level_required: number;
          is_limited: boolean;
          stock_remaining: number | null;
          metadata: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          subcategory?: string | null;
          icon_url?: string | null;
          preview_url?: string | null;
          price_coins?: number;
          level_required?: number;
          is_limited?: boolean;
          stock_remaining?: number | null;
          metadata?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          subcategory?: string | null;
          icon_url?: string | null;
          preview_url?: string | null;
          price_coins?: number;
          level_required?: number;
          is_limited?: boolean;
          stock_remaining?: number | null;
          metadata?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_inventory: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          is_equipped: boolean;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          is_equipped?: boolean;
          acquired_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          is_equipped?: boolean;
          acquired_at?: string;
        };
        Relationships: [];
      };
      user_purchases: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          price_paid: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          price_paid: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          price_paid?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          user_agent: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          user_agent?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys_p256dh?: string;
          keys_auth?: string;
          user_agent?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checklist_tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          completed: boolean;
          completed_at: string | null;
          date: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          completed?: boolean;
          completed_at?: string | null;
          date: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          completed?: boolean;
          completed_at?: string | null;
          date?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_quotes: {
        Row: {
          id: string;
          quote_date: string;
          quote_text: string;
          theme: string;
          tone: string;
          attribution: string;
          tags: string[];
          follow_up: string | null;
          ai_provider: string;
          fallback_used: boolean;
          generation_latency_ms: number | null;
          total_reads: number;
          unique_readers: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_date: string;
          quote_text: string;
          theme: string;
          tone: string;
          attribution: string;
          tags?: string[];
          follow_up?: string | null;
          ai_provider: string;
          fallback_used?: boolean;
          generation_latency_ms?: number | null;
          total_reads?: number;
          unique_readers?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_date?: string;
          quote_text?: string;
          theme?: string;
          tone?: string;
          attribution?: string;
          tags?: string[];
          follow_up?: string | null;
          ai_provider?: string;
          fallback_used?: boolean;
          generation_latency_ms?: number | null;
          total_reads?: number;
          unique_readers?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quote_reads: {
        Row: {
          id: string;
          user_id: string;
          quote_date: string;
          read_at: string;
          is_morning_read: boolean;
          xp_earned: number;
          morning_bonus_earned: number;
          source: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          quote_date: string;
          read_at?: string;
          is_morning_read?: boolean;
          xp_earned?: number;
          morning_bonus_earned?: number;
          source?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          quote_date?: string;
          read_at?: string;
          is_morning_read?: boolean;
          xp_earned?: number;
          morning_bonus_earned?: number;
          source?: string | null;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          quote_text: string;
          theme: string;
          tone: string;
          attribution: string;
          tags: string[];
          follow_up: string | null;
          ai_provider: string;
          fallback_used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quote_text: string;
          theme: string;
          tone: string;
          attribution: string;
          tags?: string[];
          follow_up?: string | null;
          ai_provider: string;
          fallback_used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quote_text?: string;
          theme?: string;
          tone?: string;
          attribution?: string;
          tags?: string[];
          follow_up?: string | null;
          ai_provider?: string;
          fallback_used?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      active_boosts: {
        Row: {
          id: string;
          user_id: string;
          reward_id: string | null;
          boost_type: string;
          multiplier: number;
          activated_at: string;
          expires_at: string;
          is_consumed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reward_id?: string | null;
          boost_type: string;
          multiplier: number;
          activated_at?: string;
          expires_at: string;
          is_consumed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reward_id?: string | null;
          boost_type?: string;
          multiplier?: number;
          activated_at?: string;
          expires_at?: string;
          is_consumed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      login_calendar: {
        Row: {
          id: string;
          user_id: string;
          login_date: string;
          day_in_cycle: number;
          cycle_number: number;
          coins_awarded: number;
          bonus_item_slug: string | null;
          claimed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          login_date: string;
          day_in_cycle: number;
          cycle_number: number;
          coins_awarded?: number;
          bonus_item_slug?: string | null;
          claimed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          login_date?: string;
          day_in_cycle?: number;
          cycle_number?: number;
          coins_awarded?: number;
          bonus_item_slug?: string | null;
          claimed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      comeback_bonuses: {
        Row: {
          id: string;
          user_id: string;
          days_absent: number;
          coins_awarded: number;
          xp_awarded: number;
          boost_hours: number;
          claimed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          days_absent: number;
          coins_awarded?: number;
          xp_awarded?: number;
          boost_hours?: number;
          claimed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          days_absent?: number;
          coins_awarded?: number;
          xp_awarded?: number;
          boost_hours?: number;
          claimed_at?: string;
        };
        Relationships: [];
      };
      quest_templates: {
        Row: {
          id: string;
          name: string;
          description: string;
          quest_type: string;
          target_count: number;
          xp_reward: number;
          coin_reward: number;
          icon: string;
          reset_frequency: string;
          difficulty: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          quest_type: string;
          target_count?: number;
          xp_reward?: number;
          coin_reward?: number;
          icon?: string;
          reset_frequency?: string;
          difficulty?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          quest_type?: string;
          target_count?: number;
          xp_reward?: number;
          coin_reward?: number;
          icon?: string;
          reset_frequency?: string;
          difficulty?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_quests: {
        Row: {
          id: string;
          user_id: string;
          quest_template_id: string;
          progress: number;
          target: number;
          completed: boolean;
          claimed: boolean;
          assigned_at: string;
          completed_at: string | null;
          claimed_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quest_template_id: string;
          progress?: number;
          target: number;
          completed?: boolean;
          claimed?: boolean;
          assigned_at?: string;
          completed_at?: string | null;
          claimed_at?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quest_template_id?: string;
          progress?: number;
          target?: number;
          completed?: boolean;
          claimed?: boolean;
          assigned_at?: string;
          completed_at?: string | null;
          claimed_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      xp_for_level: {
        Args: { target_level: number };
        Returns: number;
      };
      get_user_rank: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_equipped_cosmetics: {
        Args: { p_user_id: string };
        Returns: {
          category: string;
          reward_id: string;
          reward_name: string;
          icon: string;
          effects: Json;
        }[];
      };
      get_active_boost_multiplier: {
        Args: { p_user_id: string; p_boost_type?: string };
        Returns: number;
      };
      has_streak_shield: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      consume_streak_shield: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      increment_coins: {
        Args: { user_id_input: string; amount: number };
        Returns: undefined;
      };
      award_xp: {
        Args: { user_id_input: string; amount: number };
        Returns: undefined;
      };
      assign_daily_quests: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
      increment_quest_progress: {
        Args: { target_user_id: string; target_quest_type: string; increment_amount?: number };
        Returns: undefined;
      };
    };
    Enums: {
      xp_action_type: string;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
