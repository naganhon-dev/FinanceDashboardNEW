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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium animate-pulse">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Wallet size={32} />
          </div>
          <div className="text-xl font-bold tracking-tight text-indigo-600 mb-2">GERCHIK<span className="text-slate-400 font-light">.TEAM</span></div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Каталог возвратов</h1>
          <p className="text-slate-600 text-sm">
            Войдите используя корпоративную почту (@gerchik.team), чтобы получить доступ к дашборду.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Войти через Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-10 w-full">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold tracking-tight text-indigo-600 hidden sm:block">
            GERCHIK<span className="text-slate-400 font-light">.TEAM</span>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('list')}
              className={`py-5 px-1 transition-colors ${activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'}`}
            >
              Все заявки
            </button>
            <button 
              onClick={() => setActiveTab('new')}
              className={`py-5 px-1 transition-colors ${activeTab === 'new' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'}`}
            >
              Новая заявка
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-slate-600 hidden md:block">{user.email}</span>
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-slate-100"
            title="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-8 flex flex-col gap-6 w-full max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeTab === 'list' ? 'Реестр возвратов' : 'Создать заявку'}
            </h1>
            <p className="text-sm text-slate-500">
              {activeTab === 'list' ? 'Отслеживание операций в реальном времени.' : 'Новая запись на возврат средств клиенту.'}
            </p>
          </div>
          
          {activeTab === 'list' && (
            <button
              onClick={() => setActiveTab('new')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
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
