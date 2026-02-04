
import React, { useState } from 'react';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setIsSent(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        {!isSent ? (
          <>
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Recuperar Senha</h2>
            <p className="text-slate-500 mb-8">
              Insira o e-mail cadastrado. Enviaremos um link para você redefinir sua senha com segurança.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="Seu e-mail cadastrado"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Enviar Link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 ring-8 ring-green-50">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">E-mail Enviado!</h2>
            <p className="text-slate-600 mb-8">
              Confira sua caixa de entrada (e a pasta de spam) para o e-mail de recuperação.
            </p>
            <button
              onClick={onBack}
              className="w-full border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
