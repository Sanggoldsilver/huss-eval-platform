import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { anonymizeSubmissionForSupporter } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role') || null;
    const evaluatorId = req.headers.get('x-user-id');

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
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '오직 관리자 계정만 자료를 등록할 수 있습니다.' },
        { status: 403 }
      );
    }

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

    const newSubData = {
      id: `sub_${Date.now()}`,
      title,
      studentName: studentName || '',
      studentId: studentId || '',
      department: department || '',
      summary: summary || null,
      applicationFileUrl: applicationFileUrl || null,
      resultFileUrl,
      aiSourceFileUrl: aiSourceFileUrl || null,
      privacyAgreementFileUrl: privacyAgreementFileUrl || null,
      createdAt: new Date(),
    };

    const newSubmission = await db.submission.create({
      data: {
        title: newSubData.title,
        studentName: newSubData.studentName,
        studentId: newSubData.studentId,
        department: newSubData.department,
        summary: newSubData.summary,
        applicationFileUrl: newSubData.applicationFileUrl,
        resultFileUrl: newSubData.resultFileUrl,
        aiSourceFileUrl: newSubData.aiSourceFileUrl,
        privacyAgreementFileUrl: newSubData.privacyAgreementFileUrl,
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
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '오직 관리자 계정만 작품을 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

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
