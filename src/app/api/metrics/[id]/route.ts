// src/app/api/metrics/[id]/route.ts
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'; // Adjust path

// This file handles PUT (update) and DELETE for a specific metric by its ID

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { name } = await req.json();

  if (!name) {
    return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
  }

    const systemUserId = process.env.SYSTEM_USER_ID; 

  const { data, error } = await supabase
    .from('saved_metrics')
    .update({ 
      name, 
      user_id: systemUserId || null 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { error } = await supabase
    .from('saved_metrics')
    .delete()
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(null, { status: 204 }); // 204 No Content is standard for a successful delete
}