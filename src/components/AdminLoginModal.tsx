'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLoginSuccess: (adminUser: any) => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onAdminLoginSuccess,
}: AdminLoginModalProps) {
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, adminPassword }),
      });

      const data = await res.json();
      if (data.success) {
        onAdminLoginSuccess(data.user);
        onClose();
        setAdminId('');
        setAdminPassword('');
      } else {
        setErrorMsg(data.error || '관리자 아이디 또는 비밀번호가 불일치합니다.');
      }
    } catch (err) {
      setErrorMsg('관리자 로그인 인증 처리 중 서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="glass-card w-full max-w-md p-6 border-red-200"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">관리자 전용 로그인</h3>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              허가된 관리자 전용 아이디와 비밀번호를 입력하여 로그인하십시오.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-600 block mb-1">관리자 아이디</label>
                <input
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="관리자 아이디 입력"
                  className="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 block mb-1">관리자 비밀번호</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="관리자 비밀번호 입력"
                  className="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:border-red-500 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200 font-medium">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition text-xs shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? '인증 확인 중...' : '관리자 계정으로 접속하기'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
