import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error(
        `Supabase env vars missing: URL=${url ? "set" : "MISSING"}, KEY=${key ? "set" : "MISSING"}`
      );
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}
