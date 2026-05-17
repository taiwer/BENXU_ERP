import { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar,
  Users as UsersIcon,
  PieChart,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Transaction } from '../types';

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const exportMonthlyReport = async () => {
    setLoading('monthly');
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const transactions: Transaction[] = await res.json();
        
        const filtered = transactions.filter(t => t.date.startsWith(selectedMonth));
        
        const data = filtered.map(t => ({
          日期: t.date,
          类型: t.type === 'income' ? '收入' : '支出',
          类别: t.category,
          详情: t.type === 'income' ? t.customer : t.description,
          金额: t.type === 'income' ? t.amount : -t.amount,
          经办人: t.operator_name,
          票号: t.invoice_no,
          备注: t.description // description used as remark
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "月度收支");
        XLSX.writeFile(wb, `账务报表_${selectedMonth}.xlsx`);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(null);
    }
  };

  const exportCustomerReport = async () => {
    setLoading('customer');
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const transactions: Transaction[] = await res.json();
        const incomes = transactions.filter(t => t.type === 'income');
        const data = incomes.map(t => ({
          日期: t.date,
          客户名称: t.customer,
          金额: t.amount,
          发票号: t.invoice_no,
          类别: t.category,
          备注: t.description
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "客户往来");
        XLSX.writeFile(wb, `客户对账单_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const exportCategoryReport = async () => {
    setLoading('category');
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const transactions: Transaction[] = await res.json();
        const expenses = transactions.filter(t => t.type === 'expense');
        
        const summary: any = {};
        expenses.forEach(e => {
          summary[e.category] = (summary[e.category] || 0) + e.amount;
        });

        const data = Object.keys(summary).map(cat => ({
          费用类别: cat,
          累计金额: summary[cat]
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "费用汇总");
        XLSX.writeFile(wb, `费用类别统计_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">报表导出</h2>
        <p className="text-gray-500">生成并导出各类财务数据统计表</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Monthly Report */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">月度收支表</h3>
          <p className="mb-6 flex-1 text-sm text-gray-500">导出指定月份的所有收支明细及月度合计。</p>
          
          <div className="space-y-4">
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button 
              onClick={exportMonthlyReport}
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {loading === 'monthly' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              导出 Excel
            </button>
          </div>
        </div>

        {/* Customer Statement */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UsersIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">客户对账单</h3>
          <p className="mb-6 flex-1 text-sm text-gray-500">导出所有客户的交易往来汇总及明细。</p>
          <button 
            onClick={() => exportCustomerReport()}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
          >
            {loading === 'customer' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            导出 Excel
          </button>
        </div>

        {/* Category Summary */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <PieChart className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">费用类别统计</h3>
          <p className="mb-6 flex-1 text-sm text-gray-500">按支出类别统计金额占比，生成统计报表。</p>
          <button 
            onClick={() => exportCategoryReport()}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
          >
            {loading === 'category' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            导出 Excel
          </button>
        </div>
      </div>
      
      <div className="rounded-2xl bg-blue-50 p-6 border border-blue-100">
        <div className="flex gap-4">
          <div className="rounded-full bg-blue-100 p-2 text-blue-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900">导出提示</h4>
            <p className="text-sm text-blue-700 mt-1">
              导出的 Excel 文件采用标准 UTF-8 编码，兼容 Office 2010+ 及 WPS。如遇乱码请在 Excel 中使用“从文本导入”并选择 UTF-8。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
