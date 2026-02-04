
import React from 'react';
import { AppScreen } from '../types';
import { 
  LayoutDashboard, 
  UserRound, 
  Stethoscope, 
  BarChart3, 
  ClipboardList,
  LogOut,
  Microscope,
  Landmark,
  CalendarCheck,
  Image as ImageIcon
} from 'lucide-react';

interface SidebarProps {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, setScreen, onLogout }) => {
  const menuItems = [
    { screen: AppScreen.DASHBOARD, label: 'Painel', icon: <LayoutDashboard className="w-5 h-5" /> },
    { screen: AppScreen.AGENDA, label: 'Agenda', icon: <CalendarCheck className="w-5 h-5" /> },
    { screen: AppScreen.EXAMS, label: 'Exames Lab', icon: <Microscope className="w-5 h-5" /> },
    { screen: AppScreen.IMAGING_EXAMS, label: 'Exames Imagem', icon: <ImageIcon className="w-5 h-5" /> },
    { screen: AppScreen.DOCTORS, label: 'Médicos', icon: <Stethoscope className="w-5 h-5" /> },
    { screen: AppScreen.LABORATORIES, label: 'Laboratórios', icon: <Landmark className="w-5 h-5" /> },
    { screen: AppScreen.ANALYTICS, label: 'Análise Evolutiva', icon: <BarChart3 className="w-5 h-5" /> },
    { screen: AppScreen.REPORTS, label: 'Relatórios', icon: <ClipboardList className="w-5 h-5" /> },
    { screen: AppScreen.PROFILE, label: 'Meu Cadastro', icon: <UserRound className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 md:hidden">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <Microscope className="w-8 h-8" />
          Meus exames
        </h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.screen}
            onClick={() => setScreen(item.screen)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
              currentScreen === item.screen
                ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
