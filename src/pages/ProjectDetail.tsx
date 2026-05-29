import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FolderKanban, 
  Search, 
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { Transaction } from '../types';
import { motion } from 'motion/react';

export default function ProjectDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(r => 
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const balance = totalIncome - totalExpense;

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const data: Transaction[] = await res.json();
          setRecords(data.filter(t => t.project_name === name));
        }
      } catch (err) {
        console.error('Fetch records failed');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [name]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="rounded-xl border border-gray-200 bg-white p-1.5 md:p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">{name}</h2>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[8px] md:text-[10px] font-bold text-indigo-600 uppercase">
              项目看板
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500">查看所属项目的全部财务往来记录</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl md:rounded-3xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
          <div className="mb-3 md:mb-4 flex items-center justify-between">
            <div className="rounded-xl md:rounded-2xl bg-emerald-50 p-2 md:p-3 text-emerald-600">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <span className="text-[10px] md:text-xs font-bold font-mono">+{records.filter(r => r.type === 'income').length}</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs md:text-sm font-medium text-gray-500">累计项目收入</p>
          <p className="text-xl md:text-2xl font-black text-gray-900 mt-1">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="rounded-2xl md:rounded-3xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
          <div className="mb-3 md:mb-4 flex items-center justify-between">
            <div className="rounded-xl md:rounded-2xl bg-rose-50 p-2 md:p-3 text-rose-600">
              <TrendingDown className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex items-center gap-1 text-rose-600">
              <span className="text-[10px] md:text-xs font-bold font-mono">-{records.filter(r => r.type === 'expense').length}</span>
              <ArrowDownRight className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xs md:text-sm font-medium text-gray-500">累计项目成本</p>
          <p className="text-xl md:text-2xl font-black text-gray-900 mt-1">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="rounded-2xl md:rounded-3xl bg-indigo-600 p-4 md:p-6 shadow-lg shadow-indigo-200">
          <div className="mb-3 md:mb-4 flex items-center justify-between">
            <div className="rounded-xl md:rounded-2xl bg-white/20 p-2 md:p-3 text-white">
              <Briefcase className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
          <p className="text-xs md:text-sm font-medium text-indigo-100">项目盈余</p>
          <p className="text-xl md:text-2xl font-black text-white mt-1">{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索项目记录、客户、摘要..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {/* Mobile Card View */}
        <div className="grid gap-4 sm:hidden">
          {filteredRecords.map((record) => (
            <div key={record.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">{formatDate(record.date)}</div>
                  <div className="mt-0.5 text-sm font-bold text-gray-900 line-clamp-1">{record.customer}</div>
                </div>
                <div className={cn(
                  "text-sm font-bold",
                  record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                </div>
              </div>
              <div className="mb-2 text-xs text-gray-500 line-clamp-1">{record.description}</div>
              <div className="flex flex-wrap gap-1.5">
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  record.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                )}>
                  {record.category}
                </span>
                {record.payment_mode && (
                  <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {record.payment_mode}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 ml-auto">经办: {record.operator_name}</span>
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm italic bg-white rounded-2xl border border-gray-100">
              暂无记录
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4">日期</th>
                  <th className="px-6 py-4">客户/摘要</th>
                  <th className="px-6 py-4">分类/状态</th>
                  <th className="px-6 py-4">项目收支</th>
                  <th className="px-6 py-4">经办人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                           {record.customer}
                         </div>
                         {record.attachment_url && JSON.parse(record.attachment_url).length > 0 && (
                           <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                             <ImageIcon className="h-2 w-2" />
                             {JSON.parse(record.attachment_url).length}
                           </div>
                         )}
                      </div>
                      <div className="text-[10px] text-gray-400 line-clamp-1">{record.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          record.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {record.category}
                        </span>
                        {record.payment_mode && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                            {record.payment_mode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold ${
                      record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.operator_name}
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-400 italic text-sm">
                      该项目下记录为空
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
