import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 카카오 인가 코드로 액세스 토큰 교환
async function getKakaoToken(code: string, redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.KAKAO_REST_API_KEY!,
    redirect_uri: redirectUri,
    code,
  });

  // Client Secret이 설정되어 있다면 추가
  if (process.env.KAKAO_CLIENT_SECRET) {
    params.append('client_secret', process.env.KAKAO_CLIENT_SECRET);
  }

  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`카카오 토큰 교환 실패: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// 카카오 액세스 토큰으로 사용자 정보 조회
async function getKakaoUser(accessToken: string) {
  const res = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  if (!res.ok) throw new Error('카카오 사용자 정보 조회 실패');
  return res.json();
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  // 사용자가 카카오 로그인 취소한 경우
  if (errorParam === 'access_denied' || !code) {
    return NextResponse.redirect(new URL('/?kakao_error=cancelled', req.url));
  }

  try {
    // 현재 요청의 origin으로 redirect_uri 동적 구성
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback/kakao`;

    // 1. 인가 코드 → 액세스 토큰
    const accessToken = await getKakaoToken(code, redirectUri);

    // 2. 액세스 토큰 → 사용자 정보
    const kakaoData = await getKakaoUser(accessToken);
    const kakaoId = String(kakaoData.id);
    const profile = kakaoData.kakao_account?.profile;
    const name = profile?.nickname || '카카오 사용자';
    const email = kakaoData.kakao_account?.email || null;

    // 3. DB에서 사용자 조회/생성
    let user = await db.user.findUnique({ where: { kakaoId } });
    if (!user) {
      user = await db.user.create({
        data: {
          kakaoId,
          name,
          email,
          status: 'APPROVED',
          role: 'SUPPORTER',
          groupType: 'SUPPORTERS_TEAM',
        },
      });
    }
    // 4. JWT 토큰 발급
    const jwtToken = signToken({
      userId: user.id,
      kakaoId: user.kakaoId,
      name: user.name,
      role: user.role,
      groupType: user.groupType,
      status: user.status,
    });

    // 5. 쿠키에 사용자 정보 저장 후 메인으로 리디렉션
    const userJson = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
      groupType: user.groupType,
      status: user.status,
    }));

    const response = NextResponse.redirect(new URL('/', req.url));

    // JWT 토큰 쿠키 (httpOnly, 7일)
    response.cookies.set('huss_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    // 클라이언트에서 읽을 사용자 정보 쿠키 (7일)
    response.cookies.set('huss_user', userJson, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('카카오 콜백 처리 오류:', error);
    return NextResponse.redirect(
      new URL(`/?kakao_error=${encodeURIComponent(error.message || '알 수 없는 오류')}`, req.url)
    );
  }
}
