import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Search,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const data: Transaction[] = await res.json();
          const map = new Map<string, { name: string, count: number, totalIncome: number, totalExpense: number }>();
          
          data.forEach(t => {
            if (t.project_name) {
              const projectName = t.project_name;
              const existing = map.get(projectName) || { name: projectName, count: 0, totalIncome: 0, totalExpense: 0 };
              
              map.set(projectName, {
                name: projectName,
                count: existing.count + 1,
                totalIncome: existing.totalIncome + (t.type === 'income' ? (t.amount || 0) : 0),
                totalExpense: existing.totalExpense + (t.type === 'expense' ? (t.amount || 0) : 0)
              });
            }
          });
          
          setProjects(Array.from(map.values()).sort((a, b) => b.totalIncome + b.totalExpense - (a.totalIncome + a.totalExpense)));
        }
      } catch (err) {
        console.error('Fetch projects failed');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">项目管理</h2>
        <p className="text-gray-500">多维度查看各项目的收支明细与资金流转</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="搜索项目名称..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((p) => (
          <div 
            key={p.name} 
            onClick={() => navigate(`/projects/${encodeURIComponent(p.name)}`)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 active:scale-[0.98]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div className="text-gray-300 group-hover:text-indigo-600 transition-colors">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 truncate">{p.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">关联交易</p>
                <p className="font-bold text-gray-700">{p.count} 笔</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">项目收益</p>
                <p className="font-bold text-emerald-600">+{formatCurrency(p.totalIncome)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">项目成本</p>
                <p className="font-bold text-rose-500">-{formatCurrency(p.totalExpense)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold">项目盈余</p>
                <p className={`font-bold ${p.totalIncome - p.totalExpense >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  {formatCurrency(p.totalIncome - p.totalExpense)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {filteredProjects.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-gray-400 italic">暂无项目数据，请在录入收支时添加项目名称</div>
        )}
      </div>
    </div>
  );
}
