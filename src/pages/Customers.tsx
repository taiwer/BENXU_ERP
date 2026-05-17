import { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';

export default function Customers() {
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
          const incomes = data.filter(t => t.type === 'income');
          
          const map = new Map<string, { name: string, count: number, total: number }>();
          
          incomes.forEach(t => {
            const existing = map.get(t.customer || '未知客户') || { name: t.customer || '未知客户', count: 0, total: 0 };
            map.set(t.customer || '未知客户', {
              name: t.customer || '未知客户',
              count: existing.count + 1,
              total: existing.total + (t.amount || 0)
            });
          });
          
          setCustomers(Array.from(map.values()).sort((a, b) => b.total - a.total));
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
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">客户管理</h2>
        <p className="text-gray-500">自动汇总所有交易往来的客户</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="搜索客户..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((c) => (
          <div key={c.name} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Users className="h-6 w-6" />
              </div>
              <button className="text-gray-400 hover:text-blue-600">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mb-1 text-lg font-bold text-gray-900 truncate">{c.name}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">累计笔数</p>
                <p className="font-bold text-gray-700">{c.count} 笔</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">累计收入</p>
                <p className="font-bold text-emerald-600">{formatCurrency(c.total)}</p>
              </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-gray-400 italic">暂无客户数据</div>
        )}
      </div>
    </div>
  );
}
