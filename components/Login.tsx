
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
    const savedUser = localStorage.getItem('lifeTrace_user_account');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.username === username) {
            onLogin(user);
            return;
        }
    }
    
    onLogin({
      id: '1',
      name: 'Usuário Demo',
      email: 'demo@email.com',
      birthDate: '1990-01-01',
      preExistingConditions: 'Nenhuma',
      bloodType: 'O+',
      username: username || 'demo'
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-xl overflow-hidden border border-slate-100 p-8 md:p-12">
        <div className="text-center mb-10">
          <div className="bg-blue-100 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
            <Microscope className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Meus exames</h2>
          <p className="text-slate-400 mt-2 font-medium">Sua saúde sob controle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                placeholder="Seu nome de usuário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-slate-500" /> : <Eye className="w-5 h-5 text-slate-500" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-slate-500 font-medium">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
              Lembrar
            </label>
            <button type="button" onClick={onForgot} className="text-blue-600 hover:text-blue-700 font-bold">
              Recuperar senha
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-xl shadow-blue-200 uppercase tracking-widest text-sm"
          >
            Entrar no Painel
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 font-medium">
            Não possui cadastro?{' '}
            <button onClick={onRegister} className="text-blue-600 font-black hover:underline ml-1">
              Criar Conta Grátis
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
