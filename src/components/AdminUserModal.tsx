'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserCheck, Users, Check, Ban } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email?: string | null;
  status: string;
  role?: string | null;
  groupType?: string | null;
  createdAt: string;
}

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshUsers: () => void;
}

export default function AdminUserModal({
  isOpen,
  onClose,
  onRefreshUsers,
}: AdminUserModalProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRoleMap, setSelectedRoleMap] = useState<{ [key: string]: 'TEACHER' | 'SUPPORTER' }>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleApprove = async (userId: string) => {
    const selectedRole = selectedRoleMap[userId] || 'SUPPORTER';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'APPROVE',
          selectedRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        onRefreshUsers();
      }
    } catch (e) {
      alert('승인 처리 중 오류 발생');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'REJECT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        onRefreshUsers();
      }
    } catch (e) {
      alert('거절 처리 중 오류 발생');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-3xl p-6 border-red-500/20 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-slate-100">카카오 회원 가입 승인 및 역할 지정</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          카카오 로그인으로 가입 신청한 계정을 관리자가 승인해야 평가 플랫폼에 접근할 수 있습니다.
          승인 시 &ldquo;선생님&rdquo; (사업단 50% 가중치) 또는 &ldquo;서포터즈&rdquo; (서포터즈 50% 가중치)를 선택하십시오.
        </p>

        <div className="overflow-y-auto flex-1 pr-1 space-y-3">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-6">사용자 목록을 불러오는 중...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">등록된 사용자가 없습니다.</p>
          ) : (
            users.map((u) => {
              const currentSelectedRole = selectedRoleMap[u.id] || (u.role === 'TEACHER' ? 'TEACHER' : 'SUPPORTER');

              return (
                <div
                  key={u.id}
                  className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{u.name}</span>
                      <span className="text-[11px] text-slate-500">({u.email})</span>
                      {u.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded badge-pending">승인대기</span>
                      )}
                      {u.status === 'APPROVED' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          승인완료 ({u.role})
                        </span>
                      )}
                      {u.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">거절됨</span>
                      )}
                    </div>
                  </div>

                  {/* 승인 역할 선택 라디오/버튼 그룹 */}
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedRoleMap((prev) => ({ ...prev, [u.id]: 'TEACHER' }))
                        }
                        className={`px-2.5 py-1 rounded transition text-[11px] flex items-center gap-1 font-medium ${
                          currentSelectedRole === 'TEACHER'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" /> 선생님 (사업단)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedRoleMap((prev) => ({ ...prev, [u.id]: 'SUPPORTER' }))
                        }
                        className={`px-2.5 py-1 rounded transition text-[11px] flex items-center gap-1 font-medium ${
                          currentSelectedRole === 'SUPPORTER'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Users className="w-3 h-3" /> 서포터즈
                      </button>
                    </div>

                    <button
                      onClick={() => handleApprove(u.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-3.5 h-3.5" /> 승인
                    </button>
                    {u.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleReject(u.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
