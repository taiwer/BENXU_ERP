import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, subMonths, format } from 'date-fns';
import { Transaction, Account } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [accRes, transRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/transactions')
      ]);

      if (accRes.ok && transRes.ok) {
        const accounts: Account[] = await accRes.json();
        const transactions: Transaction[] = await transRes.json();

        // Main account stats
        const main = accounts.find(a => a.id === 'main');
        setBalance(main?.current_balance || 0);

        // This month stats
        const thisMonthStr = format(startOfMonth(new Date()), 'yyyy-MM');
        const monthTrans = transactions.filter(t => t.date.startsWith(thisMonthStr));
        
        setMonthIncome(monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0));
        setMonthExpense(monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0));

        // Recent 5
        setRecentTransactions(transactions.slice(0, 5));

        // Chart data aggregation (last 6 months)
        const last6 = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
        const aggregated = last6.map(m => {
          const mStr = format(m, 'yyyy-MM');
          const mTrans = transactions.filter(t => t.date.startsWith(mStr));
          return {
            name: mStr,
            income: mTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
            expense: mTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
          };
        });
        setChartData(aggregated);
      }
    } catch (err) {
      console.error('Fetch dashboard failed');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">欢迎回来</h2>
          <p className="text-gray-500">这是您团体的财务概况</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div 
          whileHover={{ y: -4 }}
          className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-full bg-slate-800 p-3">
              <Wallet className="h-6 w-6 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">当前余额</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-full bg-emerald-50 p-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">本月累计收入</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(monthIncome)}</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-full bg-rose-50 p-3">
              <TrendingDown className="h-6 w-6 text-rose-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">本月累计支出</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(monthExpense)}</div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-900 flex items-center gap-2">
            收支趋势图
            <span className="text-xs font-normal text-gray-400">近 6 个月</span>
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-400" />
            最近记录
          </h3>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm italic">暂无记录</div>
            ) : (
              recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                        {t.type === 'income' ? t.customer : t.description}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => navigate('/income')}
            className="mt-6 w-full rounded-xl bg-gray-50 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            查看更多
          </button>
        </div>
      </div>
    </div>
  );
}
