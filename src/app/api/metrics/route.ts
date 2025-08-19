// src/app/api/metrics/route.ts
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'; // Adjust path

// This file handles GET (all metrics) and POST (create new metric)

export async function GET() {
  // This will now bypass RLS and fetch all metrics, which is correct for the dashboard.
  const { data, error } = await supabase
    .from('saved_metrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function POST(req: Request) {
  const { name, sql_query, chart_suggestion } = await req.json();

  if (!name || !sql_query || !chart_suggestion) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  
  // NOTE: You don't even need the systemUserId anymore, but it's good practice
  // to keep it for data integrity, so we'll leave it in.
  const systemUserId = process.env.SYSTEM_USER_ID; 

  // This INSERT will now bypass the RLS policy check and succeed.
  const { data, error } = await supabase
    .from('saved_metrics')
    .insert([{ 
      name, 
      sql_query, 
      chart_suggestion,
      user_id: systemUserId || null 
    }])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 201 });
}