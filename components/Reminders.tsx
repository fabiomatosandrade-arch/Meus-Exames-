
import React, { useState, useMemo } from 'react';
import { Reminder, ExamRecord } from '../types';
import { 
  Bell, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Search
} from 'lucide-react';

interface RemindersProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  exams: ExamRecord[];
}

const Reminders: React.FC<RemindersProps> = ({ reminders, setReminders, exams }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    examName: '',
    frequencyMonths: 6,
    lastDate: new Date().toISOString().split('T')[0],
    active: true
  });

  const uniqueExamNames = useMemo(() => {
    return Array.from(new Set(exams.map(e => e.examName))).sort();
  }, [exams]);

  const calculateNextDate = (lastDate: string, months: number) => {
    const date = new Date(lastDate);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReminder.examName && newReminder.frequencyMonths && newReminder.lastDate) {
      const nextDate = calculateNextDate(newReminder.lastDate, newReminder.frequencyMonths);
      const reminder: Reminder = {
        id: Date.now().toString(),
        examName: newReminder.examName.toUpperCase(),
        frequencyMonths: newReminder.frequencyMonths,
        lastDate: newReminder.lastDate,
        nextDate: nextDate,
        notes: newReminder.notes?.toUpperCase() || '',
        active: true
      };
      setReminders([reminder, ...reminders]);
      setShowAddModal(false);
      setNewReminder({ examName: '', frequencyMonths: 6, lastDate: new Date().toISOString().split('T')[0], active: true });
    }
  };

  const handleDeleteReminder = (id: string) => {
    if (window.confirm('Excluir este lembrete?')) {
      setReminders(reminders.filter(r => r.id !== id));
    }
  };

  const handleMarkAsDone = (reminder: Reminder) => {
    const today = new Date().toISOString().split('T')[0];
    const nextDate = calculateNextDate(today, reminder.frequencyMonths);
    const updated = {
      ...reminder,
      lastDate: today,
      nextDate: nextDate
    };
    setReminders(reminders.map(r => r.id === reminder.id ? updated : r));
  };

  const getStatus = (nextDate: string) => {
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Vencido', color: 'text-rose-600', bg: 'bg-rose-50', icon: <AlertTriangle className="w-4 h-4" /> };
    if (diffDays <= 30) return { label: 'Em breve', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="w-4 h-4" /> };
    return { label: 'Em dia', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4" /> };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Lembretes de Exames</h2>
          <p className="text-slate-500">Agende e monitore suas rotinas de check-up</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-widest text-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Lembrete
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest">Você ainda não tem lembretes ativos.</p>
            <p className="text-slate-400 text-sm mt-2">Crie um lembrete para ser notificado sobre seus próximos exames.</p>
          </div>
        ) : (
          reminders.map(reminder => {
            const status = getStatus(reminder.nextDate);
            return (
              <div key={reminder.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group">
                <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl font-black text-[9px] uppercase tracking-widest ${status.bg} ${status.color} flex items-center gap-1.5`}>
                  {status.icon}
                  {status.label}
                </div>

                <div className="mb-6">
                   <h3 className="text-xl font-black text-slate-800 uppercase truncate pr-20">{reminder.examName}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                      <RotateCcw className="w-3 h-3" /> Repete a cada {reminder.frequencyMonths} meses
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Coleta</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(reminder.lastDate).toLocaleDateString('pt-BR')}</p>
                   </div>
                   <div className={`${status.bg} p-3 rounded-2xl border border-transparent`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${status.color} opacity-70`}>Próxima Coleta</p>
                      <p className={`text-xs font-black ${status.color}`}>{new Date(reminder.nextDate).toLocaleDateString('pt-BR')}</p>
                   </div>
                </div>

                {reminder.notes && (
                  <div className="mb-6 p-3 bg-blue-50/30 rounded-2xl border border-blue-100/30">
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Observações</p>
                     <p className="text-[10px] font-bold text-slate-600 line-clamp-2 uppercase italic">{reminder.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                   <button 
                      onClick={() => handleMarkAsDone(reminder)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                   >
                      <CheckCircle2 className="w-4 h-4" /> Marcar Realizado
                   </button>
                   <button 
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-3 border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h3 className="text-xl font-bold uppercase tracking-tight">Novo Lembrete</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddReminder} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Qual exame deseja agendar?</label>
                <div className="relative">
                   <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-300" />
                   <input 
                      type="text" 
                      required 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" 
                      list="examSuggestions"
                      value={newReminder.examName} 
                      onChange={(e) => setNewReminder({...newReminder, examName: e.target.value.toUpperCase()})}
                      placeholder="EX: HEMOGRAMA, GLICOSE..."
                   />
                   <datalist id="examSuggestions">
                      {uniqueExamNames.map(name => <option key={name} value={name} />)}
                   </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Frequência</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    value={newReminder.frequencyMonths}
                    onChange={(e) => setNewReminder({...newReminder, frequencyMonths: parseInt(e.target.value)})}
                  >
                    <option value={1}>Mensal</option>
                    <option value={3}>Trimestral</option>
                    <option value={6}>Semestral</option>
                    <option value={12}>Anual</option>
                    <option value={24}>A cada 2 anos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Última Realização</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                    value={newReminder.lastDate} 
                    onChange={(e) => setNewReminder({...newReminder, lastDate: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observações (Opcional)</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none font-bold uppercase"
                  placeholder="EX: EM JEJUM DE 12H..."
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder({...newReminder, notes: e.target.value.toUpperCase()})}
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Salvar Lembrete
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
