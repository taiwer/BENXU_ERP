import { useState, useEffect } from 'react';
import { 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  X,
  Calendar,
  User as UserIcon,
  Tag,
  CreditCard,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInv, setSelectedInv] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const data: Transaction[] = await res.json();
          const withInvoice = data.filter(t => t.invoice_no && t.invoice_no.trim() !== '');
          setInvoices(withInvoice);
        }
      } catch (err) {
        console.error('Fetch invoices failed');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">发票台账</h2>
        <p className="text-gray-500">所有含发票信息的记录汇总</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">总票数</span>
          </div>
          <div className="text-2xl font-bold">{invoices.length} 张</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100 font-sans">
                <th className="px-6 py-4">发票号码</th>
                <th className="px-6 py-4">关联业务</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">日期</th>
                <th className="px-6 py-4 text-right">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <tr 
                  key={inv.id} 
                  onClick={() => setSelectedInv(inv)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-blue-600">{inv.invoice_no}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {inv.type === 'income' ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-rose-500" />}
                      <span className="font-sans font-medium text-gray-600 truncate max-w-[150px]">
                        {inv.type === 'income' ? inv.customer : inv.description}
                      </span>
                    </div>
                  </td>
                  <td className={cn(
                    "px-6 py-4 font-bold",
                    inv.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {inv.type === 'income' ? '+' : '-'}{formatCurrency(inv.amount)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-sans">{formatDate(inv.date)}</td>
                  <td className="px-6 py-4 text-right font-sans">
                      <span className="text-xs text-emerald-500 font-medium">已录入</span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 italic font-sans">
                    暂无发票记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedInv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInv(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-xl p-2",
                    selectedInv.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">发票详情</h3>
                    <p className="text-xs text-gray-400">发票号码: {selectedInv.invoice_no}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInv(null)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center py-6 bg-gray-50 rounded-2xl">
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">金额</p>
                   <div className={cn(
                     "text-4xl font-black",
                     selectedInv.type === 'income' ? "text-emerald-600" : "text-rose-600"
                   )}>
                     {selectedInv.type === 'income' ? '+' : '-'}{formatCurrency(selectedInv.amount)}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">业务日期</p>
                      <p className="text-sm font-medium">{formatDate(selectedInv.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">款项性质</p>
                      <p className="text-sm font-medium">{selectedInv.payment_mode || '未标记'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Tag className="h-4 w-4 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">分类</p>
                      <p className="text-sm font-medium">{selectedInv.category}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserIcon className="h-4 w-4 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">经办人</p>
                      <p className="text-sm font-medium">{selectedInv.operator_name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t pt-4">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{selectedInv.type === 'income' ? '客户' : '支出原因'}</p>
                    <p className="text-sm font-medium">{selectedInv.type === 'income' ? selectedInv.customer : selectedInv.description}</p>
                    {selectedInv.type === 'income' && selectedInv.description && (
                      <p className="mt-1 text-xs text-gray-500">{selectedInv.description}</p>
                    )}
                  </div>
                </div>

                {selectedInv.attachment_url && JSON.parse(selectedInv.attachment_url).length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center gap-2">
                       <ImageIcon className="h-4 w-4 text-gray-400" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase">附件凭证 ({JSON.parse(selectedInv.attachment_url).length})</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {JSON.parse(selectedInv.attachment_url).map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                          <img 
                            src={url} 
                            alt="attachment" 
                            className="h-16 w-16 rounded-lg object-cover border hover:border-blue-500 transition-colors" 
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setSelectedInv(null)}
                  className="w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 transition-all hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
