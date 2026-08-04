'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserCheck, Users, Check, Trash2 } from 'lucide-react';

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
        // 관리자 계정 제외하고 표시
        setUsers(data.users.filter((u: UserData) => u.role !== 'ADMIN'));
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

  // 역할 지정 (APPROVE + role 동시 설정)
  const handleAssignRole = async (userId: string) => {
    const selectedRole = selectedRoleMap[userId] || 'SUPPORTER';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'APPROVE', selectedRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        onRefreshUsers();
      }
    } catch {
      alert('역할 지정 중 오류가 발생했습니다.');
    }
  };

  // 사용자 삭제
  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'DELETE' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        onRefreshUsers();
      }
    } catch {
      alert('삭제 처리 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-3xl p-6 border-red-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">카카오 가입 회원 역할 지정</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          카카오 로그인으로 가입한 회원에게 역할을 지정하면 즉시 플랫폼에 접근할 수 있습니다.
          역할이 필요 없는 회원은 삭제하십시오.
        </p>

        <div className="overflow-y-auto flex-1 pr-1 space-y-3">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-6">사용자 목록을 불러오는 중...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">가입된 회원이 없습니다.</p>
          ) : (
            users.map((u) => {
              const currentSelectedRole = selectedRoleMap[u.id] || (u.role === 'TEACHER' ? 'TEACHER' : 'SUPPORTER');
              const hasRole = u.role && u.role !== 'ADMIN';

              return (
                <div
                  key={u.id}
                  className="p-3.5 bg-gray-100 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">{u.name}</span>
                      <span className="text-[11px] text-gray-400">({u.email || '이메일 없음'})</span>
                      {!hasRole && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">역할 미지정</span>
                      )}
                      {u.role === 'TEACHER' && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">선생님 (사업단)</span>
                      )}
                      {u.role === 'SUPPORTER' && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">서포터즈</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 역할 선택 토글 */}
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setSelectedRoleMap((prev) => ({ ...prev, [u.id]: 'TEACHER' }))}
                        className={`px-2.5 py-1 rounded transition text-[11px] flex items-center gap-1 font-medium ${
                          currentSelectedRole === 'TEACHER'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" /> 선생님
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRoleMap((prev) => ({ ...prev, [u.id]: 'SUPPORTER' }))}
                        className={`px-2.5 py-1 rounded transition text-[11px] flex items-center gap-1 font-medium ${
                          currentSelectedRole === 'SUPPORTER'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Users className="w-3 h-3" /> 서포터즈
                      </button>
                    </div>

                    {/* 역할 지정 버튼 */}
                    <button
                      onClick={() => handleAssignRole(u.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition font-bold flex items-center gap-1 shadow-md shadow-emerald-100"
                    >
                      <Check className="w-3.5 h-3.5" /> {hasRole ? '변경' : '지정'}
                    </button>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                      title="사용자 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
