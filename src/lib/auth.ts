import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'huss_secret_jwt_key_2026_super_secure';

export interface TokenPayload {
  userId: string;
  kakaoId: string;
  name: string;
  role: string | null;       // ADMIN, TEACHER, SUPPORTER
  groupType: string | null;  // BUSINESS_TEAM, SUPPORTERS_TEAM
  status: string;            // PENDING, APPROVED, REJECTED
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
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
