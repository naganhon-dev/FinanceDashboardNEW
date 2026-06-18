import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { RefundRequest, RefundStatus } from '../types';
import { cn } from '../lib/utils';
import { Clock, Search } from 'lucide-react';

export function RefundList() {
  const [requests, setRequests] = useState<(RefundRequest & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeDialog, setActiveDialog] = useState<{ type: 'refund' | 'info', requestId: string } | null>(null);
  const [dialogInput, setDialogInput] = useState("");
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "refund_requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (RefundRequest & { id: string })[];
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      if (error.code === 'permission-denied') {
        alert("У вас нет прав для доступа к базе данных. Используйте корпоративную почту @gerchik.team.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChangeClick = (requestId: string, newStatus: RefundStatus) => {
    if (newStatus === "В работе") {
      updateStatus(requestId, "В работе");
    } else if (newStatus === "Вернули") {
      setActiveDialog({ type: 'refund', requestId });
      setDialogInput("");
    } else if (newStatus === "Нужна доп инфа") {
      setActiveDialog({ type: 'info', requestId });
      setDialogInput("");
    }
  };

  const updateStatus = async (requestId: string, status: RefundStatus, extraField?: { field: string, value: string }) => {
    try {
      const updateData: any = {
        status,
        updatedAt: Date.now()
      };
      
      let actionDesc = `Статус изменен на "${status}"`;
      if (extraField) {
        updateData[extraField.field] = extraField.value;
        if (extraField.field === "refundTxId") {
          actionDesc += `. Указан TxID возврата: ${extraField.value}`;
        } else if (extraField.field === "additionalInfoRequired") {
          actionDesc += `. Запрос доп. инфы: ${extraField.value}`;
        }
      }

      updateData.history = arrayUnion({
        timestamp: Date.now(),
        author: auth.currentUser?.email || "Unknown",
        description: actionDesc
      });

      await updateDoc(doc(db, "refund_requests", requestId), updateData);
    } catch (err) {
      console.error("Error updating document:", err);
      alert("Не удалось обновить статус. Возможно, нет прав.");
    }
  };

  const handleDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDialog) return;

    if (activeDialog.type === 'refund') {
      updateStatus(activeDialog.requestId, "Вернули", { field: "refundTxId", value: dialogInput });
    } else if (activeDialog.type === 'info') {
      updateStatus(activeDialog.requestId, "Нужна доп инфа", { field: "additionalInfoRequired", value: dialogInput });
    }
    setActiveDialog(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Загрузка данных...</div>;
  }

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.email?.toLowerCase().includes(q) ||
      req.amount?.toString().includes(q) ||
      req.network?.toLowerCase().includes(q) ||
      req.txId?.toLowerCase().includes(q) ||
      req.comment?.toLowerCase().includes(q) ||
      req.status?.toLowerCase().includes(q) ||
      req.refundTxId?.toLowerCase().includes(q) ||
      req.additionalInfoRequired?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по почте, сумме, сети, TxID, комментарию..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-shadow"
        />
      </div>

      {filteredRequests.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-500">
          {searchQuery ? "По вашему запросу ничего не найдено." : "Заявок пока нет."}
        </div>
      ) : (
        filteredRequests.map((req) => (
          <div 
            key={req.id} 
            className={cn(
              "bg-white p-5 rounded-xl border shadow-sm transition-all",
              req.status === "Нужна доп инфа" ? "border-l-4 border-l-amber-400 border-y-slate-200 border-r-slate-200 bg-amber-50/30" : "border-slate-200 hover:bg-slate-50/50"
            )}
          >
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-grow">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Почта клиента</span>
                  <p className="font-medium text-slate-900 text-sm">{req.email}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Сумма возврата</span>
                  <p className="font-medium text-slate-900 tabular-nums text-sm">{req.amount} USDT <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono ml-2">{req.network}</span></p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Дата платежа</span>
                  <p className="text-slate-500 text-sm tabular-nums">{new Date(req.paymentDate).toLocaleString('ru-RU')}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Входящий Хеш/TxID</span>
                  <p className="text-slate-400 text-xs break-all font-mono">{req.txId}</p>
                </div>
                <div className="md:col-span-2 mt-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Комментарий</span>
                  <p className="text-slate-700 text-sm">{req.comment}</p>
                </div>
                
                {req.status === "Вернули" && req.refundTxId && (
                  <div className="md:col-span-2 mt-2 bg-emerald-50 border border-emerald-200 p-3 rounded text-xs font-mono text-emerald-800 break-all shadow-sm">
                    <p className="font-bold mb-1 uppercase tracking-tighter">TxID Возврата:</p>
                    <p>{req.refundTxId}</p>
                  </div>
                )}

                {req.status === "Нужна доп инфа" && req.additionalInfoRequired && (
                  <div className="md:col-span-2 mt-2 bg-white border border-amber-200 p-3 rounded text-xs shadow-sm">
                    <p className="text-amber-800 font-bold mb-1 uppercase tracking-tighter">Вопрос/Запрос:</p>
                    <p className="text-slate-600">{req.additionalInfoRequired}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6 lg:ml-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">Статус</span>
                <select 
                  value={req.status}
                  onChange={(e) => handleStatusChangeClick(req.id, e.target.value as RefundStatus)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none text-center",
                    req.status === "В работе" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                    req.status === "Вернули" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                    "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  )}
                >
                  <option value="В работе">В работе</option>
                  <option value="Нужна доп инфа">Нужна доп инфа</option>
                  <option value="Вернули">Вернули</option>
                </select>
                <div className="mt-2 text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold">
                  Создал: <br/><span className="lowercase">{req.createdBy}</span>
                </div>
                
                <button 
                  onClick={() => setExpandedHistory(expandedHistory === req.id ? null : req.id)}
                  className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                >
                  <Clock size={14} />
                  {expandedHistory === req.id ? "Скрыть историю" : "История изменений"}
                </button>
              </div>
            </div>

            {expandedHistory === req.id && req.history && req.history.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                <h4 className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-4">История платежа</h4>
                <div className="space-y-4">
                  {req.history.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {idx !== req.history!.length - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-[-16px] w-[2px] bg-slate-100" />
                      )}
                      <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0 z-10">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-sm font-medium text-slate-900">{entry.author}</span>
                          <span className="text-xs text-slate-400 tabular-nums">{new Date(entry.timestamp).toLocaleString('ru-RU')}</span>
                        </div>
                        <p className="text-sm text-slate-600">{entry.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Dialog overlay for additional inputs */}
      {activeDialog && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {activeDialog.type === 'refund' ? "Укажите данные возврата" : "Запрос дополнительной информации"}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {activeDialog.type === 'refund' 
                ? "Пожалуйста, вставьте Хеш/TxID исходящей транзакции (возврата) или ссылку на нее."
                : "Опишите, что именно нужно добавить или исправить для обработки этой заявки."}
            </p>
            
            <form onSubmit={handleDialogSubmit}>
              {activeDialog.type === 'refund' ? (
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  placeholder="Хеш / TxID возврата"
                  className="w-full border border-slate-300 rounded-md p-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
                />
              ) : (
                <textarea 
                  autoFocus
                  required
                  rows={3}
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  placeholder="Комментарий для сотрудника..."
                  className="w-full border border-slate-300 rounded-md p-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              )}
              
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setActiveDialog(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
