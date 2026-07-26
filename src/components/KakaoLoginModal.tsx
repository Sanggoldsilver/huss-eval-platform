'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

  useEffect(() => {
    if (!isOpen) return;

    // 카카오 SDK 초기화
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY);
      }
      setSdkReady(true);
    };

    // SDK가 이미 로드됐으면 바로 초기화, 아니면 폴링
    if (window.Kakao) {
      initKakao();
    } else {
      const interval = setInterval(() => {
        if (window.Kakao) {
          clearInterval(interval);
          initKakao();
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
      onLoginSuccess(data.user);
      onClose();
    } else {
      alert(data.error || '로그인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleKakaoLogin = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert('카카오 SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);
    window.Kakao.Auth.login({
      success: () => {
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
            } catch (e) {
              alert('서버 연동 중 오류가 발생했습니다.');
            } finally {
              setLoading(false);
            }
          },
          fail: (err: any) => {
            console.error('사용자 정보 요청 실패', err);
            alert('카카오 사용자 정보를 가져오는데 실패했습니다.');
            setLoading(false);
          },
        });
      },
      fail: (err: any) => {
        console.error('카카오 로그인 실패', err);
        alert('카카오 로그인에 실패했습니다. 팝업이 차단되어 있다면 허용해 주세요.');
        setLoading(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 border-[#FEE500]/30 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center text-[#191919] font-bold shadow-md">
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current">
                <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">카카오 계정으로 간편 로그인</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          카카오 계정으로 신속하게 본인 인증 및 심사위원 가입을 완료하십시오.
          가입 후 사업단 관리자 승인 시 평가에 참여하실 수 있습니다.
        </p>

        <button
          onClick={handleKakaoLogin}
          disabled={loading || !sdkReady}
          className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#e6cf00] text-[#000000] font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current">
            <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
          </svg>
          {loading
            ? '카카오 인증 처리 중...'
            : !sdkReady
            ? 'SDK 로딩 중...'
            : '카카오 로그인'}
        </button>

        <p className="text-[11px] text-slate-600 text-center mt-4">
          카카오 팝업이 차단되면 브라우저 주소창 우측의 팝업 허용 버튼을 눌러주세요.
        </p>
      </div>
    </div>
  );
}
