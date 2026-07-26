import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { adminId, adminPassword } = await req.json();

    // 지정된 관리자 아이디 및 비밀번호 검증 (smuhuss4th / smuhuss4th)
    if (adminId !== 'smuhuss4th' || adminPassword !== 'smuhuss4th') {
      return NextResponse.json(
        { success: false, error: '관리자 아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    let adminUser: any = null;

    try {
      adminUser = await db.user.upsert({
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
    } catch (dbErr) {
      adminUser = mockStore.users.find((u) => u.role === 'ADMIN') || {
        id: 'admin_smuhuss4th_master',
        kakaoId: 'admin_smuhuss4th_master',
        name: 'HUSS 총괄 관리자 (smuhuss4th)',
        email: 'smuhuss4th@huss.ac.kr',
        status: 'APPROVED',
        role: 'ADMIN',
        groupType: 'BUSINESS_TEAM',
        createdAt: new Date(),
      };
    }

    const token = signToken({
      userId: adminUser.id,
      kakaoId: adminUser.kakaoId,
      name: adminUser.name,
      role: adminUser.role,
      groupType: adminUser.groupType,
      status: adminUser.status,
    });

    return NextResponse.json({
      success: true,
      user: adminUser,
      token,
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json(
      { success: false, error: '관리자 인증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
