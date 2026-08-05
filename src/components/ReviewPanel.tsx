'use client';

import React, { useState } from 'react';
import { ArrowLeft, ClipboardList, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

interface SubmissionData {
  id: string;
  title: string;
  evaluations?: any[];
}

interface ReviewPanelProps {
  submissions: SubmissionData[];
  currentUserId: string;
  onBack: () => void;
  onFinalizeAll: () => Promise<void>;
}

export default function ReviewPanel({ submissions, currentUserId, onBack, onFinalizeAll }: ReviewPanelProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rows = submissions.map((sub) => {
    const myEval = (sub.evaluations || []).find((e: any) => e.evaluatorId === currentUserId);
    return { submission: sub, myEval };
  });

  const scoredCount = rows.filter((r) => r.myEval).length;
  const finalizedCount = rows.filter((r) => r.myEval?.isFinalized).length;
  const pendingCount = submissions.length - scoredCount;
  const allFinalized = submissions.length > 0 && finalizedCount === submissions.length;

  const handleFinalize = async () => {
    setSubmitting(true);
    try {
      await onFinalizeAll();
      setShowConfirmModal(false);
    } catch (err) {
      alert('최종 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6 my-6 border-blue-200">
      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              최종 저장
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              정말 저장하시겠습니까?
            </p>
            <p className="text-sm text-red-600 font-semibold mb-6">
              저장 후에는 수정할 수 없습니다.
            </p>
            {pendingCount > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
                아직 채점하지 않은 작품이 {pendingCount}개 있습니다. 이 상태로 저장하면 해당 작품은 미채점으로 남습니다.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm transition flex items-center gap-2"
              >
                {submitting ? '저장 중...' : '최종 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            title="채점 화면으로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" /> 채점 검토 및 최종 저장
          </h3>
        </div>

        {allFinalized ? (
          <span className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 전체 최종 저장 완료
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={scoredCount === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-blue-100 transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            최종 저장
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        임시 저장된 채점 내용을 아래에서 확인하십시오. 최종 저장을 누르면 <span className="font-semibold text-gray-700">현재 임시 저장된 모든 작품의 채점이 한 번에 확정</span>되며, 이후에는 수정할 수 없습니다.
        {' '}(채점 완료 {scoredCount} / {submissions.length}개)
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-gray-700">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">작품명</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">문제인식(30)</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">창의성(30)</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">사회적가치(15)</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">전공활용(15)</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">정확성(10)</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">총점(100)</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ submission, myEval }) => (
              <tr key={submission.id} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4 font-semibold text-gray-900">{submission.title}</td>
                {myEval ? (
                  <>
                    <td className="py-3 px-2 text-center font-mono">{myEval.problemDefinitionScore}</td>
                    <td className="py-3 px-2 text-center font-mono">{myEval.visualizationCreativityScore}</td>
                    <td className="py-3 px-2 text-center font-mono">{myEval.socialValueScore}</td>
                    <td className="py-3 px-2 text-center font-mono">{myEval.majorUtilizationScore}</td>
                    <td className="py-3 px-2 text-center font-mono">{myEval.dataAccuracyScore}</td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-amber-600">{myEval.totalScore}</td>
                    <td className="py-3 px-3 text-center">
                      {myEval.isFinalized ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                          <Lock className="w-3 h-3" /> 확정됨
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px]">임시저장</span>
                      )}
                    </td>
                  </>
                ) : (
                  <td colSpan={7} className="py-3 px-2 text-center text-gray-400">미채점</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
