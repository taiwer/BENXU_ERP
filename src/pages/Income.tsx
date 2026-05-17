import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  Loader2, 
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Trash2,
  Edit3,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import ImageUpload from '../components/ImageUpload';
import sourcesData from '../data/sources.json';
import { useNavigate } from 'react-router-dom';

export default function Income() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  
  const filteredRecords = records.filter(r => 
    r.customer?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const [parsing, setParsing] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('实验收入');
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState(sourcesData.income[0]);
  const [customSource, setCustomSource] = useState('');

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data: Transaction[] = await res.json();
        setRecords(data.filter(t => t.type === 'income'));
      }
    } catch (err) {
      console.error('Fetch records failed');
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/transactions/customers');
      if (res.ok) {
        const data = await res.json();
        setAllCustomers(data);
      }
    } catch (err) {
      console.error('Fetch customers failed');
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      setError('请输入有效金额');
      return;
    }

    setLoading(true);
    setError(null);
    
    const finalSource = source === '其他' ? customSource : source;

    try {
      const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          amount: parseFloat(amount),
          date,
          customer,
          invoice_no: invoiceNo,
          category,
          source: finalSource,
          description,
          attachment_url: JSON.stringify(attachmentUrls)
        })
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchRecords();
        fetchCustomers();
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
    setCategory('实验收入');
    setCustomer('');
    setDate(new Date().toISOString().split('T')[0]);
    setInvoiceNo('');
    setDescription('');
    setSource(sourcesData.income[0]);
    setCustomSource('');
    setAttachmentUrls([]);
    setError(null);
    setEditingId(null);
  };

  const handleEdit = (record: Transaction) => {
    setEditingId(record.id || null);
    setAmount(record.amount.toString());
    setCategory(record.category);
    setCustomer(record.customer || '');
    setDate(record.date);
    setInvoiceNo(record.invoice_no || '');
    setDescription(record.description || '');
    
    const existingSource = record.source || '';
    if (sourcesData.income.includes(existingSource) && existingSource !== '其他') {
      setSource(existingSource);
      setCustomSource('');
    } else {
      setSource('其他');
      setCustomSource(existingSource);
    }

    setAttachmentUrls(record.attachment_url ? JSON.parse(record.attachment_url) : []);
    setShowForm(true);
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
        if (data.customer) setCustomer(data.customer);
        if (data.date) setDate(data.date);
        if (data.invoice_no) setInvoiceNo(data.invoice_no);
      } catch (err) {
        console.error("AI Parse failed:", err);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这笔记录吗？')) return;
    
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_deleted: 1 })
      });
      
      if (res.ok) {
        fetchRecords();
      } else {
        alert('删除失败');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">入账记录</h2>
          <p className="text-gray-500">管理所有的收入流水</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          记一笔收入
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索客户、发票号、备注、来源..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">日期</th>
                <th className="px-6 py-4">客户</th>
                <th className="px-6 py-4">来源/类型</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">经办人</th>
                <th className="px-6 py-4 text-right">操作</th>
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
                       <button 
                         onClick={() => navigate(`/customers/${encodeURIComponent(record.customer)}`)}
                         className="text-sm font-semibold text-gray-900 flex items-center gap-1 hover:text-blue-600 transition-colors"
                       >
                         {record.customer}
                         <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                       </button>
                       {record.attachment_url && JSON.parse(record.attachment_url).length > 0 && (
                         <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                           <ImageIcon className="h-2 w-2" />
                           {JSON.parse(record.attachment_url).length}
                         </div>
                       )}
                    </div>
                    {record.invoice_no && <div className="text-[10px] text-gray-400">票号: {record.invoice_no}</div>}
                  </td>
                  <td className="px-6 py-4 mt-1">
                    <div className="flex flex-wrap gap-1">
                      {record.source && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                          {record.source}
                        </span>
                      )}
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
                        {record.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                    +{formatCurrency(record.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.operator_name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title="编辑"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => record.id && handleDelete(record.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 italic text-sm">
                    没有找到相关记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex justify-center p-4 overflow-y-auto sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl my-auto"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingId ? '编辑记录' : '记一笔收入'}</h3>
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
                    <label className="text-sm font-medium text-gray-700">收入金额 (元) <span className="text-rose-500">*</span></label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">收入类型 <span className="text-rose-500">*</span></label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option>实验收入</option>
                      <option>生信收入</option>
                      <option>其他</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">来源渠道 <span className="text-rose-500">*</span></label>
                    <select 
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {sourcesData.income.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {source === '其他' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">具体来源 <span className="text-rose-500">*</span></label>
                      <input 
                        required
                        type="text" 
                        placeholder="请输入具体来源"
                        value={customSource}
                        onChange={(e) => setCustomSource(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">客户名称 <span className="text-rose-500">*</span></label>
                  <input 
                    required
                    list="customer-suggestions"
                    type="text" 
                    placeholder="例如: 某某大学张教授"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <datalist id="customer-suggestions">
                    {allCustomers.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">业务日期 <span className="text-rose-500">*</span></label>
                    <input 
                      required
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 text-gray-400">发票号码 (可选)</label>
                    <input 
                      type="text" 
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 text-gray-400">备注 (可选)</label>
                  <textarea 
                    rows={2}
                    placeholder="添加详细描述..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 text-gray-400">相关凭证 (选填，最多10张)</label>
                  <ImageUpload onImagesChange={setAttachmentUrls} initialImages={attachmentUrls} />
                </div>

                {error && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded-lg">{error}</p>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
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
