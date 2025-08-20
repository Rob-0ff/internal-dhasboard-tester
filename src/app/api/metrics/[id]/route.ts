// src/app/api/metrics/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

// This file handles PUT (update) and DELETE for a specific metric by its ID.

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('saved_metrics')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { error } = await supabase
      .from('saved_metrics')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return new Response(null, { status: 204 });

  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}