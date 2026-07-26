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

export function calculateWeightedScores(evaluations: EvaluationWithEvaluator[]): ScoreSummary {
  const businessScores: number[] = [];
  const supportersScores: number[] = [];

  evaluations.forEach((item) => {
    if (item.evaluator.groupType === 'BUSINESS_TEAM') {
      businessScores.push(item.totalScore);
    } else if (item.evaluator.groupType === 'SUPPORTERS_TEAM') {
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
