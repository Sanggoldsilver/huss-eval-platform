'use client';

import React, { useState } from 'react';
import { Trophy, Award, Medal, Download, TrendingUp, Users, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreChart from './ScoreChart';

interface RankingItem {
  rank: number;
  id: string;
  title: string;
  studentName: string;
  studentId: string;
  department: string;
  summary?: string | null;
  businessAvg: number;
  supportersAvg: number;
  businessWeighted: number;
  supportersWeighted: number;
  finalScore: number;
  businessCount: number;
  supportersCount: number;
  avgScores?: {
    problemDefinitionScore: number;
    visualizationCreativityScore: number;
    socialValueScore: number;
    majorUtilizationScore: number;
    dataAccuracyScore: number;
  };
}

interface RankingsTableProps {
  rankings: RankingItem[];
  currentUserRole: string | null;
}

export default function RankingsTable({ rankings, currentUserRole }: RankingsTableProps) {
  const isSupporter = currentUserRole === 'SUPPORTER';
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,순위,작품명,학과,학번,이름,사업단평균(100),사업단50%반영,서포터즈평균(100),서포터즈50%반영,최종합계점수\n';
    rankings.forEach((row) => {
      const name = isSupporter ? '익명' : row.studentName;
      const sid = isSupporter ? '****' : row.studentId;
      const dept = isSupporter ? '인문사회계열' : row.department;
      csvContent += `${row.rank},"${row.title.replace(/"/g, '""')}","${dept}","${sid}","${name}",${row.businessAvg},${row.businessWeighted},${row.supportersAvg},${row.supportersWeighted},${row.finalScore}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HUSS_공모전_실시간_랭킹_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card p-6 my-6 border-indigo-500/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">평가 랭킹 종합표</h3>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="text-xs px-3 py-2 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800 transition flex items-center gap-1.5 font-medium"
        >
          <Download className="w-3.5 h-3.5" /> CSV 엑셀 다운로드
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 text-center">순위</th>
              <th className="py-3 px-4">작품명 / 학생 정보</th>
              <th className="py-3 px-3 text-center text-blue-400">
                <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                사업단 평균 (100)
              </th>
              <th className="py-3 px-3 text-center text-blue-300 bg-blue-500/5">사업단 50%</th>
              <th className="py-3 px-3 text-center text-purple-400">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                서포터즈 평균 (100)
              </th>
              <th className="py-3 px-3 text-center text-purple-300 bg-purple-500/5">서포터즈 50%</th>
              <th className="py-3 px-4 text-right text-amber-400">
                <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                최종 합계 점수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rankings.map((row, index) => {
              const isFirst = row.rank === 1;
              const isSecond = row.rank === 2;
              const isThird = row.rank === 3;
              const isExpanded = expandedRow === row.id;

              return (
                <React.Fragment key={row.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                    className={`cursor-pointer hover:bg-slate-900/40 transition ${
                      isFirst ? 'bg-amber-500/5' : ''
                    }`}
                  >
                  {/* 순위 아이콘 및 뱃지 */}
                  <td className="py-3 px-3 text-center font-bold">
                    {isFirst && (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-extrabold text-sm">
                        <Trophy className="w-4 h-4" /> 1위 (최우수)
                      </span>
                    )}
                    {isSecond && (
                      <span className="inline-flex items-center gap-1 text-slate-300 font-bold">
                        <Award className="w-4 h-4 text-slate-400" /> 2위 (우수)
                      </span>
                    )}
                    {isThird && (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                        <Medal className="w-4 h-4" /> 3위 (장려)
                      </span>
                    )}
                    {!isFirst && !isSecond && !isThird && (
                      <span className="text-slate-500">{row.rank}위</span>
                    )}
                  </td>

                  {/* 작품명 및 제출자 */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{row.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isSupporter ? (
                        <span className="text-purple-300 font-mono">[블라인드 처리됨]</span>
                      ) : (
                        <span>
                          {row.department} · {row.studentId} · {row.studentName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 사업단 평균 */}
                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {row.businessAvg}점
                    <span className="block text-[10px] text-slate-500">({row.businessCount}명 심사)</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-400 bg-blue-500/5 font-semibold">
                    +{row.businessWeighted}점
                  </td>

                  {/* 서포터즈 평균 */}
                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {row.supportersAvg}점
                    <span className="block text-[10px] text-slate-500">({row.supportersCount}명 심사)</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-purple-400 bg-purple-500/5 font-semibold">
                    +{row.supportersWeighted}점
                  </td>

                  {/* 최종 합계 */}
                  <td className="py-3 px-4 text-right font-extrabold text-base text-amber-400 font-mono">
                    <div className="flex items-center justify-end gap-2">
                      {row.finalScore}
                      <span className="text-xs text-slate-500 font-normal">점</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </td>
                  </motion.tr>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-900/20 border-b border-slate-800"
                      >
                        <td colSpan={7} className="py-4 px-6 overflow-hidden">
                          <div className="text-slate-300 font-medium mb-3 text-sm">부문별 상세 평균 점수 분포</div>
                          <ScoreChart scores={row.avgScores || {
                            problemDefinitionScore: 25,
                            visualizationCreativityScore: 25,
                            socialValueScore: 12,
                            majorUtilizationScore: 12,
                            dataAccuracyScore: 8,
                          }} />
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
