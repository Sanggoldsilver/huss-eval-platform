export interface UserMock {
  id: string;
  kakaoId: string;
  name: string;
  email: string | null;
  status: string; // PENDING, APPROVED, REJECTED
  role: string | null; // TEACHER, SUPPORTER, ADMIN
  groupType: string | null; // BUSINESS_TEAM, SUPPORTERS_TEAM
  createdAt: Date;
}

export interface SubmissionMock {
  id: string;
  title: string;
  studentName: string;
  studentId: string;
  department: string;
  summary: string | null;
  applicationFileUrl: string | null;
  resultFileUrl: string;
  aiSourceFileUrl: string | null;
  privacyAgreementFileUrl: string | null;
  createdAt: Date;
}

export interface EvaluationMock {
  id: string;
  submissionId: string;
  evaluatorId: string;
  problemDefinitionScore: number;
  visualizationCreativityScore: number;
  socialValueScore: number;
  majorUtilizationScore: number;
  dataAccuracyScore: number;
  comment: string;
  totalScore: number;
  createdAt: Date;
}

class MockStore {
  // 임시 가상 유저 데이터 전면 제거 (100% 빈 상태에서 시작)
  users: UserMock[] = [];

  // 임시 가상 제출작 데이터 전면 제거
  submissions: SubmissionMock[] = [];

  // 임시 가상 채점 데이터 전면 제거
  evaluations: EvaluationMock[] = [];
}

const globalForMock = globalThis as unknown as {
  mockStore: MockStore | undefined;
};

export const mockStore = globalForMock.mockStore ?? new MockStore();
if (process.env.NODE_ENV !== 'production') globalForMock.mockStore = mockStore;
