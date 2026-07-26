import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let users: any[] = [];
    try {
      users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      users = mockStore.users;
    }
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '사용자 목록 조회 실패' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
        const updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            status: 'APPROVED',
            role,
            groupType,
          },
        });
        return NextResponse.json({ success: true, user: updatedUser });
      } catch (dbErr) {
        const targetUser = mockStore.users.find((u) => u.id === userId);
        if (targetUser) {
          targetUser.status = 'APPROVED';
          targetUser.role = role;
          targetUser.groupType = groupType;
        }
        return NextResponse.json({ success: true, user: targetUser });
      }
    } else if (action === 'REJECT') {
      try {
        const updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            status: 'REJECTED',
          },
        });
        return NextResponse.json({ success: true, user: updatedUser });
      } catch (dbErr) {
        const targetUser = mockStore.users.find((u) => u.id === userId);
        if (targetUser) {
          targetUser.status = 'REJECTED';
        }
        return NextResponse.json({ success: true, user: targetUser });
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
