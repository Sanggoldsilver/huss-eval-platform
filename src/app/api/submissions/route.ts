import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { anonymizeSubmissionForSupporter, getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session) {
    return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const role = session.role;
    const evaluatorId = session.userId;

    const submissions = await db.submission.findMany({
      include: {
        evaluations: {
          include: {
            evaluator: {
              select: { id: true, name: true, role: true, groupType: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedSubmissions = submissions.map((sub: any) => {
      const anonymized = anonymizeSubmissionForSupporter(sub, role);
      let evaluations = sub.evaluations || [];

      if (role === 'SUPPORTER') {
        evaluations = evaluations.filter(
          (e: any) => e.evaluatorId === evaluatorId
        );
      }

      return { ...anonymized, evaluations };
    });

    return NextResponse.json({ success: true, submissions: formattedSubmissions });
  } catch (error) {
    console.error('Fetch Submissions Error:', error);
    return NextResponse.json(
      { success: false, error: '제출작 목록 조회 실패' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: '오직 관리자 계정만 자료를 등록할 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      studentName,
      studentId,
      department,
      summary,
      applicationFileUrl,
      resultFileUrl,
      aiSourceFileUrl,
      privacyAgreementFileUrl,
    } = body;

    if (!title || !resultFileUrl) {
      return NextResponse.json(
        { success: false, error: '과제명과 시각화 결과물 URL은 필수입니다.' },
        { status: 400 }
      );
    }

    const newSubmission = await db.submission.create({
      data: {
        title,
        studentName: studentName || '',
        studentId: studentId || '',
        department: department || '',
        summary: summary || null,
        applicationFileUrl: applicationFileUrl || null,
        resultFileUrl,
        aiSourceFileUrl: aiSourceFileUrl || null,
        privacyAgreementFileUrl: privacyAgreementFileUrl || null,
      },
    });
    return NextResponse.json({ success: true, submission: newSubmission });
  } catch (error) {
    console.error('Create Submission Error:', error);
    return NextResponse.json(
      { success: false, error: '심사 자료 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: '오직 관리자 계정만 작품을 삭제할 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const { submissionId } = await req.json();
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: '삭제할 제출작 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 연결된 평가 먼저 삭제 후 제출작 삭제
    await db.evaluation.deleteMany({ where: { submissionId } });
    await db.submission.delete({ where: { id: submissionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Submission Error:', error);
    return NextResponse.json(
      { success: false, error: '심사 자료 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
