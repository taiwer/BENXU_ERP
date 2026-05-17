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
  ExternalLink,
  Download,
  Calendar,
  User as UserIcon,
  CreditCard,
  FolderKanban
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import ImageUpload from '../components/ImageUpload';
import { useNavigate } from 'react-router-dom';

export default function Expense() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState<string[]>([]);

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('all');
  const [filterOperator, setFilterOperator] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.customer?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.operator_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStartDate = !filterStartDate || r.date >= filterStartDate;
    const matchesEndDate = !filterEndDate || r.date <= filterEndDate;
    const matchesPaymentMode = filterPaymentMode === 'all' || r.payment_mode === filterPaymentMode;
    const matchesOperator = !filterOperator || r.operator_name?.toLowerCase().includes(filterOperator.toLowerCase());
    const matchesProject = !filterProject || r.project_name?.toLowerCase().includes(filterProject.toLowerCase());

    return matchesSearch && matchesStartDate && matchesEndDate && matchesPaymentMode && matchesOperator && matchesProject;
  });

  const [parsing, setParsing] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('试剂耗材');
  const [customer, setCustomer] = useState('');
  const [projectName, setProjectName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<'对公' | '对私'>('对私');

  // Reason Modal State
  const [showReasonModal, setShowReasonModal] = useState<'update' | 'delete' | null>(null);
  const [opReason, setOpReason] = useState('');
  const [pendingActionData, setPendingActionData] = useState<any>(null);

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

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data);
      }
    } catch (err) {
      console.error('Fetch projects failed');
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      setError('请输入有效金额');
      return;
    }

    if (editingId && !opReason) {
      setPendingActionData({ type: 'update' });
      setShowReasonModal('update');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          amount: parseFloat(amount),
          date,
          customer,
          invoice_no: invoiceNo,
          category,
          payment_mode: paymentMode,
          project_name: projectName,
          description,
          attachment_url: JSON.stringify(attachmentUrls),
          operation_reason: opReason
        })
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchRecords();
        fetchCustomers();
        fetchProjects();
      } else {
        const data = await res.json();
        setError(data.error || '保存失败');
      }
    } catch (error) {
      console.error("Save failed:", error);
      setError('网络异常，请重试');
    } finally {
      setLoading(false);
      setOpReason('');
      setShowReasonModal(null);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('试剂耗材');
    setCustomer('');
    setProjectName('');
    setDate(new Date().toISOString().split('T')[0]);
    setInvoiceNo('');
    setDescription('');
    setPaymentMode('对私');
    setAttachmentUrls([]);
    setError(null);
    setEditingId(null);
    setOpReason('');
  };

  const handleEdit = (record: Transaction) => {
    setEditingId(record.id || null);
    setAmount(record.amount.toString());
    setCategory(record.category);
    setCustomer(record.customer || '');
    setProjectName(record.project_name || '');
    setDate(record.date);
    setInvoiceNo(record.invoice_no || '');
    setDescription(record.description || '');
    setPaymentMode(record.payment_mode || '对私');
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

  const handleExport = () => {
    const headers = ['日期', '支出原因', '项目', '供应商', '发票号', '类别', '款项类型', '金额', '备注', '经办人'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.description,
      r.project_name || '',
      r.customer,
      r.invoice_no,
      r.category,
      r.payment_mode,
      r.amount,
      r.description, // Re-using description for remark if needed or separate field
      r.operator_name
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `出账明细_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: number) => {
    if (!opReason) {
      setPendingActionData({ type: 'delete', id });
      setShowReasonModal('delete');
      return;
    }
    
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_deleted: 1,
          operation_reason: opReason
        })
      });
      
      if (res.ok) {
        fetchRecords();
        fetchProjects();
      } else {
        alert('删除失败');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setOpReason('');
      setShowReasonModal(null);
      setPendingActionData(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">出账记录</h2>
          <p className="hidden sm:block text-sm text-gray-500">管理所有的支出明细</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          记一笔支出
        </button>
      </header>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button 
          onClick={() => setShowForm(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-400 active:scale-90 transition-transform"
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索项目、原因说明、类别、发票号、商户、经办人..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition-all ${
                showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              高级筛选
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              导出 CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                起始日期
              </label>
              <input 
                type="date" 
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                截止日期
              </label>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                款项类型
              </label>
              <select 
                value={filterPaymentMode}
                onChange={e => setFilterPaymentMode(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">全部类型</option>
                <option value="对公">对公</option>
                <option value="对私">对私</option>
              </select>
            </div>
              <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                关联项目
              </label>
              <input 
                type="text" 
                placeholder="搜索项目..."
                value={filterProject}
                onChange={e => setFilterProject(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                经办人
              </label>
              <input 
                type="text" 
                placeholder="搜索经办人..."
                value={filterOperator}
                onChange={e => setFilterOperator(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Records Section */}
      <div className="space-y-4">
        {/* Mobile Card View */}
        <div className="grid gap-4 sm:hidden">
          {filteredRecords.map((record) => (
            <div key={record.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium">{formatDate(record.date)}</div>
                  <div className="mt-0.5 text-sm font-bold text-gray-900 line-clamp-2">
                    {record.description}
                  </div>
                </div>
                <div className="text-sm font-bold text-rose-600">
                  -{formatCurrency(record.amount)}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {record.project_name && (
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                    #{record.project_name}
                  </span>
                )}
                <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {record.category}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                  {record.payment_mode}
                </span>
                {record.customer && (
                  <button 
                    onClick={() => navigate(`/customers/${encodeURIComponent(record.customer)}`)}
                    className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600"
                  >
                    商户: {record.customer}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="text-[10px] text-gray-500">经办人: {record.operator_name}</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(record)}
                    className="p-1.5 text-blue-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => record.id && handleDelete(record.id)}
                    className="p-1.5 text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
                  <th className="px-6 py-4">用途原因/商户</th>
                  <th className="px-6 py-4">类别</th>
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
                         <div className="text-sm font-semibold text-gray-900 line-clamp-1">{record.description}</div>
                         {record.attachment_url && JSON.parse(record.attachment_url).length > 0 && (
                           <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                             <ImageIcon className="h-2 w-2" />
                             {JSON.parse(record.attachment_url).length}
                           </div>
                         )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {record.project_name && (
                          <button 
                            onClick={() => navigate(`/projects/${encodeURIComponent(record.project_name!)}`)}
                            className="text-[10px] text-indigo-500 hover:underline font-medium"
                          >
                            #{record.project_name}
                          </button>
                        )}
                        {record.customer && (
                          <button 
                            onClick={() => navigate(`/customers/${encodeURIComponent(record.customer)}`)}
                            className="text-[10px] text-gray-400 uppercase tracking-tight line-clamp-1 hover:text-blue-600 flex items-center gap-1 transition-colors"
                          >
                            商户: {record.customer}
                            <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                      </div>
                    </td>
                     <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {record.payment_mode && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            record.payment_mode === '对公' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {record.payment_mode}
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 uppercase">
                          {record.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-rose-600">
                      -{formatCurrency(record.amount)}
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
              className="relative w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingId ? '编辑记录' : '记一笔支出'}</h3>
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
                    <label className="text-sm font-medium text-gray-700">支出金额 (元) <span className="text-rose-500">*</span></label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-lg font-bold outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">支出类别 <span className="text-rose-500">*</span></label>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">款项性质 <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setPaymentMode('对私')}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          paymentMode === '对私' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        对私 (私下付)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMode('对公')}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          paymentMode === '对公' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        对公 (走发票)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">支出原因 <span className="text-rose-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    placeholder="例如: Western 抗体采购"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 text-gray-400">供应商/商户 (可选)</label>
                  <input 
                    list="customer-suggestions"
                    type="text" 
                    placeholder="例如: 某某生信代理公司"
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
                    <label className="text-sm font-medium text-gray-700">项目名称 <span className="text-gray-400">(可选)</span></label>
                    <input 
                      list="project-suggestions"
                      type="text" 
                      placeholder="关联到具体项目..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <datalist id="project-suggestions">
                      {allProjects.map(p => <option key={p} value={p} />)}
                    </datalist>
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
                  <label className="text-sm font-medium text-gray-700 text-gray-400">支出凭证 (选填，最多10张)</label>
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

      {/* Reason Modal */}
      <AnimatePresence>
        {showReasonModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowReasonModal(null); setOpReason(''); }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            >
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {showReasonModal === 'delete' ? '确认删除' : '确认修改'}
              </h3>
              <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                为了保证账目审计合规，所有的{showReasonModal === 'delete' ? '删除' : '修改'}操作都必须填写明确的原因。
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    操作原因 <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    required
                    autoFocus
                    rows={3}
                    placeholder="请简要说明原因，例如：录入错误、金额变动、退款等..."
                    value={opReason}
                    onChange={(e) => setOpReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setShowReasonModal(null); setOpReason(''); }}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    disabled={!opReason.trim()}
                    onClick={() => {
                      if (showReasonModal === 'delete') {
                        handleDelete(pendingActionData.id);
                      } else {
                        handleSubmit({ preventDefault: () => {} } as any);
                      }
                    }}
                    className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-30 active:scale-95"
                  >
                    确认提交
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
