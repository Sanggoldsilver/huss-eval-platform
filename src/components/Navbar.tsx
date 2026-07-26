'use client';

import React from 'react';
import { ShieldCheck, UserCheck, Users, Lock, PlusCircle } from 'lucide-react';

interface NavbarProps {
  currentUser: {
    name: string;
    role: string | null;
    groupType: string | null;
    status: string;
  } | null;
  onOpenKakaoLoginModal: () => void;
  onOpenAdminLoginModal: () => void;
  onOpenAdminModal: () => void;
  onOpenUploadModal: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentUser,
  onOpenKakaoLoginModal,
  onOpenAdminLoginModal,
  onOpenAdminModal,
  onOpenUploadModal,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 브랜드 및 로고 (ansim_2_ide 디자인 시스템 #0083CD 블루 포인트 반영) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0083CD] via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-[#0083CD]/20">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                HUSS AI 활용 인문사회 시각화 공모전
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0083CD]/10 text-[#0083CD] border border-[#0083CD]/20 font-semibold">
                평가 플랫폼
              </span>
            </div>
            <p className="text-xs text-slate-400">
              상명대학교 HUSS 홍보대사 HUGS 4기
            </p>
          </div>
        </div>

        {/* 사용자 정보 및 계정 액션 */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>

                {currentUser.role === 'ADMIN' && (
                  <span className="text-xs px-2 py-0.5 rounded badge-admin flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 인증된 관리자
                  </span>
                )}
                {currentUser.role === 'TEACHER' && (
                  <span className="text-xs px-2 py-0.5 rounded badge-teacher flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> 선생님 (사업단 50%)
                  </span>
                )}
                {currentUser.role === 'SUPPORTER' && (
                  <span className="text-xs px-2 py-0.5 rounded badge-supporter flex items-center gap-1">
                    <Users className="w-3 h-3" /> 서포터즈 (서포터즈 50%)
                  </span>
                )}
                {currentUser.status === 'PENDING' && (
                  <span className="text-xs px-2 py-0.5 rounded badge-pending flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 승인 대기중
                  </span>
                )}
              </div>

              {/* 관리자 전용 기능 */}
              {currentUser.role === 'ADMIN' && (
                <>
                  <button
                    onClick={onOpenAdminModal}
                    className="text-xs px-3 py-2 rounded-xl bg-[#E9537C]/10 text-[#E9537C] border border-[#E9537C]/30 hover:bg-[#E9537C]/20 transition flex items-center gap-1.5 font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> 회원 승인 관리
                  </button>
                  <button
                    onClick={onOpenUploadModal}
                    className="text-xs px-3 py-2 rounded-xl bg-[#0083CD] text-white hover:bg-[#0284c7] transition flex items-center gap-1.5 font-semibold shadow-md shadow-[#0083CD]/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> 자료 업로드
                  </button>
                </>
              )}

              <button
                onClick={onLogout}
                className="text-xs px-3 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition font-medium"
              >
                로그아웃
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* ansim_2_ide 카카오 시그니처 로그인 버튼 */}
              <button
                onClick={onOpenKakaoLoginModal}
                className="text-xs px-4 py-2 rounded-xl bg-[#FEE500] hover:bg-[#e6cf00] text-[#000000] font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
              >
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 fill-current">
                  <path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.44 5.44c-0.16 0.48 0.4 0.88 0.8 0.56l6.4-4.32c0.4 0.08 0.8 0.08 1.12 0.08 6.96 0 12.64-4.48 12.64-10.08 0-5.6-5.68-10.24-12.64-10.24z" />
                </svg>
                카카오 로그인
              </button>

              <button
                onClick={onOpenAdminLoginModal}
                className="text-xs px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> 관리자 로그인
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
