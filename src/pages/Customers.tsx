import { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const data: Transaction[] = await res.json();
          // Include both income and expense for customer aggregation
          const map = new Map<string, { name: string, count: number, totalIncome: number, totalExpense: number }>();
          
          data.forEach(t => {
            const customerName = t.customer || '未知';
            const existing = map.get(customerName) || { name: customerName, count: 0, totalIncome: 0, totalExpense: 0 };
            
            map.set(customerName, {
              name: customerName,
              count: existing.count + 1,
              totalIncome: existing.totalIncome + (t.type === 'income' ? (t.amount || 0) : 0),
              totalExpense: existing.totalExpense + (t.type === 'expense' ? (t.amount || 0) : 0)
            });
          });
          
          setCustomers(Array.from(map.values()).sort((a, b) => b.totalIncome - a.totalIncome));
        }
      } catch (err) {
        console.error('Fetch customers failed');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">往来对象</h2>
        <p className="text-xs md:text-sm text-gray-500">自动汇总所有交易往来的客户与供应商</p>
      </header>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="搜索客户/供应商..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((c) => (
          <div 
            key={c.name} 
            onClick={() => navigate(`/customers/${encodeURIComponent(c.name)}`)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 active:scale-[0.98]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 truncate">{c.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">往来笔数</p>
                <p className="font-bold text-gray-700">{c.count} 笔</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">累计收益</p>
                <p className="font-bold text-emerald-600">+{formatCurrency(c.totalIncome)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">累计支出</p>
                <p className="font-bold text-rose-500">-{formatCurrency(c.totalExpense)}</p>
              </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-gray-400 italic">暂无往来数据</div>
        )}
      </div>
    </div>
  );
}
