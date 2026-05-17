import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  Loader2, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import ImageUpload from '../components/ImageUpload';

export default function Expense() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<Transaction[]>([]);
  const [parsing, setParsing] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('试剂耗材');
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [description, setDescription] = useState('');

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data: Transaction[] = await res.json();
        setRecords(data.filter(t => t.type === 'expense'));
      }
    } catch (err) {
      console.error('Fetch records failed');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      setError('请输入有效金额');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          amount: parseFloat(amount),
          date,
          customer,
          invoice_no: invoiceNo,
          category,
          description,
          attachment_url: JSON.stringify(attachmentUrls)
        })
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchRecords();
      } else {
        const data = await res.json();
        setError(data.error || '保存失败');
      }
    } catch (error) {
      console.error("Save failed:", error);
      setError('网络异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCustomer('');
    setDescription('');
    setInvoiceNo('');
    setAttachmentUrls([]);
    setError(null);
  };

  const handleAIParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/ai/parse-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();
        if (data.amount) setAmount(data.amount.toString());
        if (data.type) setCategory(data.type); // Mock map or just use text
        if (data.date) setDate(data.date);
        if (data.invoice_no) setInvoiceNo(data.invoice_no);
        if (data.customer) setCustomer(data.customer);
      } catch (err) {
        console.error("AI Parse failed:", err);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">出账记录</h2>
          <p className="text-gray-500">管理所有的支出明细</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          记一笔支出
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索原因、类别、发票号..." 
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            筛选
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">日期</th>
                <th className="px-6 py-4">用途原因</th>
                <th className="px-6 py-4">类别</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">经办人</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="text-sm font-semibold text-gray-900">{record.description}</div>
                       {record.attachment_url && JSON.parse(record.attachment_url).length > 0 && (
                         <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                           <ImageIcon className="h-2 w-2" />
                           {JSON.parse(record.attachment_url).length}
                         </div>
                       )}
                    </div>
                    {record.customer && <div className="text-[10px] text-gray-400 uppercase tracking-tight line-clamp-1">供应商: {record.customer}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 uppercase">
                      {record.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600">
                    -{formatCurrency(record.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.operator_name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 italic text-sm">
                    暂无支出记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-50 px-6 py-4">
          <p className="text-sm text-gray-500">共 {records.length} 条记录</p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-50" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-50" disabled>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Entry Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">记一笔支出</h3>
                <div 
                  className="relative cursor-pointer overflow-hidden rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 transition-all hover:bg-orange-100"
                >
                  {parsing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      识别中...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Camera className="h-3 w-3" />
                      AI 拍照识票
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAIParse}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">支出金额 (元)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-lg font-bold outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">支出类别</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option>试剂耗材</option>
                      <option>设备维护</option>
                      <option>测试费</option>
                      <option>劳务费</option>
                      <option>差旅</option>
                      <option>其他</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">支出原因/供应商</label>
                  <input 
                    required
                    type="text" 
                    placeholder="例如: Western 抗体采购"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">业务日期</label>
                    <input 
                      required
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">发票号码 (可选)</label>
                    <input 
                      type="text" 
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">备注</label>
                  <textarea 
                    rows={2}
                    placeholder="添加详细描述..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">支出凭证 (最多10张)</label>
                  <ImageUpload onImagesChange={setAttachmentUrls} />
                </div>

                {error && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded-lg">{error}</p>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "确认提交"}
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
