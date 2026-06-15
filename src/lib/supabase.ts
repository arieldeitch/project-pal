import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.replace(/\/$/, "");
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "[supabase] Missing environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. " +
    "Add them to .env (committed) or set them in Lovable Dashboard."
  );
}

console.info(
  "[supabase] client initialised — URL:", supabaseUrl,
  "| key source:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "VITE_SUPABASE_ANON_KEY" : "VITE_SUPABASE_PUBLISHABLE_KEY"
);

export const supabase = createClient(supabaseUrl, supabaseKey);
