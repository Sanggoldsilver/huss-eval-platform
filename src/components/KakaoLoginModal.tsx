'use client';

import React from 'react';
import { X } from 'lucide-react';

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function KakaoLoginModal({
  isOpen,
  onClose,
}: KakaoLoginModalProps) {
  if (!isOpen) return null;

  const handleKakaoLogin = () => {
    // REST API 키 기반 OAuth URL 방식 — SDK authorize()는 KOE101 발생 가능성이 있어 사용하지 않음
    // Kakao SDK(window.Kakao)는 init/share 기능에만 사용
    const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!restApiKey) {
      alert('카카오 REST API 키가 설정되지 않았습니다.');
      return;
    }
    const redirectUri = `${window.location.origin}/api/auth/callback/kakao`;
    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${restApiKey}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;
    window.location.href = kakaoAuthUrl;
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          카카오 계정으로 신속하게 본인 인증 및 심사위원 가입을 완료하십시오.
          가입 후 사업단 관리자가 역할을 부여하면 바로 평가에 참여하실 수 있습니다.
        </p>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#e6cf00] text-[#000000] font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current">
            <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
          </svg>
          카카오 로그인
        </button>

        <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
          버튼 클릭 시 카카오 인증 페이지로 이동합니다.<br />
          인증 후 자동으로 돌아옵니다.
        </p>
      </div>
    </div>
  );
}
