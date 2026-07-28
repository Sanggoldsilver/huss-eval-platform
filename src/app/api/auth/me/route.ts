import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 현재 JWT 토큰을 검증하고 DB에서 최신 사용자 정보를 읽어 쿠키를 갱신합니다.
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('huss_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: '로그인 정보가 없습니다.' }, { status: 401 });
    }

    // JWT 검증
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // DB에서 최신 사용자 정보 조회 (관리자 승인 후 status 반영)
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 최신 정보로 JWT 재발급
    const newToken = signToken({
      userId: user.id,
      kakaoId: user.kakaoId,
      name: user.name,
      role: user.role,
      groupType: user.groupType,
      status: user.status,
    });

    const userJson = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
      groupType: user.groupType,
      status: user.status,
    }));

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        groupType: user.groupType,
        status: user.status,
      },
    });

    // 갱신된 JWT 및 사용자 정보를 쿠키에 재기록
    response.cookies.set('huss_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('huss_user', userJson, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('승인 상태 확인 오류:', error);
    return NextResponse.json({ success: false, error: '상태 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
