import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateWeightedScores } from '@/lib/calculator';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const submissions = await db.submission.findMany({
      include: {
        evaluations: {
          include: {
            evaluator: {
              select: {
                id: true,
                name: true,
                groupType: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // === 1번 시트: 종합 랭킹 (기존 로직 유지) ===
    const rankedSubmissions = submissions.map((sub: any) => {
      const scoreSummary = calculateWeightedScores(sub.evaluations || []);

      // 항목별 평균 점수 계산
      const evals = sub.evaluations || [];
      const avgScores = evals.length > 0 ? {
        problemDefinitionScore: Number((evals.reduce((sum: number, e: any) => sum + e.problemDefinitionScore, 0) / evals.length).toFixed(1)),
        visualizationCreativityScore: Number((evals.reduce((sum: number, e: any) => sum + e.visualizationCreativityScore, 0) / evals.length).toFixed(1)),
        socialValueScore: Number((evals.reduce((sum: number, e: any) => sum + e.socialValueScore, 0) / evals.length).toFixed(1)),
        majorUtilizationScore: Number((evals.reduce((sum: number, e: any) => sum + e.majorUtilizationScore, 0) / evals.length).toFixed(1)),
        dataAccuracyScore: Number((evals.reduce((sum: number, e: any) => sum + e.dataAccuracyScore, 0) / evals.length).toFixed(1)),
      } : undefined;

      return {
        id: sub.id,
        title: sub.title,
        studentName: sub.studentName,
        studentId: sub.studentId,
        department: sub.department,
        summary: sub.summary,
        avgScores,
        ...scoreSummary,
      };
    });

    // 최종점수 내림차순 정렬
    rankedSubmissions.sort((a: any, b: any) => b.finalScore - a.finalScore);

    // 순위 부여
    const finalRankings = rankedSubmissions.map((item: any, idx: number) => ({
      rank: idx + 1,
      ...item,
    }));

    // === 2번~N+1번 시트: 카카오 계정별(평가자별) 개인 점수 시트 ===
    const evaluatorMap: Record<string, {
      evaluatorId: string;
      evaluatorName: string;
      evaluatorRole: string;
      evaluatorGroupType: string;
      scores: any[];
    }> = {};

    submissions.forEach((sub: any) => {
      (sub.evaluations || []).forEach((ev: any) => {
        const eid = ev.evaluator.id;
        if (!evaluatorMap[eid]) {
          evaluatorMap[eid] = {
            evaluatorId: eid,
            evaluatorName: ev.evaluator.name,
            evaluatorRole: ev.evaluator.role || '',
            evaluatorGroupType: ev.evaluator.groupType || '',
            scores: [],
          };
        }
        evaluatorMap[eid].scores.push({
          submissionId: sub.id,
          submissionTitle: sub.title,
          department: sub.department,
          studentName: sub.studentName,
          studentId: sub.studentId,
          problemDefinitionScore: ev.problemDefinitionScore,
          visualizationCreativityScore: ev.visualizationCreativityScore,
          socialValueScore: ev.socialValueScore,
          majorUtilizationScore: ev.majorUtilizationScore,
          dataAccuracyScore: ev.dataAccuracyScore,
          totalScore: ev.totalScore,
          comment: ev.comment || '',
          isFinalized: ev.isFinalized,
        });
      });
    });

    const evaluatorSheets = Object.values(evaluatorMap);

    return NextResponse.json({
      success: true,
      rankings: finalRankings,
      evaluatorSheets,
    });
  } catch (error) {
    console.error('Fetch Rankings Error:', error);
    return NextResponse.json(
      { success: false, error: '실시간 랭킹 집계 산출 실패' },
      { status: 500 }
    );
  }
}
