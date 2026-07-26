import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateWeightedScores } from '@/lib/calculator';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let submissions: any[] = [];

    try {
      submissions = await db.submission.findMany({
        include: {
          evaluations: {
            include: {
              evaluator: {
                select: {
                  groupType: true,
                  role: true,
                },
              },
            },
          },
        },
      });
    } catch (dbErr) {
      submissions = mockStore.submissions.map((sub) => {
        const evals = mockStore.evaluations
          .filter((e) => e.submissionId === sub.id)
          .map((e) => {
            const user = mockStore.users.find((u) => u.id === e.evaluatorId);
            return {
              ...e,
              evaluator: {
                groupType: user?.groupType || 'BUSINESS_TEAM',
                role: user?.role || 'TEACHER',
              },
            };
          });
        return { ...sub, evaluations: evals };
      });
    }

    const rankedSubmissions = submissions.map((sub: any) => {
      const scoreSummary = calculateWeightedScores(sub.evaluations || []);
      return {
        id: sub.id,
        title: sub.title,
        studentName: sub.studentName,
        studentId: sub.studentId,
        department: sub.department,
        summary: sub.summary,
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

    return NextResponse.json({ success: true, rankings: finalRankings });
  } catch (error) {
    console.error('Fetch Rankings Error:', error);
    return NextResponse.json(
      { success: false, error: '실시간 랭킹 집계 산출 실패' },
      { status: 500 }
    );
  }
}
