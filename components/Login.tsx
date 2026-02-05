
import React, { useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, Lock, User as UserIcon, Microscope, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: () => void;
  onForgot: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onForgot }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedAccountStr = localStorage.getItem('lifeTrace_user_account');
    
    if (!savedAccountStr) {
      setError('Nenhum usuário cadastrado neste dispositivo. Por favor, crie uma conta.');
      return;
    }

    try {
      const account = JSON.parse(savedAccountStr);
      
      const inputUser = username.trim().toUpperCase();
      const storedUser = account.username.trim().toUpperCase();
      
      if (inputUser === storedUser && password === account.password) {
        // Remove a senha do objeto antes de passar para o estado global por segurança
        const { password: _, ...userWithoutPassword } = account;
        onLogin(userWithoutPassword as User);
      } else {
        setError('Usuário ou senha inválidos. Verifique suas credenciais.');
      }
    } catch (err) {
      console.error("Erro ao validar login:", err);
      setError('Ocorreu um erro ao processar o login. Tente novamente.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-100 p-10 md:p-14">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-white shadow-xl rotate-3">
            <Microscope className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Entrar</h2>
          <p className="text-slate-400 mt-2 font-black uppercase tracking-widest text-[10px]">Acesso Restrito a Usuários Cadastrados</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight leading-tight">{error}</p>
          </div>
        )}

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
                placeholder="SEU NOME DE USUÁRIO"
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
