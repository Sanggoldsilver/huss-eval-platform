import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '관리자만 조회할 수 있습니다.' }, { status: 403 });
  }

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '사용자 목록 조회 실패' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '관리자만 처리할 수 있습니다.' }, { status: 403 });
  }

  try {
    const { userId, action, selectedRole } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: '필수 요청 인자가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      let role = 'SUPPORTER';
      let groupType = 'SUPPORTERS_TEAM';

      if (selectedRole === 'TEACHER') {
        role = 'TEACHER';
        groupType = 'BUSINESS_TEAM';
      } else if (selectedRole === 'SUPPORTER') {
        role = 'SUPPORTER';
        groupType = 'SUPPORTERS_TEAM';
      } else if (selectedRole === 'ADMIN') {
        role = 'ADMIN';
        groupType = 'BUSINESS_TEAM';
      }

      try {
        // 역할 부여 시 status를 APPROVED로 함께 갱신
        const updatedUser = await db.user.update({
          where: { id: userId },
          data: { status: 'APPROVED', role, groupType },
        });
        return NextResponse.json({ success: true, user: updatedUser });
      } catch (dbErr) {
        console.error('Approve error:', dbErr);
        return NextResponse.json({ success: false, error: 'DB 업데이트 실패' }, { status: 500 });
      }
    } else if (action === 'DELETE') {
      // 역할 미부여 사용자 삭제
      try {
        await db.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true });
      } catch (dbErr) {
        console.error('Delete error:', dbErr);
        return NextResponse.json({ success: false, error: 'DB 삭제 실패' }, { status: 500 });
      }
    }

    return NextResponse.json(
      { success: false, error: '유효하지 않은 동작입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('User Approval Error:', error);
    return NextResponse.json(
      { success: false, error: '회원 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
