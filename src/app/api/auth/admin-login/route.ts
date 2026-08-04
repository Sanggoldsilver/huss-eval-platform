import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(`admin-login:${ip}`, 10, 5 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주십시오.' },
        { status: 429 }
      );
    }

    const { adminId, adminPassword } = await req.json();

    const expectedId = process.env.ADMIN_LOGIN_ID;
    const expectedHash = process.env.ADMIN_LOGIN_PASSWORD_HASH;
    if (!expectedId || !expectedHash) {
      console.error('ADMIN_LOGIN_ID / ADMIN_LOGIN_PASSWORD_HASH 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { success: false, error: '관리자 로그인이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const passwordMatches =
      typeof adminPassword === 'string' && (await bcrypt.compare(adminPassword, expectedHash));

    if (adminId !== expectedId || !passwordMatches) {
      return NextResponse.json(
        { success: false, error: '관리자 아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const adminUser = await db.user.upsert({
      where: { kakaoId: 'admin_smuhuss4th_master' },
      update: {
        status: 'APPROVED',
        role: 'ADMIN',
        groupType: 'BUSINESS_TEAM',
      },
      create: {
        kakaoId: 'admin_smuhuss4th_master',
        name: 'HUSS 총괄 관리자',
        email: 'smuhuss4th@huss.ac.kr',
        status: 'APPROVED',
        role: 'ADMIN',
        groupType: 'BUSINESS_TEAM',
      },
    });

    const token = signToken({
      userId: adminUser.id,
      kakaoId: adminUser.kakaoId,
      name: adminUser.name,
      role: adminUser.role,
      groupType: adminUser.groupType,
      status: adminUser.status,
    });

    const userJson = encodeURIComponent(
      JSON.stringify({
        id: adminUser.id,
        name: adminUser.name,
        role: adminUser.role,
        groupType: adminUser.groupType,
        status: adminUser.status,
      })
    );

    const response = NextResponse.json({ success: true, user: adminUser });

    // 카카오 로그인과 동일하게 httpOnly 세션 쿠키를 실제로 발급합니다.
    response.cookies.set('huss_token', token, {
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
  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json(
      { success: false, error: '관리자 인증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
