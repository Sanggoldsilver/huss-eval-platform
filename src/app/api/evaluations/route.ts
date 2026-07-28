import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const evaluatorId = req.headers.get('x-user-id');
    if (!evaluatorId) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const {
      submissionId,
      problemDefinitionScore,
      visualizationCreativityScore,
      socialValueScore,
      majorUtilizationScore,
      dataAccuracyScore,
      comment,
    } = await req.json();

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: '제출작 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 유효성 점수 검증 (공식 5대 배점 제한)
    const pScore = Math.min(Math.max(Number(problemDefinitionScore) || 0, 0), 30);
    const vScore = Math.min(Math.max(Number(visualizationCreativityScore) || 0, 0), 30);
    const sScore = Math.min(Math.max(Number(socialValueScore) || 0, 0), 15);
    const mScore = Math.min(Math.max(Number(majorUtilizationScore) || 0, 0), 15);
    const dScore = Math.min(Math.max(Number(dataAccuracyScore) || 0, 0), 10);

    const totalScore = pScore + vScore + sScore + mScore + dScore;

    const evaluation = await db.evaluation.upsert({
      where: {
        submissionId_evaluatorId: {
          submissionId,
          evaluatorId,
        },
      },
      update: {
        problemDefinitionScore: pScore,
        visualizationCreativityScore: vScore,
        socialValueScore: sScore,
        majorUtilizationScore: mScore,
        dataAccuracyScore: dScore,
        comment: comment || '',
        totalScore,
      },
      create: {
        submissionId,
        evaluatorId,
        problemDefinitionScore: pScore,
        visualizationCreativityScore: vScore,
        socialValueScore: sScore,
        majorUtilizationScore: mScore,
        dataAccuracyScore: dScore,
        comment: comment || '',
        totalScore,
      },
    });
    return NextResponse.json({ success: true, evaluation });
  } catch (error) {
    console.error('Submit Evaluation Error:', error);
    return NextResponse.json(
      { success: false, error: '평가 채점 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
