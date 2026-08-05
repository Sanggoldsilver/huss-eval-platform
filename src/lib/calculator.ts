export interface EvaluationWithEvaluator {
  totalScore: number;
  evaluator: {
    groupType: string | null; // BUSINESS_TEAM or SUPPORTERS_TEAM
    role: string | null;
  };
}

export interface ScoreSummary {
  businessAvg: number;     // 사업단(선생님) 평균 점수 (100점 만점 기준)
  supportersAvg: number;   // 서포터즈 평균 점수 (100점 만점 기준)
  businessWeighted: number; // 사업단 50% 반영점수 (50점 만점 기준)
  supportersWeighted: number; // 서포터즈 50% 반영점수 (50점 만점 기준)
  finalScore: number;      // 최종 합산 점수 (100점 만점)
  businessCount: number;   // 사업단 심사 참여 인원
  supportersCount: number; // 서포터즈 심사 참여 인원
}

/**
 * groupType 값을 정규화합니다.
 * 과거 카카오 가입 계정은 groupType이 '서포터즈'(한글)로 저장된 사례가 있어,
 * 값이 정확히 일치하지 않으면 어느 집단에도 집계되지 않고 0점 처리되는 문제가 있었습니다.
 * role을 보조 근거로 사용해 어떤 표기든 두 집단 중 하나로 확실히 귀속시킵니다.
 */
function normalizeGroup(
  groupType: string | null,
  role: string | null
): 'BUSINESS_TEAM' | 'SUPPORTERS_TEAM' | null {
  if (groupType === 'BUSINESS_TEAM' || groupType === 'SUPPORTERS_TEAM') {
    return groupType;
  }
  if (groupType === '서포터즈') return 'SUPPORTERS_TEAM';
  if (groupType === '사업단' || groupType === '선생님') return 'BUSINESS_TEAM';

  // groupType이 비어있거나 알 수 없는 값이면 role로 판단
  if (role === 'SUPPORTER') return 'SUPPORTERS_TEAM';
  if (role === 'TEACHER' || role === 'ADMIN') return 'BUSINESS_TEAM';

  return null;
}

export function calculateWeightedScores(evaluations: EvaluationWithEvaluator[]): ScoreSummary {
  const businessScores: number[] = [];
  const supportersScores: number[] = [];

  evaluations.forEach((item) => {
    const group = normalizeGroup(item.evaluator.groupType, item.evaluator.role);
    if (group === 'BUSINESS_TEAM') {
      businessScores.push(item.totalScore);
    } else if (group === 'SUPPORTERS_TEAM') {
      supportersScores.push(item.totalScore);
    }
  });

  const businessAvg =
    businessScores.length > 0
      ? businessScores.reduce((a, b) => a + b, 0) / businessScores.length
      : 0;

  const supportersAvg =
    supportersScores.length > 0
      ? supportersScores.reduce((a, b) => a + b, 0) / supportersScores.length
      : 0;

  const businessWeighted = Number((businessAvg * 0.5).toFixed(2));
  const supportersWeighted = Number((supportersAvg * 0.5).toFixed(2));
  const finalScore = Number((businessWeighted + supportersWeighted).toFixed(2));

  return {
    businessAvg: Number(businessAvg.toFixed(2)),
    supportersAvg: Number(supportersAvg.toFixed(2)),
    businessWeighted,
    supportersWeighted,
    finalScore,
    businessCount: businessScores.length,
    supportersCount: supportersScores.length,
  };
}
