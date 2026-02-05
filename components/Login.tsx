
import React, { useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, Lock, User as UserIcon, Microscope } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: () => void;
  onForgot: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onForgot }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedAccount = localStorage.getItem('lifeTrace_user_account');
    
    if (savedAccount) {
        const account = JSON.parse(savedAccount);
        if (account.username.toUpperCase() === username.toUpperCase()) {
            onLogin(account);
            return;
        }
    }
    
    // Fallback para login simples/demo
    onLogin({
      id: '1',
      name: username.toUpperCase() || 'USUÁRIO',
      email: `${username.toLowerCase() || 'usuario'}@saude.com`,
      birthDate: '1990-01-01',
      preExistingConditions: 'NÃO INFORMADA',
      bloodType: '--',
      username: username || 'admin'
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-100 p-10 md:p-14">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-white shadow-xl rotate-3">
            <Microscope className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Entrar</h2>
          <p className="text-slate-400 mt-2 font-black uppercase tracking-widest text-[10px]">Acesse seu histórico de saúde</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold uppercase text-xs"
                placeholder="NOME DE USUÁRIO"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-14 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 px-4 rounded-3xl transition-all transform active:scale-95 shadow-2xl shadow-blue-100 uppercase tracking-[0.2em] text-xs"
          >
            Acessar Painel
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center space-y-4">
           <button onClick={onForgot} className="text-slate-400 hover:text-blue-600 font-black uppercase text-[9px] tracking-[0.3em] block w-full">Recuperar Minha Senha</button>
           <button onClick={onRegister} className="text-blue-600 font-black hover:underline uppercase text-[9px] tracking-[0.3em] block w-full">Criar Novo Cadastro</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
