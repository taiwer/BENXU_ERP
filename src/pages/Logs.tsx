import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  Clock,
  User as UserIcon,
  Database
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { OperationLog, User } from '../types';
import { AlertTriangle } from 'lucide-react';

export default function Logs({ user }: { user: User }) {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user.role === 'admin';

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Fetch logs failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-rose-50 p-4 text-rose-600">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">权限不足</h2>
        <p className="text-gray-500">仅管理员可以访问操作日志</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(l => 
    l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.module.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-amber-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getModuleLabel = (module: string) => {
    switch (module) {
      case 'INCOME': return '收入记录';
      case 'EXPENSE': return '支出记录';
      case 'USER': return '用户管理';
      default: return module;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">操作日志</h2>
          </div>
          <p className="text-xs md:text-sm text-gray-500">详细记录系统中所有關鍵操作的版本歷史</p>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索操作人、模块、操作内容..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            刷新
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Mobile Card View */}
        <div className="grid gap-4 sm:hidden">
          {filteredLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-slate-100 p-1.5">
                    <UserIcon className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">{log.user_name}</span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 font-mono">
                    {formatDate(log.created_at)} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                  {getActionIcon(log.action)}
                  <span className={
                    log.action === 'CREATE' ? 'text-emerald-600' :
                    log.action === 'UPDATE' ? 'text-amber-600' :
                    'text-rose-600'
                  }>{log.action}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium px-1.5 py-0.5 bg-gray-50 rounded">
                  {getModuleLabel(log.module)}
                </span>
              </div>

              <div className="space-y-2">
                <pre className="text-[10px] text-gray-500 overflow-hidden text-ellipsis bg-gray-50 p-2 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(JSON.parse(log.details), null, 2)}
                </pre>
                {log.reason && (
                  <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                    <div className="text-[9px] italic text-blue-700 leading-relaxed">
                      <span className="font-bold non-italic mr-1 uppercase text-blue-400">操作原因:</span>
                      {log.reason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && !loading && (
            <div className="py-10 text-center text-gray-400 text-sm italic bg-white rounded-2xl border border-gray-100">
              暂无记录
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4">时间</th>
                  <th className="px-6 py-4">操作人</th>
                  <th className="px-6 py-4">动作 / 模块</th>
                  <th className="px-6 py-4">详细内容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{formatDate(log.created_at)}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="rounded-full bg-slate-100 p-1.5">
                           <UserIcon className="h-3 w-3 text-slate-500" />
                         </div>
                         <span className="text-sm font-medium text-gray-700">{log.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
                          {getActionIcon(log.action)}
                          <span className={
                            log.action === 'CREATE' ? 'text-emerald-600' :
                            log.action === 'UPDATE' ? 'text-amber-600' :
                            'text-rose-600'
                          }>{log.action}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Database className="h-2 w-2" />
                          {getModuleLabel(log.module)}
                          <span className="font-mono text-gray-300">ID:{log.target_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md space-y-2">
                         <pre className="text-[10px] text-gray-500 overflow-hidden text-ellipsis bg-gray-50 p-2 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                           {JSON.stringify(JSON.parse(log.details), null, 2)}
                         </pre>
                         {log.reason && (
                           <div className="flex gap-1.5 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                             <AlertTriangle className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                             <div className="text-[10px] italic text-blue-700 leading-relaxed">
                               <span className="font-bold non-italic mr-1 text-[8px] uppercase tracking-wider text-blue-400">操作原因:</span>
                               {log.reason}
                             </div>
                           </div>
                         )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400 italic text-sm">
                      暂无操作记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
