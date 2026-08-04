'use client';

import React, { useState } from 'react';
import { Trophy, Award, Medal, Download, TrendingUp, Users, UserCheck, ChevronDown, ChevronUp, FileText } from 'lucide-react';
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

export interface EvaluatorSheet {
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluatorGroupType: string;
  scores: {
    submissionId: string;
    submissionTitle: string;
    department: string;
    studentName: string;
    studentId: string;
    problemDefinitionScore: number;
    visualizationCreativityScore: number;
    socialValueScore: number;
    majorUtilizationScore: number;
    dataAccuracyScore: number;
    totalScore: number;
    comment: string;
    isFinalized: boolean;
  }[];
}

interface RankingsTableProps {
  rankings: RankingItem[];
  currentUserRole: string | null;
  evaluatorSheets?: EvaluatorSheet[];
  currentUserId?: string;
}

export default function RankingsTable({ rankings, currentUserRole, evaluatorSheets = [], currentUserId = '' }: RankingsTableProps) {
  const isSupporter = currentUserRole === 'SUPPORTER';
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('summary');

  const visibleSheets = isSupporter
    ? evaluatorSheets.filter(sheet => sheet.evaluatorId === currentUserId)
    : evaluatorSheets;

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

  const exportSheetToCSV = (sheet: EvaluatorSheet) => {
    let csvContent = 'data:text/csv;charset=utf-8,작품명,학과,문제인식,창의성,사회적가치,전공활용,정확성,총점,단평,확정여부\n';
    sheet.scores.forEach((score) => {
      const dept = score.department;
      csvContent += `"${score.submissionTitle.replace(/"/g, '""')}","${dept}",${score.problemDefinitionScore},${score.visualizationCreativityScore},${score.socialValueScore},${score.majorUtilizationScore},${score.dataAccuracyScore},${score.totalScore},"${(score.comment || '').replace(/"/g, '""')}","${score.isFinalized ? 'O' : 'X'}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HUSS_평가시트_${sheet.evaluatorName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllSheetsToCSV = () => {
    if (visibleSheets.length === 0) {
      alert('다운로드할 시트가 없습니다.');
      return;
    }
    visibleSheets.forEach(sheet => {
      exportSheetToCSV(sheet);
    });
  };

  const handleDownloadActiveTab = () => {
    if (activeTab === 'summary') {
      exportToCSV();
    } else {
      const sheet = visibleSheets.find(s => s.evaluatorId === activeTab);
      if (sheet) exportSheetToCSV(sheet);
    }
  };

  const renderSummaryTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left text-gray-700">
        <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] border-b border-gray-200">
          <tr>
            <th className="py-3 px-3 text-center">순위</th>
            <th className="py-3 px-4">작품명 / 학생 정보</th>
            <th className="py-3 px-3 text-center text-blue-600">
              <UserCheck className="w-3.5 h-3.5 inline mr-1" />
              사업단 평균 (100)
            </th>
            <th className="py-3 px-3 text-center text-blue-500 bg-blue-50">사업단 50%</th>
            <th className="py-3 px-3 text-center text-purple-600">
              <Users className="w-3.5 h-3.5 inline mr-1" />
              서포터즈 평균 (100)
            </th>
            <th className="py-3 px-3 text-center text-purple-500 bg-purple-50">서포터즈 50%</th>
            <th className="py-3 px-4 text-right text-amber-600">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
              최종 합계 점수
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
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
                  className={`cursor-pointer hover:bg-gray-50 transition ${
                    isFirst ? 'bg-amber-50' : ''
                  }`}
                >
                {/* 순위 아이콘 및 뱃지 */}
                <td className="py-3 px-3 text-center font-bold">
                  {isFirst && (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-extrabold text-sm">
                      <Trophy className="w-4 h-4" /> 1위 (최우수)
                    </span>
                  )}
                  {isSecond && (
                    <span className="inline-flex items-center gap-1 text-gray-700 font-bold">
                      <Award className="w-4 h-4 text-gray-500" /> 2위 (우수)
                    </span>
                  )}
                  {isThird && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                      <Medal className="w-4 h-4" /> 3위 (장려)
                    </span>
                  )}
                  {!isFirst && !isSecond && !isThird && (
                    <span className="text-gray-400">{row.rank}위</span>
                  )}
                </td>

                {/* 작품명 및 제출자 */}
                <td className="py-3 px-4">
                  <div className="font-semibold text-gray-900">{row.title}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {isSupporter ? (
                      <span className="text-purple-500 font-mono">[블라인드 처리됨]</span>
                    ) : (
                      <span>
                        {row.department} · {row.studentId} · {row.studentName}
                      </span>
                    )}
                  </div>
                </td>

                {/* 사업단 평균 */}
                <td className="py-3 px-3 text-center font-mono text-gray-700">
                  {row.businessAvg}점
                  <span className="block text-[10px] text-gray-400">({row.businessCount}명 심사)</span>
                </td>
                <td className="py-3 px-3 text-center font-mono text-blue-600 bg-blue-50 font-semibold">
                  +{row.businessWeighted}점
                </td>

                {/* 서포터즈 평균 */}
                <td className="py-3 px-3 text-center font-mono text-gray-700">
                  {row.supportersAvg}점
                  <span className="block text-[10px] text-gray-400">({row.supportersCount}명 심사)</span>
                </td>
                <td className="py-3 px-3 text-center font-mono text-purple-600 bg-purple-50 font-semibold">
                  +{row.supportersWeighted}점
                </td>

                {/* 최종 합계 */}
                <td className="py-3 px-4 text-right font-extrabold text-base text-amber-600 font-mono">
                  <div className="flex items-center justify-end gap-2">
                    {row.finalScore}
                    <span className="text-xs text-gray-400 font-normal">점</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </td>
                </motion.tr>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 border-b border-gray-200"
                    >
                      <td colSpan={7} className="py-4 px-6 overflow-hidden">
                        <div className="text-gray-700 font-medium mb-3 text-sm">부문별 상세 평균 점수 분포</div>
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
  );

  const renderSheetTable = (sheet: EvaluatorSheet) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left text-gray-700">
        <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] border-b border-gray-200">
          <tr>
            <th className="py-3 px-4 min-w-[150px]">작품명</th>
            <th className="py-3 px-3 min-w-[120px]">소속 학과</th>
            <th className="py-3 px-2 text-center whitespace-nowrap">문제인식(30)</th>
            <th className="py-3 px-2 text-center whitespace-nowrap">창의성(30)</th>
            <th className="py-3 px-2 text-center whitespace-nowrap">사회적가치(15)</th>
            <th className="py-3 px-2 text-center whitespace-nowrap">전공활용(15)</th>
            <th className="py-3 px-2 text-center whitespace-nowrap">정확성(10)</th>
            <th className="py-3 px-2 text-center whitespace-nowrap">총점(100)</th>
            <th className="py-3 px-4 min-w-[150px]">단평</th>
            <th className="py-3 px-2 text-center whitespace-nowrap">확정 여부</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sheet.scores.map((score, index) => {
            return (
              <tr key={index} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4 font-semibold text-gray-900">{score.submissionTitle}</td>
                <td className="py-3 px-3">
                  <div className="text-gray-900">{score.department}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {isSupporter ? (
                      <span className="text-purple-500 font-mono">**** · 익명</span>
                    ) : (
                      <span>{score.studentId} · {score.studentName}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center font-mono">{score.problemDefinitionScore}</td>
                <td className="py-3 px-2 text-center font-mono">{score.visualizationCreativityScore}</td>
                <td className="py-3 px-2 text-center font-mono">{score.socialValueScore}</td>
                <td className="py-3 px-2 text-center font-mono">{score.majorUtilizationScore}</td>
                <td className="py-3 px-2 text-center font-mono">{score.dataAccuracyScore}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-amber-600">{score.totalScore}</td>
                <td className="py-3 px-4 max-w-[200px] truncate" title={score.comment}>{score.comment || '-'}</td>
                <td className="py-3 px-2 text-center">
                  {score.isFinalized ? (
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">확정</span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px]">미확정</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="glass-card p-6 my-6 border-indigo-200">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-4">
        <div className="flex-1 w-full overflow-x-auto pb-2 lg:pb-0">
          <div className="flex items-center gap-2 w-max">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'summary' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <Trophy className="w-4 h-4" />
              종합 시트
            </button>
            {visibleSheets.map(sheet => (
              <button
                key={sheet.evaluatorId}
                onClick={() => setActiveTab(sheet.evaluatorId)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  activeTab === sheet.evaluatorId 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4" />
                {sheet.evaluatorName} ({sheet.evaluatorRole})
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadActiveTab}
            className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 transition flex items-center gap-1.5 font-medium"
          >
            <Download className="w-3.5 h-3.5" /> CSV 엑셀 다운로드
          </button>
          
          {visibleSheets.length > 0 && (
            <button
              onClick={exportAllSheetsToCSV}
              className="text-xs px-3 py-2 rounded-lg bg-[#0083CD] text-white border border-transparent hover:bg-[#0284c7] shadow-md shadow-[#0083CD]/20 transition flex items-center gap-1.5 font-medium"
            >
              <Download className="w-3.5 h-3.5" /> 전체 시트 일괄 다운로드
            </button>
          )}
        </div>
      </div>

      {activeTab === 'summary' ? renderSummaryTable() : (
        visibleSheets.find(s => s.evaluatorId === activeTab) ? (
          renderSheetTable(visibleSheets.find(s => s.evaluatorId === activeTab)!)
        ) : (
          <div className="p-8 text-center text-gray-500">데이터가 없습니다.</div>
        )
      )}
    </div>
  );
}
