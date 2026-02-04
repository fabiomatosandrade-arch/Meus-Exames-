
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Appointment, Doctor, Laboratory } from '../types';
import { 
  CalendarCheck, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Clock, 
  MapPin, 
  Stethoscope, 
  Landmark, 
  AlertCircle,
  Bell,
  BellRing,
  ChevronRight,
  Filter,
  User as UserIcon,
  Navigation,
  Map as MapIcon,
  Volume2,
  VolumeX,
  Calendar as CalendarIcon
} from 'lucide-react';

interface AgendaProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  doctors: Doctor[];
  laboratories: Laboratory[];
}

const Agenda: React.FC<AgendaProps> = ({ appointments, setAppointments, doctors, laboratories }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'CONSULTA' | 'EXAME'>('ALL');
  const [activeNavMenu, setActiveNavMenu] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const [newApp, setNewApp] = useState<Partial<Appointment>>({
    title: '',
    type: 'CONSULTA',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    location: '',
    address: '',
    notes: '',
    notified: false
  });

  // Função para tocar o alarme sonoro
  const playAlarmSound = () => {
    if (!isSoundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.error("Erro ao reproduzir som:", e);
    }
  };

  // Monitor de Alarme
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentDay = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      appointments.forEach(app => {
        if (app.date === currentDay && app.time === currentTime && lastNotifiedId !== app.id) {
          playAlarmSound();
          setLastNotifiedId(app.id);
        }
      });
    }, 5000); 

    return () => clearInterval(timer);
  }, [appointments, lastNotifiedId, isSoundEnabled]);

  const sortedAppointments = useMemo(() => {
    return [...appointments]
      .filter(app => filterType === 'ALL' || app.type === filterType)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [appointments, filterType]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newApp.title && newApp.date && newApp.time) {
      const app: Appointment = {
        id: Date.now().toString(),
        title: newApp.title.toUpperCase(),
        type: newApp.type as 'CONSULTA' | 'EXAME',
        date: newApp.date,
        time: newApp.time,
        location: newApp.location?.toUpperCase() || 'NÃO INFORMADO',
        address: newApp.address?.toUpperCase() || '',
        notes: newApp.notes?.toUpperCase() || '',
        notified: false
      };
      setAppointments([app, ...appointments]);
      setShowAddModal(false);
      setNewApp({ 
        title: '', 
        type: 'CONSULTA', 
        date: new Date().toISOString().split('T')[0], 
        time: '08:00', 
        location: '', 
        address: '', 
        notes: '' 
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este agendamento?')) {
      setAppointments(appointments.filter(a => a.id !== id));
    }
  };

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  const isHappeningNow = (date: string, time: string) => {
    const now = new Date();
    const currentDay = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    return date === currentDay && time === currentTime;
  };

  // Integração com Google Agenda
  const addToGoogleCalendar = (app: Appointment) => {
    const startDateTime = new Date(`${app.date}T${app.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const title = encodeURIComponent(`[SAÚDE] ${app.title}`);
    const details = encodeURIComponent(`${app.notes}\n\nLocal: ${app.location}`);
    const location = encodeURIComponent(app.address || app.location);
    const dates = `${fmt(startDateTime)}/${fmt(endDateTime)}`;
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
    
    window.open(url, '_blank');
  };

  const openNavigation = (address: string, provider: 'google' | 'waze') => {
    const encodedAddress = encodeURIComponent(address);
    let url = provider === 'google' 
      ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      : `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
    window.open(url, '_blank');
    setActiveNavMenu(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Agenda de Saúde</h2>
          <p className="text-slate-500">Sincronize seus exames e receba alertas sonoros</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
                setIsSoundEnabled(!isSoundEnabled);
                if(!isSoundEnabled) playAlarmSound(); // Teste de som ao ativar
            }}
            className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase ${isSoundEnabled ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSoundEnabled ? "Som Ativo" : "Mudo"}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg transition-all transform active:scale-95 uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" /> Agendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {sortedAppointments.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-300">
              <CalendarCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sem compromissos agendados.</p>
            </div>
          ) : (
            sortedAppointments.map(app => {
              const happeningNow = isHappeningNow(app.date, app.time);
              return (
                <div key={app.id} className={`bg-white p-6 rounded-[32px] border transition-all flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md ${happeningNow ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-100 animate-pulse' : 'border-slate-100'}`}>
                   <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-colors ${happeningNow ? 'bg-amber-500 text-white' : isToday(app.date) ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                         <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(app.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                         <span className="text-xl font-black leading-none">{new Date(app.date).getUTCDate()}</span>
                      </div>
                      <div className="flex-1">
                         <h3 className="text-lg font-black text-slate-800 uppercase leading-tight">{app.title}</h3>
                         <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {app.time}</span>
                            <span className="flex items-center gap-1 truncate max-w-[150px]"><Landmark className="w-3.5 h-3.5" /> {app.location}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 justify-end">
                      <button 
                        onClick={() => addToGoogleCalendar(app)}
                        className="bg-white border border-slate-200 text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-sm"
                        title="Vincular ao Google Agenda"
                      >
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                        <span className="hidden xl:inline">Google</span>
                      </button>

                      {app.address && (
                        <div className="relative">
                          <button 
                            onClick={() => setActiveNavMenu(activeNavMenu === app.id ? null : app.id)}
                            className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-sm"
                          >
                            <Navigation className="w-4 h-4" />
                            <span className="hidden xl:inline">GPS</span>
                          </button>
                          
                          {activeNavMenu === app.id && (
                            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                               <button onClick={() => openNavigation(app.address!, 'google')} className="w-full p-3 text-left text-[10px] font-black text-slate-700 hover:bg-blue-50 flex items-center gap-2">
                                 <MapIcon className="w-4 h-4 text-emerald-500" /> Google
                               </button>
                               <button onClick={() => openNavigation(app.address!, 'waze')} className="w-full p-3 text-left text-[10px] font-black text-slate-700 hover:bg-blue-50 flex items-center gap-2">
                                 <div className="w-4 h-4 bg-blue-400 rounded-full text-[8px] flex items-center justify-center text-white">W</div> Waze
                               </button>
                            </div>
                          )}
                        </div>
                      )}
                      <button onClick={() => handleDelete(app.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 p-6 opacity-10">
                 <BellRing className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tight flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-400" /> Alarme Ativo
              </h3>
              <p className="text-slate-400 text-[10px] leading-relaxed mb-6 font-bold uppercase tracking-widest">
                O aplicativo emitirá um sinal sonoro no exato momento marcado. Certifique-se de que o volume está ativado.
              </p>
              <button 
                onClick={playAlarmSound}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4" /> Testar Som
              </button>
           </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h3 className="text-xl font-bold uppercase tracking-tight">Novo Agendamento</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   type="button" 
                   onClick={() => setNewApp({...newApp, type: 'CONSULTA'})}
                   className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${newApp.type === 'CONSULTA' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                 >
                    <Stethoscope className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">Consulta</span>
                 </button>
                 <button 
                   type="button" 
                   onClick={() => setNewApp({...newApp, type: 'EXAME'})}
                   className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${newApp.type === 'EXAME' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                 >
                    <Landmark className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">Exame</span>
                 </button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título do Agendamento</label>
                <input 
                  type="text" required 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" 
                  placeholder="EX: RETORNO CARDIOLOGISTA"
                  value={newApp.title}
                  onChange={(e) => setNewApp({...newApp, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data</label>
                    <input 
                      type="date" required 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                      value={newApp.date}
                      onChange={(e) => setNewApp({...newApp, date: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hora</label>
                    <input 
                      type="time" required 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                      value={newApp.time}
                      onChange={(e) => setNewApp({...newApp, time: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Local / Médico</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" 
                  placeholder="NOME DO LABORATÓRIO OU MÉDICO"
                  value={newApp.location}
                  onChange={(e) => setNewApp({...newApp, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Endereço Completo</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" 
                  placeholder="RUA, NÚMERO, BAIRRO"
                  value={newApp.address}
                  onChange={(e) => setNewApp({...newApp, address: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest">
                <Save className="w-5 h-5 inline mr-2" /> Salvar Agendamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
