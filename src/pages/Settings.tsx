import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  UserPlus, 
  Database,
  History,
  AlertTriangle,
  User as UserIcon,
  Trash2,
  X,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { User, Account } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings({ isAdmin }: { isAdmin: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  
  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, accountsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/accounts')
      ]);
      
      if (usersRes.ok && accountsRes.ok) {
        const uData = await usersRes.json();
        const aData: Account[] = await accountsRes.json();
        setUsers(uData);
        const mainAcc = aData.find((a: Account) => a.id === 'main') || null;
        setAccount(mainAcc);
        if (mainAcc) setAccountName(mainAcc.name);
      }
    } catch (err) {
      console.error('Fetch settings failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateAccount = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/accounts/main', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: accountName })
      });
      if (res.ok) {
        fetchData();
        alert('修改成功');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          password: newPassword,
          role: newRole
        })
      });

      if (res.ok) {
        setNewUsername('');
        setNewName('');
        setNewPassword('');
        setShowAddUser(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || '添加失败');
      }
    } catch (err) {
      setError('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('确定要删除该成员吗？')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-rose-50 p-4 text-rose-600">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">权限不足</h2>
        <p className="text-gray-500">仅管理员可以访问系统设置</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">系统设置</h2>
          <p className="text-gray-500">配置账户基础信息、成员权限及操作日志</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          添加成员
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Account Settings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Database className="h-5 w-5 text-gray-400" />
                账户设置
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase">
                运行中
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">账套名称</label>
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button 
                    onClick={handleUpdateAccount}
                    disabled={actionLoading}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 transition-all disabled:opacity-50"
                  >
                    更新
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">期初余额 (元)</label>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="font-mono font-bold text-gray-700">{formatCurrency(account?.initial_balance || 0)}</span>
                  <button className="text-xs font-semibold text-blue-600 hover:underline">申请调整</button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="h-5 w-5 text-gray-400" />
              权限配置
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">软删除模式</p>
                  <p className="text-xs text-gray-500">记录删除后仅标记，保留审计链</p>
                </div>
                <div className="h-6 w-10 rounded-full bg-emerald-500 relative cursor-not-allowed">
                  <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">重复发票预警</p>
                  <p className="text-xs text-gray-500">录入相同发票号时自动提醒</p>
                </div>
                <div className="h-6 w-10 rounded-full bg-emerald-500 relative cursor-not-allowed">
                  <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <UserPlus className="h-5 w-5 text-gray-400" />
                成员管理
              </h3>
              <p className="text-xs text-gray-400">共 {users.length} 人</p>
            </div>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.username} className="group flex items-center justify-between rounded-xl border border-gray-50 p-3 hover:border-gray-100 hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {u.name?.[0] || u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{u.name || u.username}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => u.id && handleDeleteUser(u.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors">编辑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
              <History className="h-5 w-5 text-gray-400" />
              今日操作日志
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3 text-xs">
                <span className="text-gray-400 tabular-nums">09:12:45</span>
                <span className="font-bold text-gray-700">Admin</span>
                <span className="text-gray-500">修改了收入类型 "其他"</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-gray-400 tabular-nums">10:05:22</span>
                <span className="font-bold text-gray-700">MemberA</span>
                <span className="text-gray-500">提交了一笔支出 (¥1,234.00)</span>
              </div>
              <p className="text-center text-[10px] text-blue-600 font-bold uppercase cursor-pointer hover:underline">查看完整审计流水</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <div className="fixed inset-0 z-50 flex justify-center p-4 overflow-y-auto sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUser(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">添加新成员</h3>
                <button onClick={() => setShowAddUser(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">用户名 (登录使用)</label>
                  <input 
                    required
                    type="text" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="如: zhangsan"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">姓名 (显示名)</label>
                  <input 
                    required
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="如: 张三"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">初始密码</label>
                  <input 
                    required
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">角色权限</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="member">普通成员 (Member)</option>
                    <option value="admin">管理员 (Admin)</option>
                  </select>
                </div>

                {error && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl">{error}</p>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddUser(false)}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "确认添加"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
