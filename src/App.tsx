import React, { useEffect, useState } from 'react';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { RefundForm } from './components/RefundForm';
import { RefundList } from './components/RefundList';
import { LogOut, PlusCircle, LayoutList, Wallet } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white/50 font-medium animate-pulse">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-md w-full bg-[#111111] rounded-2xl shadow-2xl border border-white/5 p-8 text-center space-y-6 relative z-10">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
            <Wallet size={32} />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-sm"></div></div>
            GTE <span className="text-white/50 font-light">Каталог возвратов</span>
          </div>
          <p className="text-white/60 text-sm">
            Войдите используя корпоративную почту (@gerchik.team), чтобы получить доступ к дашборду.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
          >
            Войти через Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white flex flex-col overflow-x-hidden relative">
      <header className="h-16 bg-[#111111] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 w-full">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hidden sm:flex">
             <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center"><div className="w-2.5 h-2.5 bg-white rounded-sm"></div></div>
             GTE <span className="text-white/50 text-base font-light ml-1">Каталог возвратов</span>
          </div>
          <nav className="flex gap-6 text-sm font-medium h-16">
            <button 
              onClick={() => setActiveTab('list')}
              className={`relative h-full px-1 transition-colors ${activeTab === 'list' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Все заявки
              {activeTab === 'list' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('new')}
              className={`relative h-full px-1 transition-colors ${activeTab === 'new' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Новая заявка
              {activeTab === 'new' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              )}
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 py-1.5 px-3 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs font-medium text-white/80 hidden md:block">{user.email}</span>
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
            title="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-8 flex flex-col gap-6 w-full max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {activeTab === 'list' ? 'Реестр возвратов' : 'Создать заявку'}
            </h1>
            <p className="text-sm text-white/40">
              {activeTab === 'list' ? 'Отслеживание операций в реальном времени.' : 'Новая запись на возврат средств клиенту.'}
            </p>
          </div>
          
          {activeTab === 'list' && (
            <button
              onClick={() => setActiveTab('new')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2"
            >
              <PlusCircle size={16} />
              Новая заявка
            </button>
          )}
        </div>

        <div className="flex-grow flex flex-col">
          {activeTab === 'list' ? (
            <RefundList />
          ) : (
            <div className="w-full max-w-2xl">
              <RefundForm />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

