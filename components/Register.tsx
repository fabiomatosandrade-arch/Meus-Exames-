
import React, { useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, ArrowLeft, ShieldAlert, Camera, User as UserIcon, Mail, Lock, Pill } from 'lucide-react';

interface RegisterProps {
  onRegister: (user: User) => void;
  onBack: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    email: '',
    emailConfirm: '',
    conditions: '',
    medications: '',
    username: '',
    bloodType: '',
    password: '',
    passwordConfirm: '',
    photoUrl: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email.toLowerCase() !== formData.emailConfirm.toLowerCase()) {
      setError('Os endereços de e-mail digitados são diferentes. Por favor, verifique.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('As senhas digitadas não são iguais. Por favor, corrija para prosseguir.');
      return;
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name.toUpperCase(),
      birthDate: formData.birthDate,
      email: formData.email.toLowerCase(),
      preExistingConditions: formData.conditions.toUpperCase(),
      continuousMedications: formData.medications.toUpperCase(),
      username: formData.username.toUpperCase(),
      bloodType: formData.bloodType,
      photoUrl: formData.photoUrl
    };

    localStorage.setItem('lifeTrace_user_account', JSON.stringify({ ...newUser, password: formData.password }));
    onRegister(newUser);
  };

  const handleInputChange = (field: string, value: string, uppercase = false) => {
    setFormData({ ...formData, [field]: uppercase ? value.toUpperCase() : value });
    if (error) setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors font-bold uppercase text-[10px] tracking-widest">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </button>

        <h2 className="text-2xl font-black text-slate-800 mb-6 text-center uppercase tracking-tight text-blue-600">Crie sua conta</h2>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-4 animate-in fade-in zoom-in duration-300">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <span className="text-xs font-black uppercase tracking-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>
            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Foto do Usuário</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
              <input
                type="text"
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value, true)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data de Nascimento</label>
              <input
                type="date"
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo Sanguíneo</label>
              <select
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                value={formData.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
              >
                <option value="">Selecione...</option>
                {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="col-span-2 bg-blue-50/50 p-6 rounded-[24px] border border-blue-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> E-mail</label>
                  <input
                    type="email"
                    required
                    className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-medium lowercase"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Repetir E-mail</label>
                  <input
                    type="email"
                    required
                    className={`w-full p-3 bg-white border rounded-xl outline-none focus:ring-2 font-medium lowercase ${formData.emailConfirm && formData.email !== formData.emailConfirm ? 'border-rose-300 focus:ring-rose-400' : 'border-blue-200 focus:ring-blue-400'}`}
                    value={formData.emailConfirm}
                    onChange={(e) => handleInputChange('emailConfirm', e.target.value.toLowerCase())}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">Nome de Usuário (Login)</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-bold uppercase"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value, true)}
                />
              </div>
            </div>

            <div className="col-span-2 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Doenças Preexistentes</label>
                <textarea
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none font-bold uppercase"
                  placeholder="EX: HIPERTENSÃO, DIABETES..."
                  value={formData.conditions}
                  onChange={(e) => handleInputChange('conditions', e.target.value, true)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Pill className="w-3.5 h-3.5 text-blue-500" /> Medicamentos de Uso Contínuo</label>
                <textarea
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none font-bold uppercase"
                  placeholder="EX: LOSARTANA 50MG, METFORMINA..."
                  value={formData.medications}
                  onChange={(e) => handleInputChange('medications', e.target.value, true)}
                />
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 p-1 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-slate-500" /> : <Eye className="w-5 h-5 text-slate-500" />}
                </button>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Repetir Senha</label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  required
                  className={`w-full p-3.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 pr-12 ${formData.passwordConfirm && formData.password !== formData.passwordConfirm ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'}`}
                  value={formData.passwordConfirm}
                  onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-3.5 p-1 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {showPasswordConfirm ? <EyeOff className="w-5 h-5 text-slate-500" /> : <Eye className="w-5 h-5 text-slate-500" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-transform active:scale-[0.99] uppercase tracking-widest text-sm"
            >
              Finalizar Cadastro de Saúde
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
