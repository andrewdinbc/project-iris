import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SaveRequest {
  lessonPlanId: string;
  overrides: Record<string, boolean | null>;
}

export async function POST(request: NextRequest) {
  try {
    const { lessonPlanId, overrides }: SaveRequest = await request.json();

    if (!lessonPlanId) {
      return NextResponse.json(
        { error: 'Lesson plan ID is required' },
        { status: 400 }
      );
    }

    // Process confirmed alignments
    const confirmedAlignments = Object.entries(overrides)
      .filter(([_, value]) => value === true)
      .map(([matchId]) => ({
        lesson_plan_id: lessonPlanId,
        match_id: matchId,
        user_confirmed: true,
        confirmed_at: new Date().toISOString(),
      }));

    const rejectedAlignments = Object.entries(overrides)
      .filter(([_, value]) => value === false)
      .map(([matchId]) => ({
        lesson_plan_id: lessonPlanId,
        match_id: matchId,
        user_confirmed: false,
        confirmed_at: new Date().toISOString(),
      }));

    // Insert confirmed alignments
    if (confirmedAlignments.length > 0) {
      const { error: confirmError } = await supabase
        .from('lesson_plan_alignments')
        .upsert(confirmedAlignments, { onConflict: 'lesson_plan_id,match_id' });

      if (confirmError) {
        console.error('Error saving confirmed alignments:', confirmError);
        throw new Error('Failed to save confirmed alignments');
      }
    }

    // Insert rejected alignments
    if (rejectedAlignments.length > 0) {
      const { error: rejectError } = await supabase
        .from('lesson_plan_alignments')
        .upsert(rejectedAlignments, { onConflict: 'lesson_plan_id,match_id' });

      if (rejectError) {
        console.error('Error saving rejected alignments:', rejectError);
        throw new Error('Failed to save rejected alignments');
      }
    }

    return NextResponse.json({
      success: true,
      confirmedCount: confirmedAlignments.length,
      rejectedCount: rejectedAlignments.length,
    });
  } catch (error) {
    console.error('Save alignments error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save alignments' },
      { status: 500 }
    );
  }
}
