import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { RefundRequest, RefundStatus } from '../types';
import { cn } from '../lib/utils';
import { Clock, Search, Edit2, Check, X } from 'lucide-react';

export function RefundList() {
  const [requests, setRequests] = useState<(RefundRequest & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeDialog, setActiveDialog] = useState<{ type: 'refund' | 'info', requestId: string } | null>(null);
  const [dialogInput, setDialogInput] = useState("");
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RefundRequest>>({});

  const startEdit = (req: RefundRequest & { id: string }) => {
    setEditingId(req.id);
    let pd = "";
    if (req.paymentDate) {
      try { pd = new Date(req.paymentDate).toISOString().slice(0, 16); } catch(e){}
    }
    let rd = "";
    if (req.requestDate) {
      try { rd = new Date(req.requestDate).toISOString().slice(0, 10); } catch(e){}
    }
    setEditForm({
      email: req.email,
      amount: req.amount,
      network: req.network,
      txId: req.txId,
      paymentDate: pd,
      requestDate: rd,
      comment: req.comment,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string, original: RefundRequest) => {
    try {
      const updates: any = { updatedAt: Date.now() };
      const changes: string[] = [];

      if (editForm.email !== original.email) {
        updates.email = editForm.email;
        changes.push(`Почта: ${original.email} -> ${editForm.email}`);
      }
      if (editForm.amount?.toString() !== original.amount?.toString()) {
        updates.amount = Number(editForm.amount);
        changes.push(`Сумма: ${original.amount} -> ${editForm.amount}`);
      }
      if (editForm.network !== original.network) {
        updates.network = editForm.network;
        changes.push(`Сеть: ${original.network} -> ${editForm.network}`);
      }
      if (editForm.txId !== original.txId) {
        updates.txId = editForm.txId;
        changes.push(`TxID: ${original.txId} -> ${editForm.txId}`);
      }
      
      const newPdISO = editForm.paymentDate ? new Date(editForm.paymentDate).toISOString() : original.paymentDate;
      if (newPdISO !== original.paymentDate) {
        updates.paymentDate = newPdISO;
        changes.push(`Дата платежа изменена`);
      }
      
      const newRdISO = editForm.requestDate ? new Date(editForm.requestDate).toISOString() : undefined;
      const oldRdISO = original.requestDate;
      if (newRdISO !== oldRdISO) {
        updates.requestDate = newRdISO;
        changes.push(`Дата обращения изменена`);
      }
      
      if (editForm.comment !== original.comment) {
        updates.comment = editForm.comment;
        changes.push(`Комментарий изменен`);
      }

      if (changes.length > 0) {
        updates.history = arrayUnion({
          timestamp: Date.now(),
          author: auth.currentUser?.email || "Unknown",
          description: "Изменены данные: " + changes.join("; ")
        });
        await updateDoc(doc(db, "refund_requests", id), updates);
      }
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Не удалось сохранить изменения.");
    }
  };

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
    return <div className="p-8 text-center text-white/50">Загрузка данных...</div>;
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
    <div className="space-y-4 relative z-10">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-white/40" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по почте, сумме, сети, TxID, комментарию..."
          className="w-full pl-11 pr-4 py-3 bg-[#111111] border border-white/5 rounded-2xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl transition-all"
        />
      </div>

      {filteredRequests.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl text-center text-white/50 bg-[#111111]">
          {searchQuery ? "По вашему запросу ничего не найдено." : "Заявок пока нет."}
        </div>
      ) : (
        filteredRequests.map((req) => (
          <div 
            key={req.id} 
            className={cn(
              "bg-[#111111] p-5 rounded-2xl border shadow-xl transition-all",
              req.status === "Нужна доп инфа" ? "border-l-4 border-l-amber-500 border-y-white/5 border-r-white/5 bg-amber-500/5" : "border-white/5 hover:bg-white/5"
            )}
          >
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-grow">
                {editingId === req.id ? (
                  <>
                    <div>
                      <label className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Почта клиента</label>
                      <input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full text-sm bg-white/5 border-white/10 text-white p-1.5 rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Сумма возврата</label>
                      <div className="flex gap-2">
                        <input type="number" value={editForm.amount || 0} onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})} className="w-full text-sm bg-white/5 border-white/10 text-white p-1.5 rounded font-mono focus:ring-1 focus:ring-blue-500 outline-none" />
                        <select value={editForm.network || ""} onChange={e => setEditForm({...editForm, network: e.target.value})} className="w-[100px] text-sm bg-white/5 border-white/10 text-white p-1.5 rounded focus:ring-1 focus:ring-blue-500 outline-none [&>option]:bg-[#111]">
                          <option value="TRC-20">TRC-20</option>
                          <option value="ERC-20">ERC-20</option>
                          <option value="BEP-20">BEP-20</option>
                          <option value="Polygon">Polygon</option>
                          <option value="Other">Другая</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Дата платежа</label>
                      <input type="datetime-local" value={editForm.paymentDate || ""} onChange={e => setEditForm({...editForm, paymentDate: e.target.value})} className="w-full text-sm bg-white/5 border-white/10 text-white p-1.5 rounded focus:ring-1 focus:ring-blue-500 outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Дата обращения</label>
                      <input type="date" value={editForm.requestDate || ""} onChange={e => setEditForm({...editForm, requestDate: e.target.value})} className="w-full text-sm bg-white/5 border-white/10 text-white p-1.5 rounded focus:ring-1 focus:ring-blue-500 outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                    <div className="md:col-span-2 mt-1">
                      <label className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Входящий Хеш/TxID</label>
                      <input type="text" value={editForm.txId || ""} onChange={e => setEditForm({...editForm, txId: e.target.value})} className="w-full text-sm bg-white/5 border-white/10 text-white p-1.5 rounded font-mono focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2 mt-1">
                      <label className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Комментарий</label>
                      <textarea rows={2} value={editForm.comment || ""} onChange={e => setEditForm({...editForm, comment: e.target.value})} className="w-full text-sm bg-white/5 border-white/10 text-white p-1.5 rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Почта клиента</span>
                      <p className="font-medium text-white text-sm">{req.email}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Сумма возврата</span>
                      <p className="font-medium text-white tabular-nums text-sm">{req.amount} USDT <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded text-xs font-mono ml-2 border border-white/5">{req.network}</span></p>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Дата платежа</span>
                      <p className="text-white/60 text-sm tabular-nums">
                        {new Date(req.paymentDate).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Дата обращения</span>
                      <p className="text-white/60 text-sm tabular-nums">
                        {req.requestDate ? new Date(req.requestDate).toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "Не указана"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Входящий Хеш/TxID</span>
                      <p className="text-white/40 text-xs break-all font-mono">{req.txId}</p>
                    </div>
                    <div className="md:col-span-2 mt-1">
                      <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Комментарий</span>
                      <p className="text-white/80 text-sm">{req.comment}</p>
                    </div>
                  </>
                )}
                
                {req.status === "Вернули" && req.refundTxId && (
                  <div className="md:col-span-2 mt-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-mono text-emerald-400 break-all shadow-sm">
                    <p className="font-bold mb-1 uppercase tracking-tighter text-emerald-500">TxID Возврата:</p>
                    <p>{req.refundTxId}</p>
                  </div>
                )}

                {req.status === "Нужна доп инфа" && req.additionalInfoRequired && (
                  <div className="md:col-span-2 mt-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs shadow-sm">
                    <p className="text-amber-500 font-bold mb-1 uppercase tracking-tighter">Вопрос/Запрос:</p>
                    <p className="text-amber-100/70">{req.additionalInfoRequired}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-[200px] border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6 lg:ml-2">
                <span className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1">Статус</span>
                <select 
                  value={req.status}
                  onChange={(e) => handleStatusChangeClick(req.id, e.target.value as RefundStatus)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none text-center",
                    req.status === "В работе" ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" :
                    req.status === "Вернули" ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" :
                    "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  )}
                >
                  <option value="В работе">В работе</option>
                  <option value="Вернули">Вернули</option>
                  {/* <option value="Нужна доп инфа">Нужна доп инфа</option> */}
                </select>
                <div className="mt-2 text-[10px] text-white/40 text-center uppercase tracking-wider font-semibold">
                  Создал: <br/><span className="lowercase">{req.createdBy}</span>
                </div>
                
                <button 
                  onClick={() => setExpandedHistory(expandedHistory === req.id ? null : req.id)}
                  className="mt-auto pt-4 flex items-center justify-center gap-1.5 text-xs text-blue-500 font-medium hover:text-blue-400 transition-colors"
                >
                  <Clock size={14} />
                  {expandedHistory === req.id ? "Скрыть историю" : "История"}
                </button>

                {editingId === req.id ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <button onClick={() => saveEdit(req.id, req)} className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20">
                      <Check size={14} /> Сохр.
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1 text-xs text-white/50 font-bold bg-white/5 px-2 py-1 rounded hover:bg-white/10">
                      <X size={14} /> Отм.
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(req)} className="mt-2 flex items-center justify-center gap-1.5 text-xs text-white/50 font-medium hover:text-white/80 transition-colors">
                    <Edit2 size={14} /> Редактировать
                  </button>
                )}
              </div>
            </div>

            {expandedHistory === req.id && req.history && req.history.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                <h4 className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-4">История платежа</h4>
                <div className="space-y-4">
                  {req.history.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {idx !== req.history!.length - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-[-16px] w-[2px] bg-white/10" />
                      )}
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0 z-10">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-sm font-medium text-white/90">{entry.author}</span>
                          <span className="text-xs text-white/40 tabular-nums">{new Date(entry.timestamp).toLocaleString('ru-RU')}</span>
                        </div>
                        <p className="text-sm text-white/60">{entry.description}</p>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeDialog.type === 'refund' ? "Укажите данные возврата" : "Запрос дополнительной информации"}
            </h3>
            <p className="text-sm text-white/50 mb-4">
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
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-sm placeholder:text-white/20 transition-all"
                />
              ) : (
                <textarea 
                  autoFocus
                  required
                  rows={3}
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  placeholder="Комментарий для сотрудника..."
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 mb-4 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm placeholder:text-white/20 transition-all"
                />
              )}
              
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setActiveDialog(null)}
                  className="px-4 py-2.5 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
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
