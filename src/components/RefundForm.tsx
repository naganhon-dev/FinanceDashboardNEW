import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { RefundRequest } from '../types';

export function RefundForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Construct the data based on types
    const data: RefundRequest = {
      paymentDate: new Date(formData.get('paymentDate') as string).toISOString(),
      requestDate: new Date(formData.get('requestDate') as string).toISOString(),
      email: formData.get('email') as string,
      amount: parseFloat(formData.get('amount') as string),
      txId: formData.get('txId') as string,
      network: formData.get('network') as string,
      comment: formData.get('comment') as string,
      status: "В работе",
      createdAt: Date.now(),
      createdBy: auth.currentUser?.email || "Unknown",
      updatedAt: Date.now(),
      history: [{
        timestamp: Date.now(),
        author: auth.currentUser?.email || "Unknown",
        description: "Заявка создана"
      }]
    };

    try {
      await addDoc(collection(db, "refund_requests"), data);
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        setError("У вас нет прав для создания заявки. Используйте почту @gerchik.team.");
      } else {
        setError(err.message || "Failed to create refund request.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111111] p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-bl-full pointer-events-none blur-2xl"></div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">Создать заявку на возврат</h2>
      
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl mb-6 text-sm font-medium">
          Заявка успешно создана!
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-medium">
          Ошибка: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-white/50 mb-1.5">Дата и время платежа клиента</label>
            <input required type="datetime-local" name="paymentDate" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-white/50 mb-1.5">Дата обращения клиента</label>
            <input required type="date" name="requestDate" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-white/50 mb-1.5">Почта клиента</label>
          <input required type="email" name="email" placeholder="client@example.com" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-white/50 mb-1.5">Сумма (в USDT)</label>
          <input required type="number" step="0.01" min="0" name="amount" placeholder="100.00" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-white/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-white/50 mb-1.5">ID Хеша / TxID</label>
          <input required type="text" name="txId" placeholder="0x..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-white/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-white/50 mb-1.5">Сеть оплаты</label>
          <select required name="network" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white dark:[&>option]:bg-[#111] dark:[&>option]:text-white">
            <option value="TRC-20">TRC-20</option>
            <option value="ERC-20">ERC-20</option>
            <option value="BEP-20">BEP-20</option>
            <option value="Polygon">Polygon</option>
            <option value="Other">Другая сеть</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-white/50 mb-1.5">Комментарий к случаю</label>
          <textarea required name="comment" rows={3} placeholder="Опишите детальнее почему оформляется возврат..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20" />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-3 px-5 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 mt-4 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
        >

          {loading ? "Отправка..." : "Отправить заявку"}
        </button>
      </form>
    </div>
  );
}
