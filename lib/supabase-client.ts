"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase URL or anon key missing. The dashboard will operate in read-only mock mode."
  );
}

export const supabase = client;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
