import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

// 하드코딩된 폴백 없이, 미설정 시 사용 시점에 바로 실패하도록 지연 평가합니다.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  kakaoId: string;
  name: string;
  role: string | null;       // ADMIN, TEACHER, SUPPORTER
  groupType: string | null;  // BUSINESS_TEAM, SUPPORTERS_TEAM
  status: string;            // PENDING, APPROVED, REJECTED
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * 요청의 huss_token 쿠키를 서버에서 검증해 세션 사용자 정보를 반환합니다.
 * 클라이언트가 보내는 x-user-id/x-user-role 헤더는 조작 가능하므로 신뢰하지 않고,
 * 모든 API 라우트는 반드시 이 함수를 통해서만 인증/인가를 판단해야 합니다.
 */
export function getSessionUser(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get('huss_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * 서포터즈 그룹(SUPPORTERS_TEAM)을 위한 익명화 함수 (블라인드 처리)
 */
export function anonymizeSubmissionForSupporter<T extends {
  studentName?: string;
  studentId?: string;
  department?: string;
  applicationFileUrl?: string | null;
  aiSourceFileUrl?: string | null;
  privacyAgreementFileUrl?: string | null;
}>(submission: T, role: string | null) {
  if (role === 'SUPPORTER') {
    return {
      ...submission,
      studentName: '블라인드 (익명)',
      studentId: '****',
      // department는 심사 기준 "4. 소속 전공 활용도(배점 15점)" 평가를 위해 마스킹 해제 (원본 유지)
      privacyAgreementFileUrl: null, // 4. 동의서만 비공개
    };
  }
  return submission;
}
