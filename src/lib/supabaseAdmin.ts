// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// This client is ONLY for server-side use and can bypass RLS.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the service role key!
);