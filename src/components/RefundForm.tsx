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
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Создать заявку на возврат</h2>
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md mb-6 text-sm font-medium">
          Заявка успешно создана!
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6 text-sm font-medium">
          Ошибка: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Дата и время платежа клиента</label>
          <input required type="datetime-local" name="paymentDate" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Почта клиента</label>
          <input required type="email" name="email" placeholder="client@example.com" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Сумма (в USDT)</label>
          <input required type="number" step="0.01" min="0" name="amount" placeholder="100.00" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-mono" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">ID Хеша / TxID</label>
          <input required type="text" name="txId" placeholder="0x..." className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-mono" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Сеть оплаты</label>
          <select required name="network" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white transition-shadow">
            <option value="TRC-20">TRC-20</option>
            <option value="ERC-20">ERC-20</option>
            <option value="BEP-20">BEP-20</option>
            <option value="Polygon">Polygon</option>
            <option value="Other">Другая сеть</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Комментарий к случаю</label>
          <textarea required name="comment" rows={3} placeholder="Опишите детальнее почему оформляется возврат..." className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-medium py-2.5 px-5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 mt-2 shadow-sm"
        >
          {loading ? "Отправка..." : "Отправить заявку"}
        </button>
      </form>
    </div>
  );
}
