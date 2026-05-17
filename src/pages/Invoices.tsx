import { useState, useEffect } from 'react';
import { 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import { Transaction } from '../types';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{inv.invoice_no}</td>
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
                  <td className="px-6 py-4 text-gray-500">{formatDate(inv.date)}</td>
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
    </div>
  );
}
