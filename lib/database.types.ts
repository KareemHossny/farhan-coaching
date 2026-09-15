export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; role: "coach" | "client"; phone: string | null; avatar_url: string | null; created_at: string };
        Insert: { id: string; full_name: string; role: "coach" | "client"; phone?: string | null; avatar_url?: string | null; created_at?: string };
        Update: { id?: string; full_name?: string; role?: "coach" | "client"; phone?: string | null; avatar_url?: string | null; created_at?: string };
        Relationships: [];
      };
      clients: {
        Row: { id: string; coach_id: string; status: "active" | "paused" | "pending"; progress_enabled: boolean; goal: string | null; height_cm: number | null; starting_weight_kg: number | null; notes: string | null };
        Insert: { id: string; coach_id: string; status?: "active" | "paused" | "pending"; progress_enabled?: boolean; goal?: string | null; height_cm?: number | null; starting_weight_kg?: number | null; notes?: string | null };
        Update: { id?: string; coach_id?: string; status?: "active" | "paused" | "pending"; progress_enabled?: boolean; goal?: string | null; height_cm?: number | null; starting_weight_kg?: number | null; notes?: string | null };
        Relationships: [];
      };
      exercise_library: {
        Row: { id: string; coach_id: string; name: string; muscle_group: string | null; youtube_url: string | null; default_sets: number | null; default_reps: string | null; default_rest_seconds: number | null; notes: string | null; created_at: string };
        Insert: { id?: string; coach_id: string; name: string; muscle_group?: string | null; youtube_url?: string | null; default_sets?: number | null; default_reps?: string | null; default_rest_seconds?: number | null; notes?: string | null; created_at?: string };
        Update: { id?: string; coach_id?: string; name?: string; muscle_group?: string | null; youtube_url?: string | null; default_sets?: number | null; default_reps?: string | null; default_rest_seconds?: number | null; notes?: string | null; created_at?: string };
        Relationships: [];
      };
      meal_library: {
        Row: { id: string; coach_id: string; name: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fats_g: number | null; macro_reference_grams: number; notes: string | null; created_at: string };
        Insert: { id?: string; coach_id: string; name: string; calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fats_g?: number | null; macro_reference_grams?: number; notes?: string | null; created_at?: string };
        Update: { id?: string; coach_id?: string; name?: string; calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fats_g?: number | null; macro_reference_grams?: number; notes?: string | null; created_at?: string };
        Relationships: [];
      };
      plans: {
        Row: { id: string; client_id: string; coach_id: string; type: "workout" | "diet"; title: string; start_date: string | null; end_date: string | null; payment_pending: boolean; created_at: string };
        Insert: { id?: string; client_id: string; coach_id: string; type: "workout" | "diet"; title: string; start_date?: string | null; end_date?: string | null; payment_pending?: boolean; created_at?: string };
        Update: { id?: string; client_id?: string; coach_id?: string; type?: "workout" | "diet"; title?: string; start_date?: string | null; end_date?: string | null; payment_pending?: boolean; created_at?: string };
        Relationships: [];
      };
      plan_items: {
        Row: { id: string; plan_id: string; day_of_week: number; order_index: number; library_item_id: string | null; meal_label: string | null; override_sets: number | null; override_reps: string | null; override_calories: number | null; override_grams: number | null; name: string | null; details: Json };
        Insert: { id?: string; plan_id: string; day_of_week: number; order_index?: number; library_item_id?: string | null; meal_label?: string | null; override_sets?: number | null; override_reps?: string | null; override_calories?: number | null; override_grams?: number | null; name?: string | null; details?: Json };
        Update: { id?: string; plan_id?: string; day_of_week?: number; order_index?: number; library_item_id?: string | null; meal_label?: string | null; override_sets?: number | null; override_reps?: string | null; override_calories?: number | null; override_grams?: number | null; name?: string | null; details?: Json };
        Relationships: [];
      };
      progress_logs: {
        Row: { id: string; client_id: string; date: string; weight_kg: number; photo_url: string | null; note: string | null };
        Insert: { id?: string; client_id: string; date?: string; weight_kg: number; photo_url?: string | null; note?: string | null };
        Update: { id?: string; client_id?: string; date?: string; weight_kg?: number; photo_url?: string | null; note?: string | null };
        Relationships: [];
      };
      leads: {
        Row: { id: string; name: string; phone: string; message: string | null; created_at: string; contacted: boolean };
        Insert: { id?: string; name: string; phone: string; message?: string | null; created_at?: string; contacted?: boolean };
        Update: { id?: string; name?: string; phone?: string; message?: string | null; created_at?: string; contacted?: boolean };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_client_record: { Args: { p_client_id: string; p_coach_id: string; p_full_name: string; p_phone: string | null; p_goal: string | null }; Returns: undefined };
      get_client_account: { Args: Record<string, never>; Returns: Array<{ id: string; status: "active" | "paused" | "pending"; full_name: string; progress_enabled: boolean }> };
      get_client_plan_items: { Args: Record<string, never>; Returns: Array<{ plan_id: string; client_id: string; plan_type: "workout" | "diet"; plan_title: string; start_date: string | null; end_date: string | null; item_id: string; day_of_week: number; order_index: number; library_item_id: string | null; meal_label: string | null; item_name: string | null; grams: number | null; sets: number | null; reps: string | null; rest_seconds: number | null; youtube_url: string | null }> };
      save_client_plans: { Args: { p_client_id: string; p_workout: Json; p_diet: Json }; Returns: undefined };
    };
    Enums: { user_role: "coach" | "client"; client_status: "active" | "paused" | "pending"; plan_type: "workout" | "diet" };
    CompositeTypes: Record<string, never>;
  };
};
