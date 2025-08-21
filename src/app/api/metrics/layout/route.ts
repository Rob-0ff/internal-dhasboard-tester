// src/app/api/metrics/layout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

// This endpoint receives an array of all metrics and their new layout state.
export async function PUT(req: NextRequest) {
  try {
    const metricsToUpdate = await req.json();

    if (!Array.isArray(metricsToUpdate)) {
      return NextResponse.json({ error: 'Request body must be an array of metrics.' }, { status: 400 });
    }

    for (const metric of metricsToUpdate) {
      console.log("Updating metric:", metric.id, metric.is_on_dashboard, metric.dashboard_layout);
    }

    // Use a transaction to update all metrics in one go.
    // This is more efficient and safer.
    const { error } = await supabase.rpc('update_metrics_layout', {
      metrics: metricsToUpdate
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Layout saved successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error("Layout Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}