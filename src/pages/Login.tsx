import React, { useState } from 'react';
import { LogIn, User, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInit, setShowInit] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data);
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError('网络或服务器连接失败');
    } finally {
      setLoading(false);
    }
  };

  const initializeAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/init-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: 'admin', 
          password: 'admin123', 
          name: '系统管理员' 
        })
      });

      if (res.ok) {
        setError('系统初始化成功！可以使用 admin / admin123 登录了。');
        setShowInit(false);
      } else {
        const data = await res.json();
        setError(data.error || '初始化失败');
      }
    } catch (err) {
      setError('初始化失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-blue-50 p-4">
              <ShieldCheck className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">BENXU_ERP</h1>
          <p className="text-gray-500 mt-1">请使用您的内部账号登录</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input 
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: admin"
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input 
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded-lg">{error}</p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "立即登录"}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-center text-xs text-gray-400">
            仅限团体内部成员使用
          </p>
          <div className="mt-4 flex justify-center">
            <button 
              onClick={() => setShowInit(!showInit)}
              className="text-[10px] uppercase tracking-widest text-gray-300 hover:text-blue-400 transition-colors"
            >
              系统初始化维护
            </button>
          </div>
        </div>

        {showInit && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 rounded-xl bg-orange-50 p-4 border border-orange-100"
          >
            <p className="text-xs text-orange-700 mb-3">如果是首次部署，请点击下方按钮初始化默认管理员账号 (admin / admin123)。</p>
            <button 
              onClick={initializeAdmin}
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 py-2 text-xs font-bold text-white hover:bg-orange-700"
            >
              初始化默认管理员
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
