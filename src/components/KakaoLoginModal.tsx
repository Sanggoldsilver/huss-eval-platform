'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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


  // ─────────────────────────────────────────────────────────────
  // 팝업 방식 ❌ → OAuth 리디렉션 방식 ✅
  // 팝업은 브라우저 차단 이슈가 항상 발생함.
  // 카카오 공식 표준인 인가 코드(Authorization Code) 방식으로 전환.
  // ─────────────────────────────────────────────────────────────
  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!clientId) {
      alert('카카오 REST API 키가 설정되지 않았습니다.');
      return;
    }

    // 현재 origin으로 redirect_uri 동적 구성 (로컬/배포 모두 대응)
    const redirectUri = `${window.location.origin}/api/auth/callback/kakao`;

    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;

    // 현재 탭에서 카카오 인증 페이지로 이동 (팝업 차단 없음)
    window.location.href = kakaoAuthUrl;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="glass-card w-full max-w-md p-6 border-[#FEE500]/30 shadow-2xl"
          >
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
              가입 후 사업단 관리자 승인 시 평가에 참여하실 수 있습니다.
            </p>

            {/* 카카오 로그인 버튼 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleKakaoLogin}
              className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#e6cf00] text-[#000000] font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current">
                <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
              </svg>
              카카오 로그인
            </motion.button>

            <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
              버튼 클릭 시 카카오 인증 페이지로 이동합니다.<br />
              인증 후 자동으로 돌아옵니다.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
