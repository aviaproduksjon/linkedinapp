/**
 * Generated Supabase types.
 *
 * DO NOT EDIT BY HAND. Regenerate with:
 *   pnpm db:types
 *
 * Placeholder until Supabase is set up locally or in the cloud.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
