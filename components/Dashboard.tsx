
import React, { useMemo } from 'react';
import { User, ExamRecord, Doctor, Laboratory, Appointment } from '../types';
import { getHealthStatus } from './Exams';
import { Microscope, Stethoscope, Activity, Calendar, ArrowRight, TrendingUp, AlertCircle, Heart, Landmark, Bell, CheckCircle2, Clock, CalendarCheck, ChevronRight, MapPin } from 'lucide-react';

interface DashboardProps {
  user: User;
  exams: ExamRecord[];
  doctors: Doctor[];
  laboratories: Laboratory[];
  appointments: Appointment[];
}

const statusDotColors: Record<string, string> = {
  success: 'bg-emerald-500', 
  warning: 'bg-amber-500', 
  danger: 'bg-rose-500', 
  neutral: 'bg-slate-300'
};

const Dashboard: React.FC<DashboardProps> = ({ user, exams, doctors, laboratories, appointments }) => {
  const latestExams = exams.slice(0, 3);
  
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    return [...appointments]
      .filter(a => new Date(`${a.date}T${a.time}`) >= today)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
      .slice(0, 6);
  }, [appointments]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3 h-3" /> Bem-vindo de volta
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
            Olá, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-slate-500 text-lg max-w-md">
            Sua saúde sob controle. Confira abaixo suas próximas datas agendadas.
          </p>
        </div>

        <div className="hidden lg:block w-full max-w-xs">
          <div className="bg-blue-600 p-6 rounded-[32px] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-400 w-2.5 h-2.5 rounded-full shadow-sm shadow-emerald-400"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-50">Perfil de Saúde</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-100">Tipo Sanguíneo</span>
                <span className="text-xl font-black">{user.bloodType || 'N/A'}</span>
              </div>
              <p className="text-[11px] text-blue-100 leading-relaxed italic opacity-80">
                {user.preExistingConditions ? `Condições: ${user.preExistingConditions}` : "Nenhuma condição preexistente informada."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              Cronograma da Agenda
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => (
              <div key={app.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all hover:shadow-md group">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-colors shadow-inner ${app.type === 'CONSULTA' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                    <span className="text-[10px] font-black leading-none mb-1">{new Date(app.date).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-xl font-black leading-none">{new Date(app.date).getUTCDate()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${app.type === 'CONSULTA' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {app.type}
                       </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg uppercase leading-tight">{app.title}</h4>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3" /> {app.time} • <MapPin className="w-3 h-3" /> {app.location}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200" />
              </div>
            )) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-400 font-medium italic uppercase tracking-widest text-xs">Nenhum agendamento futuro na sua agenda.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Activity className="w-5 h-5 text-blue-600" />
              Últimos Resultados
            </h3>
            
            <div className="space-y-4">
              {latestExams.length > 0 ? latestExams.map(exam => {
                const status = getHealthStatus(exam.value, exam.referenceRange);
                return (
                  <div key={exam.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 truncate pr-4">
                         <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotColors[status]}`}></div>
                         <span className="text-xs font-black text-slate-800 uppercase truncate">{exam.examName}</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 flex-shrink-0">{exam.value}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-4">
                      {new Date(exam.date).toLocaleDateString('pt-BR')} • {exam.laboratory}
                    </p>
                  </div>
                );
              }) : (
                <p className="text-xs text-slate-400 italic">Nenhum exame cadastrado.</p>
              )}
            </div>

            <button className="w-full mt-6 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 py-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              Ver Histórico Completo <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-black mb-4 uppercase tracking-tight">Dica de Saúde</h3>
            <p className="text-indigo-100 text-xs leading-relaxed italic">
              "A manutenção de um histórico regular ajuda médicos a identificarem padrões e prevenirem doenças antes mesmo dos primeiros sintomas."
            </p>
            <TrendingUp className="absolute bottom-4 right-4 w-12 h-12 text-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
