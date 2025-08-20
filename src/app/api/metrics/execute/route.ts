// src/app/api/metrics/execute/route.ts
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'; // Use the admin client
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sql_query } = await req.json();

    if (!sql_query) {
      return new NextResponse(JSON.stringify({ error: "SQL query is required." }), { status: 400 });
    }

    // Use the Supabase RPC function to safely execute the read-only query
    const { data, error } = await supabase.rpc("execute_sql", { sql_query });

    if (error) {
      return new NextResponse(`Database error:, ${error.message}`);
    }

    // Return just the data array directly
    return new NextResponse(JSON.stringify(data), { status: 200 });

  } catch (error: any) {
    console.error("API Error in /execute:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}