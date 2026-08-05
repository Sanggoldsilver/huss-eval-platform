'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import JudgeViewer from '@/components/JudgeViewer';
import ReviewPanel from '@/components/ReviewPanel';
import RankingsTable from '@/components/RankingsTable';
import AdminUserModal from '@/components/AdminUserModal';
import AdminUploadModal from '@/components/AdminUploadModal';
import AdminLoginModal from '@/components/AdminLoginModal';
import KakaoLoginModal from '@/components/KakaoLoginModal';
import { Lock, FileCheck2, PlusCircle, AlertCircle, RefreshCw, ShieldCheck, ClipboardList } from 'lucide-react';

// 카카오 window 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

// 브라우저 쿠키에서 특정 키의 값을 읽는 헬퍼
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// 브라우저 쿠키 삭제 헬퍼
function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

export default function HomePage() {
  // 초기 계정 상태: 비로그인(LOGGED_OUT) 상태
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: string | null;
    groupType: string | null;
    status: string;
  } | null>(null);

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [rankings, setRankings] = useState<any[]>([]);
  const [evaluatorSheets, setEvaluatorSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 채점 화면 / 검토 화면 전환
  const [viewMode, setViewMode] = useState<'score' | 'review'>('score');

  // 모달 제어 상태
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isKakaoLoginModalOpen, setIsKakaoLoginModalOpen] = useState<boolean>(false);

  // 종합 시트(랭킹)만 새로고침 — 채점 중인 슬라이더 상태에는 영향 없음
  const loadRankings = async () => {
    try {
      const rankRes = await fetch('/api/rankings');
      const rankData = await rankRes.json();
      if (rankData.success) {
        setRankings(rankData.rankings || []);
        setEvaluatorSheets(rankData.evaluatorSheets || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 데이터 로드
  const loadData = async (userOverride = currentUser) => {
    if (!userOverride) {
      setSubmissions([]);
      setRankings([]);
      setEvaluatorSheets([]);
      return;
    }

    setLoading(true);
    try {
      // 서버가 huss_token 쿠키로 신원/역할을 검증하므로 클라이언트에서 role/id를 별도로 보낼 필요가 없습니다.
      const subRes = await fetch('/api/submissions');
      const subData = await subRes.json();
      if (subData.success) {
        setSubmissions(subData.submissions || []);
        if (subData.submissions && subData.submissions.length > 0) {
          if (!selectedSubmissionId || !subData.submissions.find((s: any) => s.id === selectedSubmissionId)) {
            setSelectedSubmissionId(subData.submissions[0].id);
          }
        } else {
          setSelectedSubmissionId('');
        }
      }

      await loadRankings();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // 카카오 OAuth 리디렉션 후 쿠키에서 사용자 정보 자동 복구
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    // URL에 카카오 에러 파라미터가 있으면 알림
    const params = new URLSearchParams(window.location.search);
    const kakaoError = params.get('kakao_error');
    if (kakaoError) {
      if (kakaoError !== 'cancelled') {
        alert(`카카오 로그인 오류: ${kakaoError}`);
      }
      window.history.replaceState({}, '', '/');
    }

    // httpOnly 쿠키(huss_token)를 서버에서 검증하여 로그인 상태 복구
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          // 역할을 가진 상태이거나 기본 서포터즈로 세팅
          const userState = {
            ...data.user,
            role: data.user.role || 'SUPPORTER',
          };
          setCurrentUser(userState);
        }
      })
      .catch(() => {
        // 미로그인 상태 — 정상적으로 로그인 화면 표시
      });
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData(currentUser);
    }
  }, [currentUser]);

  // 종합 시트를 주기적으로 자동 새로고침 (다른 심사위원의 채점을 실시간에 가깝게 반영)
  useEffect(() => {
    if (!currentUser) return;
    const intervalId = setInterval(loadRankings, 15000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleAdminLoginSuccess = (adminUser: any) => {
    const adminState = {
      id: adminUser.id,
      name: adminUser.name,
      role: adminUser.role,
      groupType: adminUser.groupType,
      status: adminUser.status,
    };
    setCurrentUser(adminState);
    loadData(adminState);
  };

  const handleKakaoLoginSuccess = (user: any) => {
    const userState = {
      id: user.id,
      name: user.name,
      role: user.role || 'SUPPORTER',
      groupType: user.groupType || 'SUPPORTERS_TEAM',
      status: user.status || 'APPROVED',
    };
    setCurrentUser(userState);
    loadData(userState);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.Kakao && window.Kakao.Auth && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 완료');
      });
    }
    deleteCookie('huss_user');
    deleteCookie('huss_token');

    setCurrentUser(null);
    setSubmissions([]);
    setRankings([]);
    setEvaluatorSheets([]);
  };

  const handleSubmitEvaluation = async (evaluationData: any) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    const res = await fetch('/api/evaluations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(evaluationData),
    });

    const data = await res.json();
    if (data.success) {
      loadData(currentUser);
    } else {
      throw new Error(data.error || '제출 실패');
    }
  };

  const handleFinalizeAll = async () => {
    if (!currentUser) return;

    const res = await fetch('/api/evaluations', {
      method: 'PATCH',
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '최종 저장 실패');
    }
    await loadData(currentUser);
  };

  const selectedSubmission = submissions.find((s) => s.id === selectedSubmissionId);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col">
      {/* 탑 네비게이션 헤더 */}
      <Navbar
        currentUser={currentUser}
        onOpenKakaoLoginModal={() => setIsKakaoLoginModalOpen(true)}
        onOpenAdminLoginModal={() => setIsAdminLoginModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* 비로그인 상태일 때: 로그인 관문 렌더링 */}
        {!currentUser ? (
          <div className="glass-card p-12 text-center my-16 max-w-2xl mx-auto border-[#0083CD]/20 shadow-2xl animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-[#0083CD]/10 border border-[#0083CD]/30 flex items-center justify-center mx-auto mb-6 text-[#0083CD]">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">HUSS AI 활용 인문사회 시각화 공모전</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              본 시스템은 인가된 심사위원 및 사업단 관리자 전용 평가 플랫폼입니다. 내부 심사 자료 및 평가 결과를 열람하시려면 로그인해주십시오.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsKakaoLoginModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#FEE500] hover:bg-[#e6cf00] text-[#000000] font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current">
                  <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
                </svg>
                카카오 로그인
              </button>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition text-xs shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> 관리자 로그인
              </button>
            </div>
          </div>
        ) : (
          /* 로그인 성공 사용자: 심사 제출작 및 결과 화면 즉시 렌더링 */
          <>
            {/* 등록된 작품이 없을 때 안내 카드 */}
            {submissions.length === 0 ? (
              <div className="glass-card p-12 text-center my-8 border-[#0083CD]/20">
                <div className="w-16 h-16 rounded-2xl bg-[#0083CD]/10 border border-[#0083CD]/30 flex items-center justify-center mx-auto mb-4 text-[#0083CD]">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">현재 등록된 심사 작품이 없습니다</h3>
                <p className="text-gray-500 text-xs max-w-lg mx-auto leading-relaxed mb-6">
                  관리자 계정(smuhuss4th)으로 상단 &ldquo;자료 업로드&rdquo; 버튼을 눌러 심사 대상 작품을 등록해주십시오.
                </p>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#0083CD] hover:bg-[#0284c7] text-white font-bold text-xs shadow-lg shadow-[#0083CD]/20 inline-flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> 첫 번째 심사 작품 등록하기
                  </button>
                )}
              </div>
            ) : viewMode === 'review' ? (
              <ReviewPanel
                submissions={submissions}
                currentUserId={currentUser?.id || ''}
                onBack={() => setViewMode('score')}
                onFinalizeAll={handleFinalizeAll}
              />
            ) : (
              <>
                {/* 2. 작품 선택 탭 / 셀렉터 바 */}
                <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-[#0083CD]" />
                    <span className="font-bold text-sm text-gray-800">
                      심사 작품 선택 ({submissions.length}개):
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {submissions.map((sub, idx) => {
                      const isSelected = sub.id === selectedSubmissionId;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSubmissionId(sub.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#0083CD] text-white shadow-md shadow-[#0083CD]/20'
                              : 'bg-gray-100 text-gray-500 border border-gray-200 hover:text-gray-800'
                          }`}
                        >
                          <span>작품 {idx + 1}</span>
                          <span className="truncate max-w-[140px] font-normal">{sub.title}</span>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => loadData(currentUser)}
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 ml-2"
                      title="새로고침"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setViewMode('review')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
                    >
                      <ClipboardList className="w-3.5 h-3.5" /> 검토 및 최종 저장
                    </button>
                  </div>
                </div>

                {/* 3. 심사위원 뷰어 컴포넌트 */}
                {selectedSubmission && (
                  <JudgeViewer
                    key={selectedSubmission.id}
                    submission={selectedSubmission}
                    currentUserRole={currentUser?.role || null}
                    currentUserId={currentUser?.id || ''}
                    onSubmitEvaluation={handleSubmitEvaluation}
                  />
                )}
              </>
            )}

            {/* 4. 평가 랭킹 종합표 */}
            <RankingsTable 
              rankings={rankings} 
              currentUserRole={currentUser?.role || null} 
              evaluatorSheets={evaluatorSheets}
              currentUserId={currentUser?.id || ''}
            />
          </>
        )}
      </main>

      {/* 카카오 소셜 로그인 모달 */}
      <KakaoLoginModal
        isOpen={isKakaoLoginModalOpen}
        onClose={() => setIsKakaoLoginModalOpen(false)}
        onLoginSuccess={handleKakaoLoginSuccess}
      />

      {/* 관리자 전용 로그인 모달 */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onAdminLoginSuccess={handleAdminLoginSuccess}
      />

      {/* 관리자 회원 승인 모달 */}
      <AdminUserModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onRefreshUsers={() => loadData(currentUser)}
      />

      {/* 관리자 자료 업로드 모달 */}
      <AdminUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onRefreshSubmissions={() => loadData(currentUser)}
        currentUserRole={currentUser?.role || null}
        submissions={submissions}
      />
    </div>
  );
}
