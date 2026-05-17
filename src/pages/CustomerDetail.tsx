import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { Transaction } from '../types';
import { motion } from 'motion/react';

export default function CustomerDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(r => 
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.source?.toLowerCase().includes(searchQuery.toLowerCase())
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
          setRecords(data.filter(t => t.customer === name));
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{name}</h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
              往来详情
            </span>
          </div>
          <p className="text-sm text-gray-500">查看与该对象的所有交易记录</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <span className="text-xs font-bold font-mono">+{records.filter(r => r.type === 'income').length}</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">累计收益</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 text-rose-600">
              <span className="text-xs font-bold font-mono">-{records.filter(r => r.type === 'expense').length}</span>
              <ArrowDownRight className="h-3 w-3" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">累计支出</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="rounded-3xl bg-blue-600 p-6 shadow-lg shadow-blue-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-white/20 p-3 text-white">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm font-medium text-blue-100">净收益</p>
          <p className="text-2xl font-black text-white mt-1">{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="在往来记录中搜索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">日期</th>
                <th className="px-6 py-4">用途/备注</th>
                <th className="px-6 py-4">类型/渠道</th>
                <th className="px-6 py-4">金额</th>
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
                         {record.type === 'income' ? (record.description || '无备注') : (record.description || '无用途')}
                       </div>
                       {record.attachment_url && JSON.parse(record.attachment_url).length > 0 && (
                         <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                           <ImageIcon className="h-2 w-2" />
                           {JSON.parse(record.attachment_url).length}
                         </div>
                       )}
                    </div>
                    {record.invoice_no && <div className="text-[10px] text-gray-400">票号: {record.invoice_no}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {record.source && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                          {record.source}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        record.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {record.category}
                      </span>
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
                    没有找到往来记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
