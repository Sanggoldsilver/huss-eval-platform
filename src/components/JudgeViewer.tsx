'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle2, Eye, EyeOff, FileText, Lock, Send, AlertTriangle, Download, Share2 } from 'lucide-react';
import { getDrivePreviewUrl } from '@/lib/drive';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { shareToKakao } from '@/lib/kakao';
import ScoreChart from './ScoreChart';

interface SubmissionData {
  id: string;
  title: string;
  studentName: string;
  studentId: string;
  department: string;
  summary?: string | null;
  applicationFileUrl?: string | null;
  resultFileUrl: string;
  aiSourceFileUrl?: string | null;
  privacyAgreementFileUrl?: string | null;
  evaluations?: any[];
}

interface JudgeViewerProps {
  submission: SubmissionData;
  currentUserRole: string | null;
  currentUserId: string;
  onSubmitEvaluation: (scores: {
    submissionId: string;
    problemDefinitionScore: number;
    visualizationCreativityScore: number;
    socialValueScore: number;
    majorUtilizationScore: number;
    dataAccuracyScore: number;
    comment: string;
  }) => Promise<void>;
}

export default function JudgeViewer({
  submission,
  currentUserRole,
  currentUserId,
  onSubmitEvaluation,
}: JudgeViewerProps) {
  const isSupporter = currentUserRole === 'SUPPORTER';

  // 구글 드라이브 미리보기 탭 선택
  const [activeTab, setActiveTab] = useState<'result' | 'app' | 'ai' | 'privacy'>('result');

  // 공식 5대 항목 점수 상태 (총 100점)
  const [pScore, setPScore] = useState<number>(25); // 문제인식 (30)
  const [vScore, setVScore] = useState<number>(25); // 시각화/AI창의성 (30)
  const [sScore, setSScore] = useState<number>(12); // 인문사회적가치 (15)
  const [mScore, setMScore] = useState<number>(12); // 소속전공활용 (15)
  const [dScore, setDScore] = useState<number>(8);  // 데이터정확성 (10)
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // 기존 본인 채점 내역이 있으면 로드
  useEffect(() => {
    if (submission.evaluations && submission.evaluations.length > 0) {
      const myEval = submission.evaluations.find((e: any) => e.evaluatorId === currentUserId);
      if (myEval) {
        setPScore(myEval.problemDefinitionScore);
        setVScore(myEval.visualizationCreativityScore);
        setSScore(myEval.socialValueScore);
        setMScore(myEval.majorUtilizationScore);
        setDScore(myEval.dataAccuracyScore);
        setComment(myEval.comment || '');
      }
    }
  }, [submission, currentUserId]);

  const totalScore = pScore + vScore + sScore + mScore + dScore;

  // activeTab에 따른 구글 드라이브 URL
  let targetUrl = submission.resultFileUrl;
  if (activeTab === 'app') targetUrl = submission.applicationFileUrl || '';
  if (activeTab === 'ai') targetUrl = submission.aiSourceFileUrl || '';
  if (activeTab === 'privacy') targetUrl = submission.privacyAgreementFileUrl || '';

  const previewUrl = getDrivePreviewUrl(targetUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedSuccess(false);

    try {
      await onSubmitEvaluation({
        submissionId: submission.id,
        problemDefinitionScore: pScore,
        visualizationCreativityScore: vScore,
        socialValueScore: sScore,
        majorUtilizationScore: mScore,
        dataAccuracyScore: dScore,
        comment,
      });
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 3000);
    } catch (err) {
      alert('채점 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById(`submission-card-${submission.id}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${submission.title}_심사결과.pdf`);
    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      alert('PDF 다운로드에 실패했습니다.');
    }
  };

  const handleShareKakao = () => {
    shareToKakao(
      `심사 결과: ${submission.title}`,
      `총점: ${totalScore}점 - HUSS AI 활용 인문사회 시각화 공모전`
    );
  };

  return (
    <div id={`submission-card-${submission.id}`} className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
      {/* 왼쪽: 심사 자료 & Google Drive 미리보기 (7 columns) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">
                심사 대상 작품
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">{submission.title}</h2>
            </div>
            {isSupporter && (
              <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> 블라인드 심사 적용중
              </span>
            )}
          </div>

          {/* 학생 인적사항 정보 (서포터즈 마스킹 적용) */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs mb-3">
            <div>
              <span className="text-slate-500 block">소속 학과</span>
              <span className="font-semibold text-slate-200">{submission.department}</span>
            </div>
            <div>
              <span className="text-slate-500 block">학번</span>
              <span className="font-semibold text-slate-200">{submission.studentId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">성명 / 팀명</span>
              <span className="font-semibold text-slate-200">{submission.studentName}</span>
            </div>
          </div>

          {submission.summary && (
            <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded border border-slate-800/80 leading-relaxed mb-3">
              <span className="font-semibold text-blue-400">결과물 요약: </span>
              {submission.summary}
            </p>
          )}

          {/* 구글 드라이브 서류 탭 4종 */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('result')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'result'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> 2. 시각화 결과물 (공개)
            </button>

            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'app'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> 1. 참가 신청서
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> 3. AI 출처 고지서
            </button>

            {!isSupporter ? (
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'privacy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> 4. 개인정보 동의서
              </button>
            ) : (
              <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                <Lock className="w-3 h-3 text-amber-500" /> 개인정보 동의서는 서포터즈에 비공개됩니다.
              </span>
            )}
          </div>

          {/* Google Drive 미리보기 iframe 뷰어 */}
          <div className="relative w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                allow="autoplay"
                title="Google Drive Preview"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                미리보기 주소가 연결되지 않았습니다.
              </div>
            )}
            
            {targetUrl && (
              <div className="absolute bottom-3 right-3">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/90 text-blue-400 border border-slate-700 hover:bg-slate-800 transition flex items-center gap-1 font-medium shadow-lg"
                >
                  Google Drive 원본 열람 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 공식 5대 심사 항목 채점표 폼 (5 columns) */}
      <div className="lg:col-span-5">
        <div className="glass-card p-6 border-blue-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500" /> 공식 5대 심사 채점표
            </h3>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">채점 총점</span>
              <span className="text-2xl font-extrabold text-blue-400">{totalScore}</span>
              <span className="text-xs text-slate-500"> / 100점</span>
            </div>
          </div>
          
          <div className="mb-6">
            <ScoreChart scores={{
              problemDefinitionScore: pScore,
              visualizationCreativityScore: vScore,
              socialValueScore: sScore,
              majorUtilizationScore: mScore,
              dataAccuracyScore: dScore,
            }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. 문제인식 및 주제 적절성 (30점) */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-200">
                  1. 문제인식 및 주제 적절성 (배점 30점)
                </label>
                <span className="text-blue-400 font-bold">{pScore}점</span>
              </div>
              <p className="text-slate-500 mb-2">메시지가 명확하고 주제가 타당하게 설정되었는가?</p>
              <input
                type="range"
                min={0}
                max={30}
                value={pScore}
                onChange={(e) => setPScore(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 2. 시각화 전달력 및 AI 활용 창의성 (30점) */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-200">
                  2. 시각화 전달력 및 AI 활용 창의성 (배점 30점)
                </label>
                <span className="text-blue-400 font-bold">{vScore}점</span>
              </div>
              <p className="text-slate-500 mb-2">정보 전달력이 뛰어난 디자인 및 AI 활용 창의성</p>
              <input
                type="range"
                min={0}
                max={30}
                value={vScore}
                onChange={(e) => setVScore(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 3. 인문사회적 가치 실현도 (15점) */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-200">
                  3. 인문사회적 가치 실현도 (배점 15점)
                </label>
                <span className="text-blue-400 font-bold">{sScore}점</span>
              </div>
              <p className="text-slate-500 mb-2">인문사회적 소양 바탕의 사회적 가치 창출 여부</p>
              <input
                type="range"
                min={0}
                max={15}
                value={sScore}
                onChange={(e) => setSScore(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 4. 소속 전공 활용도 (15점) */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-200">
                  4. 소속 전공 활용도 (배점 15점)
                </label>
                <span className="text-blue-400 font-bold">{mScore}점</span>
              </div>
              <p className="text-slate-500 mb-2">본인이 소속한 전공 지식의 유기적 적용 여부</p>
              <input
                type="range"
                min={0}
                max={15}
                value={mScore}
                onChange={(e) => setMScore(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 5. 데이터 표현의 정확성 (10점) */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-200">
                  5. 데이터 표현의 정확성 (배점 10점)
                </label>
                <span className="text-blue-400 font-bold">{dScore}점</span>
              </div>
              <p className="text-slate-500 mb-2">데이터를 왜곡 없이 정확하게 분석하고 표현했는가?</p>
              <input
                type="range"
                min={0}
                max={10}
                value={dScore}
                onChange={(e) => setDScore(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 단평 (심사평) */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                심사위원 단평 (종합 의견)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="작품에 대한 건설적인 심사평 및 의견을 입력하십시오."
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? '제출 중...' : '공식 심사 채점표 제출하기'}
            </button>

            {submittedSuccess && (
              <p className="text-center text-emerald-400 font-medium animate-pulse">
                ✓ 심사 채점이 성공적으로 저장되었습니다.
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4" />
                PDF 다운로드
              </button>
              <button
                type="button"
                onClick={handleShareKakao}
                className="flex-1 py-2 px-3 rounded-lg bg-[#FEE500] hover:bg-[#FEE500]/90 text-black text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                카카오톡 공유
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
