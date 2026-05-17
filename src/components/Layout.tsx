import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Receipt, 
  Users, 
  BarChart3, 
  History,
  Settings, 
  LogOut,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from '../types';

interface LayoutProps {
  children: ReactNode;
  user: User;
}

export default function Layout({ children, user }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed');
    }
  };

  const menuItems = [
    { name: '仪表盘', icon: LayoutDashboard, path: '/' },
    { name: '入账记录', icon: ArrowDownCircle, path: '/income' },
    { name: '出账记录', icon: ArrowUpCircle, path: '/expense' },
    { name: '发票台账', icon: Receipt, path: '/invoices' },
    { name: '客户管理', icon: Users, path: '/customers' },
    { name: '报表导出', icon: BarChart3, path: '/reports' },
    { name: '操作日志', icon: History, path: '/logs' },
    { name: '系统设置', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <h1 className="text-xl font-bold tracking-tight text-white">BENXU_ERP</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2">
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold">BENXU_ERP</h1>
          <div className="w-10" />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-72 flex-col bg-slate-900 text-white flex animate-in slide-in-from-left duration-200">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
              <h1 className="text-xl font-bold text-white">BENXU_ERP</h1>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium",
                      isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-slate-800 p-4">
              <button 
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400"
              >
                <LogOut className="h-5 w-5" />
                退出登录
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
