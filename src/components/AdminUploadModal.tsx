'use client';

import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Link, Trash2, AlertTriangle } from 'lucide-react';

interface AdminUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshSubmissions: () => void;
  currentUserRole: string | null;
  submissions?: any[];
}

export default function AdminUploadModal({
  isOpen,
  onClose,
  onRefreshSubmissions,
  currentUserRole,
  submissions = [],
}: AdminUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [title, setTitle] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [summary, setSummary] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [aiUrl, setAiUrl] = useState('');
  const [privacyUrl, setPrivacyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;
  if (currentUserRole !== 'ADMIN') return null;

  const resetForm = () => {
    setTitle('');
    setStudentName('');
    setStudentId('');
    setDepartment('');
    setSummary('');
    setAppUrl('');
    setResultUrl('');
    setAiUrl('');
    setPrivacyUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !resultUrl) {
      alert('과제명과 2번 시각화 결과물 URL은 필수 입력 사항입니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          title,
          studentName,
          studentId,
          department,
          summary,
          applicationFileUrl: appUrl || null,
          resultFileUrl: resultUrl,
          aiSourceFileUrl: aiUrl || null,
          privacyAgreementFileUrl: privacyUrl || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        resetForm();
        onRefreshSubmissions();
        setActiveTab('manage');
      } else {
        alert(data.error || '자료 등록 실패');
      }
    } catch (err) {
      alert('등록 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId: string, submissionTitle: string) => {
    if (!confirm(`"${submissionTitle}" 작품을 삭제하시겠습니까?\n\n이 작업은 해당 작품에 등록된 모든 심사 채점 데이터도 함께 삭제됩니다.`)) return;

    setDeletingId(submissionId);
    try {
      const res = await fetch('/api/submissions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ submissionId }),
      });

      const data = await res.json();
      if (data.success) {
        onRefreshSubmissions();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      alert('삭제 처리 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl border-[#0083CD]/20 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#0083CD]" />
            <h3 className="text-lg font-bold text-slate-100">심사 작품 관리 (관리자 전용)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-slate-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-3 text-xs font-semibold transition ${
              activeTab === 'upload'
                ? 'text-[#0083CD] border-b-2 border-[#0083CD]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            + 신규 작품 등록
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-5 py-3 text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'text-red-400 border-b-2 border-red-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> 등록된 작품 삭제
            {submissions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                {submissions.length}
              </span>
            )}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === 'upload' ? (
            /* 신규 작품 등록 폼 */
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">과제명 / 작품명 *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="작품 제목 입력"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">대표자 / 팀원 성명</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="성명 입력"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">학번</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="학번 입력"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">소속 학과</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="소속 학과 입력"
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">결과물 설명 요약</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="결과물에 대한 핵심 내용 요약을 입력하십시오."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 resize-none focus:border-[#0083CD] focus:outline-none transition"
                />
              </div>

              <div className="border-t border-slate-800 pt-3 mt-2 space-y-2.5">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-[#0083CD]" /> Google Drive 제출 서류 URL (4종)
                </h4>

                <div>
                  <label className="text-slate-400 block mb-1">2. 시각화 결과물 Google Drive URL * (전원 공개)</label>
                  <input
                    type="text"
                    required
                    value={resultUrl}
                    onChange={(e) => setResultUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">1. 참가 신청서 Google Drive URL (선생님/서포터즈 공개)</label>
                  <input
                    type="text"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">3. AI 활용 고지서 Google Drive URL (선생님/서포터즈 공개)</label>
                  <input
                    type="text"
                    value={aiUrl}
                    onChange={(e) => setAiUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">4. 개인정보 동의서 Google Drive URL (선생님/관리자 전용)</label>
                  <input
                    type="text"
                    value={privacyUrl}
                    onChange={(e) => setPrivacyUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0083CD] hover:bg-[#0284c7] text-white font-bold transition text-xs shadow-lg shadow-[#0083CD]/20"
                >
                  {loading ? '등록 중...' : '신규 심사 자료 등록 완료'}
                </button>
              </div>
            </form>
          ) : (
            /* 등록된 작품 삭제 탭 */
            <div className="space-y-3 text-xs">
              {submissions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p>등록된 심사 작품이 없습니다.</p>
                </div>
              ) : (
                submissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 truncate">{sub.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {sub.studentName || '—'} · {sub.department || '—'} · {sub.studentId || '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(sub.id, sub.title)}
                      disabled={deletingId === sub.id}
                      className="flex-shrink-0 px-3 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 transition flex items-center gap-1.5 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === sub.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
