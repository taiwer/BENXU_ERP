import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  UserPlus, 
  Database,
  History,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { User, Account } from '../types';

export default function Settings({ isAdmin }: { isAdmin: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, accountsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/accounts')
        ]);
        
        if (usersRes.ok && accountsRes.ok) {
          const uData = await usersRes.json();
          const aData = await accountsRes.json();
          setUsers(uData);
          setAccount(aData.find((a: Account) => a.id === 'main') || null);
        }
      } catch (err) {
        console.error('Fetch settings failed');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">系统设置</h2>
        <p className="text-gray-500">配置账户基础信息、成员权限及操作日志</p>
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
                    defaultValue={account?.name || "实验室公用资金"}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 transition-all">
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
                <div key={u.username} className="flex items-center justify-between rounded-xl border border-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {u.name?.[0] || u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{u.name || u.username}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{u.role}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors">编辑权限</button>
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
    </div>
  );
}
