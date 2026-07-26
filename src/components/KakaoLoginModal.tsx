'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleKakaoLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('성함을 입력해주십시오.');
      return;
    }

    setLoading(true);
    try {
      const kakaoId = `kakao_${Date.now()}`;
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
        alert(data.error || '로그인 실패');
      }
    } catch (err) {
      alert('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          카카오 계정으로 신속하게 본인 인증 및 심사위원 가입을 완료하십시오. 가입 후 사업단 관리자 승인 시 평가에 참여하실 수 있습니다.
        </p>

        <form onSubmit={handleKakaoLoginSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">심사위원 성명 *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="성함 입력"
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소 입력"
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:border-[#0083CD] focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#e6cf00] text-[#000000] font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current">
              <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
            </svg>
            {loading ? '카카오 인증 진행 중...' : '카카오 로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
