
import React, { useState, useEffect } from 'react';
import { AppScreen, User, ExamRecord, Doctor, Laboratory, Appointment, ImagingExam } from './types';
import { loadData, saveData } from './services/storageService';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Exams from './components/Exams';
import ImagingExams from './components/ImagingExams';
import Doctors from './components/Doctors';
import Laboratories from './components/Laboratories';
import Reports from './components/Reports';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import Agenda from './components/Agenda';
import { Microscope, Menu, X, User as UserIcon, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [imagingExams, setImagingExams] = useState<ImagingExam[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregamento inicial via IndexedDB (Sem limites de 5MB)
  useEffect(() => {
    const initApp = async () => {
      try {
        const [u, e, i, d, l, a] = await Promise.all([
          loadData('user'),
          loadData('exams'),
          loadData('imagingExams'),
          loadData('doctors'),
          loadData('laboratories'),
          loadData('appointments')
        ]);

        if (u) {
          setCurrentUser(u);
          setCurrentScreen(AppScreen.DASHBOARD);
        }
        if (e) setExams(e);
        if (i) setImagingExams(i);
        if (d) setDoctors(d);
        if (l) setLaboratories(l);
        if (a) setAppointments(a);
      } catch (err) {
        console.error("Erro ao carregar banco de dados:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Persistência automática em background via IndexedDB
  useEffect(() => {
    if (!isLoading) {
      saveData('exams', exams);
      saveData('imagingExams', imagingExams);
      saveData('doctors', doctors);
      saveData('laboratories', laboratories);
      saveData('appointments', appointments);
      if (currentUser) saveData('user', currentUser);
    }
  }, [exams, imagingExams, doctors, laboratories, appointments, currentUser, isLoading]);

  const handleLogout = () => {
    saveData('user', null);
    setCurrentUser(null);
    setCurrentScreen(AppScreen.LOGIN);
    setIsMobileMenuOpen(false);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    saveData('user', user);
    setCurrentScreen(AppScreen.DASHBOARD);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="font-black text-blue-600 uppercase tracking-widest text-xs">Iniciando Banco de Dados...</p>
      </div>
    );
  }

  if (!currentUser) {
    switch (currentScreen) {
      case AppScreen.REGISTER:
        return <Register onRegister={handleLogin} onBack={() => setCurrentScreen(AppScreen.LOGIN)} />;
      case AppScreen.FORGOT_PASSWORD:
        return <ForgotPassword onBack={() => setCurrentScreen(AppScreen.LOGIN)} />;
      default:
        return <Login onLogin={handleLogin} onRegister={() => setCurrentScreen(AppScreen.REGISTER)} onForgot={() => setCurrentScreen(AppScreen.FORGOT_PASSWORD)} />;
    }
  }

  const commonProps = {
    exams,
    setExams,
    imagingExams,
    setImagingExams,
    doctors,
    setDoctors,
    laboratories,
    setLaboratories,
    appointments,
    setAppointments,
    user: currentUser
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-blue-600 text-white shadow-lg z-30 sticky top-0 print:hidden">
        <div className="px-4 py-3 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 hover:bg-white/10 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
            <div className="flex items-center gap-2">
              <Microscope className="w-8 h-8" />
              <h1 className="text-xl font-bold tracking-tight uppercase">Meus exames</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-black uppercase">{currentUser.name}</p>
              <p className="text-xs text-blue-100 opacity-80">{currentUser.email}</p>
            </div>
            <button 
              onClick={() => setCurrentScreen(AppScreen.PROFILE)}
              className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center hover:scale-105 transition-transform"
            >
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform fixed md:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 print:hidden`}>
          <Sidebar 
            currentScreen={currentScreen} 
            setScreen={(s) => { setCurrentScreen(s); setIsMobileMenuOpen(false); }} 
            onLogout={handleLogout} 
          />
        </div>

        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-10 md:hidden print:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {currentScreen === AppScreen.DASHBOARD && <Dashboard {...commonProps} />}
            {currentScreen === AppScreen.EXAMS && <Exams {...commonProps} />}
            {currentScreen === AppScreen.IMAGING_EXAMS && <ImagingExams {...commonProps} />}
            {currentScreen === AppScreen.DOCTORS && <Doctors {...commonProps} />}
            {currentScreen === AppScreen.LABORATORIES && <Laboratories {...commonProps} />}
            {currentScreen === AppScreen.REPORTS && <Reports exams={exams} doctors={doctors} laboratories={laboratories} />}
            {currentScreen === AppScreen.ANALYTICS && <Analytics {...commonProps} />}
            {currentScreen === AppScreen.AGENDA && <Agenda {...commonProps} />}
            {currentScreen === AppScreen.PROFILE && <Profile user={currentUser} setUser={setCurrentUser} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
