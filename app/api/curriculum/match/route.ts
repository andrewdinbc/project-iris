import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MatchingRequest {
  lessonPlan: string;
  province: string;
}

interface AIMatch {
  standardCode: string;
  standardText: string;
  matchConfidence: number;
  matchReasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const { lessonPlan, province }: MatchingRequest = await request.json();

    if (!lessonPlan?.trim()) {
      return NextResponse.json(
        { error: 'Lesson plan content is required' },
        { status: 400 }
      );
    }

    // Fetch curriculum standards for the province
    const { data: standards, error: fetchError } = await supabase
      .from('curriculum_standards')
      .select('id, code, text, subject, grade_level')
      .eq('province', province)
      .limit(100);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch curriculum standards' },
        { status: 500 }
      );
    }

    if (!standards || standards.length === 0) {
      return NextResponse.json(
        { error: `No curriculum standards found for province: ${province}` },
        { status: 404 }
      );
    }

    // Build curriculum context
    const curriculumContext = standards
      .map(
        (s: any) =>
          `Code: ${s.code}\nSubject: ${s.subject}\nGrade: ${s.grade_level}\nText: ${s.text}`
      )
      .join('\n\n---\n\n');

    // Call Claude to find alignments
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a curriculum alignment expert. Analyze the following lesson plan and identify which ${province} curriculum standards it aligns with.

LESSON PLAN:
${lessonPlan}

AVAILABLE CURRICULUM STANDARDS:
${curriculumContext}

For each standard that this lesson plan clearly aligns with, respond with a JSON array containing objects with these exact fields:
- standardCode (string): the code of the standard
- standardText (string): the full text of the standard
- matchConfidence (number): 0.0 to 1.0 indicating how well it aligns
- matchReasoning (string): brief explanation of why this standard aligns

Only include standards with matchConfidence >= 0.6. If no standards align, return an empty array.

Respond with ONLY valid JSON, no additional text.`,
        },
      ],
    });

    // Parse AI response
    let matches: AIMatch[] = [];
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    try {
      matches = JSON.parse(responseText);
      if (!Array.isArray(matches)) {
        matches = [];
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      matches = [];
    }

    // Create alignment records with IDs
    const alignmentMatches = matches.map((match, index) => ({
      id: `${Date.now()}-${index}`,
      standardId: standards.find((s: any) => s.code === match.standardCode)?.id || '',
      standardCode: match.standardCode,
      standardText: match.standardText,
      matchConfidence: Math.min(Math.max(match.matchConfidence, 0), 1),
      matchReasoning: match.matchReasoning,
      userConfirmed: null,
    }));

    return NextResponse.json({
      lessonPlanId: Date.now().toString(),
      lessonPlanTitle: 'Lesson Plan Alignment',
      province,
      matches: alignmentMatches,
      processingStatus: 'complete',
    });
  } catch (error) {
    console.error('Curriculum matching error:', error);
    return NextResponse.json(
      { error: 'Failed to process lesson plan' },
      { status: 500 }
    );
  }
}
