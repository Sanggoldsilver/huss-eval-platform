import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { kakaoId, name, email } = await req.json();

    if (!kakaoId || !name) {
      return NextResponse.json(
        { success: false, error: '카카오 계정 정보가 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    let user: any = null;

    try {
      // DB 시도: 기존 사용자 조회 또는 신규 생성 (기본 상태: PENDING)
      user = await db.user.findUnique({ where: { kakaoId } });

      if (!user) {
        user = await db.user.create({
          data: {
            kakaoId,
            name,
            email: email || null,
            status: 'PENDING',
            role: null,
            groupType: null,
          },
        });
      }
    } catch (dbErr) {
      // DB 미연결 시 MockStore 폴백
      user = mockStore.users.find((u) => u.kakaoId === kakaoId) || null;

      if (!user) {
        user = {
          id: `user_${Date.now()}`,
          kakaoId,
          name,
          email: email || null,
          status: 'PENDING',
          role: null,
          groupType: null,
          createdAt: new Date(),
        };
        mockStore.users.push(user);
      }
    }

    const token = signToken({
      userId: user.id,
      kakaoId: user.kakaoId,
      name: user.name,
      role: user.role,
      groupType: user.groupType,
      status: user.status,
    });

    return NextResponse.json({ success: true, user, token });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
