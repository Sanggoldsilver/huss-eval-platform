'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

// 카카오 window 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function KakaoLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: KakaoLoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 타임아웃 클리어 헬퍼
  const clearLoginTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // 모달 닫힐 때 타임아웃 및 로딩 상태 초기화
      clearLoginTimeout();
      setLoading(false);
      setError(null);
      return;
    }

    // 카카오 SDK 초기화
    const initKakao = () => {
      try {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          const jsKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
          if (!jsKey) {
            setError('카카오 JavaScript API 키가 설정되지 않았습니다.');
            return;
          }
          window.Kakao.init(jsKey);
        }
        setSdkReady(true);
      } catch (e) {
        setError('카카오 SDK 초기화 중 오류가 발생했습니다.');
      }
    };

    if (window.Kakao) {
      initKakao();
    } else {
      // SDK 로드 폴링 (최대 5초)
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.Kakao) {
          clearInterval(interval);
          initKakao();
        } else if (attempts > 25) {
          clearInterval(interval);
          setError('카카오 SDK 로드에 실패했습니다. 네트워크를 확인해주세요.');
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 카카오 사용자 정보로 서버에 로그인/가입 요청
  const registerWithServer = async (kakaoId: string, name: string, email: string | null) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kakaoId, name, email }),
    });
    const data = await res.json();
    if (data.success) {
      clearLoginTimeout();
      onLoginSuccess(data.user);
      onClose();
    } else {
      throw new Error(data.error || '서버 로그인 처리 오류');
    }
  };

  const handleKakaoLogin = () => {
    setError(null);

    if (!window.Kakao) {
      setError('카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      return;
    }
    if (!window.Kakao.isInitialized()) {
      setError('카카오 SDK가 아직 초기화 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);

    // ─────────────────────────────────────────────────────────────
    // 핵심 안전장치: 20초 내 응답 없으면 팝업 차단으로 간주 후 복구
    // ─────────────────────────────────────────────────────────────
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError(
        '카카오 팝업 응답이 없습니다. 브라우저가 팝업을 차단했을 가능성이 높습니다.\n\n' +
        '주소창 우측 팝업 차단 아이콘을 클릭하여 허용 후 다시 시도해주세요.'
      );
    }, 20000);

    window.Kakao.Auth.login({
      success: () => {
        clearLoginTimeout();

        // 로그인 성공 → 사용자 정보 요청
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async (res: any) => {
            const profile = res.kakao_account?.profile;
            const email = res.kakao_account?.email || null;
            const kakaoId = String(res.id);
            const name = profile?.nickname || '카카오 사용자';

            try {
              await registerWithServer(kakaoId, name, email);
            } catch (e: any) {
              setError(e.message || '서버 연동 중 오류가 발생했습니다.');
            } finally {
              setLoading(false);
            }
          },
          fail: (err: any) => {
            console.error('사용자 정보 요청 실패', err);
            setLoading(false);
            setError('카카오 사용자 정보를 가져오는데 실패했습니다. 다시 시도해주세요.');
          },
        });
      },
      fail: (err: any) => {
        clearLoginTimeout();
        console.error('카카오 로그인 실패', err);
        setLoading(false);

        // 카카오 에러 코드별 메시지 처리
        if (err?.error === 'access_denied') {
          setError('카카오 로그인을 취소했습니다.');
        } else if (err?.error_description?.includes('popup')) {
          setError('팝업이 차단됐습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        } else {
          setError(`카카오 로그인에 실패했습니다. (${err?.error || '알 수 없는 오류'})`);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 border-[#FEE500]/30 shadow-2xl animate-fade-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center text-[#191919] shadow-md">
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current">
                <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">카카오 계정으로 간편 로그인</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          카카오 계정으로 신속하게 본인 인증 및 심사위원 가입을 완료하십시오.
          가입 후 사업단 관리자 승인 시 평가에 참여하실 수 있습니다.
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300 whitespace-pre-line leading-relaxed">{error}</p>
          </div>
        )}

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading || !sdkReady}
          className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#e6cf00] text-[#000000] font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              {/* 스피너 */}
              <svg className="animate-spin w-4 h-4 text-[#000000]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              카카오 로그인 팝업 처리 중...
            </>
          ) : !sdkReady ? (
            'SDK 로딩 중...'
          ) : (
            <>
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current">
                <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
              </svg>
              카카오 로그인
            </>
          )}
        </button>

        {/* 로딩 중일 때 안내 메시지 */}
        {loading && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[11px] text-amber-300 leading-relaxed text-center">
              카카오 로그인 팝업이 열려야 합니다.<br />
              팝업이 보이지 않으면 브라우저 주소창 우측의<br />
              <span className="font-bold">팝업 차단 아이콘을 클릭하여 허용</span> 후 닫기 눌러 다시 시도해주세요.
            </p>
          </div>
        )}

        {!loading && (
          <p className="text-[11px] text-slate-600 text-center mt-4">
            팝업이 차단되면 브라우저 주소창 우측의 팝업 허용 버튼을 눌러주세요.
          </p>
        )}
      </div>
    </div>
  );
}
