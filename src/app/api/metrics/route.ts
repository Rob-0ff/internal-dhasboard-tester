// src/app/api/metrics/route.ts
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'; // Adjust path
import { NextRequest, NextResponse } from 'next/server';

// This file handles GET (all metrics) and POST (create new metric)

export async function GET() {
  // This will now bypass RLS and fetch all metrics, which is correct for the dashboard.
  const { data, error } = await supabase
    .from('saved_metrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new NextResponse(JSON.stringify(data), { status: 200 });
}

export async function POST(req: NextRequest) {
  const { name, sql_query, chart_suggestion } = await req.json();

  if (!name || !sql_query || !chart_suggestion) {
    return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  // This INSERT will now bypass the RLS policy check and succeed.
  const { data, error } = await supabase
    .from('saved_metrics')
    .insert([{ 
      name, 
      sql_query, 
      chart_suggestion,
    }])
    .select()
    .single();

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new NextResponse(JSON.stringify(data), { status: 201 });
}