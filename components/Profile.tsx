
import React, { useState } from 'react';
import { User } from '../types';
import { UserRound, Mail, Calendar, Info, Edit3, Save, Camera, Droplets, Pill } from 'lucide-react';

interface ProfileProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedUser({ ...editedUser, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setUser(editedUser);
    localStorage.setItem('lifeTrace_user', JSON.stringify(editedUser));
    
    // Também atualiza o registro de conta local se existir
    const savedAccount = localStorage.getItem('lifeTrace_user_account');
    if (savedAccount) {
      const accountData = JSON.parse(savedAccount);
      localStorage.setItem('lifeTrace_user_account', JSON.stringify({ ...accountData, ...editedUser }));
    }
    
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Meu Cadastro</h2>
          <p className="text-slate-500">Informações pessoais e de saúde</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
            isEditing ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isEditing ? <><Save className="w-5 h-5" /> Salvar</> : <><Edit3 className="w-5 h-5" /> Editar</>}
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          {/* Cover photo effect */}
        </div>
        <div className="px-8 pb-8 -mt-16">
            <div className="relative inline-block mb-6">
                <div className="bg-white p-2 rounded-full shadow-xl">
                    <div className="bg-slate-50 w-32 h-32 rounded-full flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden">
                        {(isEditing ? editedUser.photoUrl : user.photoUrl) ? (
                          <img src={isEditing ? editedUser.photoUrl : user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserRound className="w-16 h-16" />
                        )}
                    </div>
                </div>
                {isEditing && (
                  <label className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-lg border-2 border-white">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            <UserRound className="w-3 h-3" /> Nome Completo
                        </label>
                        {isEditing ? (
                            <input 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                                value={editedUser.name}
                                onChange={(e) => setEditedUser({...editedUser, name: e.target.value.toUpperCase()})}
                            />
                        ) : (
                            <p className="text-lg font-bold text-slate-800">{user.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                <Calendar className="w-3 h-3" /> Nascimento
                            </label>
                            {isEditing ? (
                                <input 
                                    type="date"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editedUser.birthDate}
                                    onChange={(e) => setEditedUser({...editedUser, birthDate: e.target.value})}
                                />
                            ) : (
                                <p className="text-slate-600 font-medium">{new Date(user.birthDate).toLocaleDateString('pt-BR')}</p>
                            )}
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                <Droplets className="w-3 h-3 text-rose-500" /> Tipo Sanguíneo
                            </label>
                            {isEditing ? (
                                <select 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    value={editedUser.bloodType}
                                    onChange={(e) => setEditedUser({...editedUser, bloodType: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            ) : (
                                <p className="text-rose-600 font-black text-xl">{user.bloodType || '--'}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            <Mail className="w-3 h-3" /> E-mail (editável)
                        </label>
                        {isEditing ? (
                            <input 
                                type="email"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium lowercase"
                                value={editedUser.email}
                                onChange={(e) => setEditedUser({...editedUser, email: e.target.value.toLowerCase()})}
                            />
                        ) : (
                            <p className="text-slate-600 font-medium">{user.email}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            <Info className="w-3 h-3 text-blue-500" /> Doenças Preexistentes
                        </label>
                        {isEditing ? (
                            <textarea 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none font-bold uppercase"
                                value={editedUser.preExistingConditions}
                                onChange={(e) => setEditedUser({...editedUser, preExistingConditions: e.target.value.toUpperCase()})}
                            />
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[80px]">
                                <p className="text-slate-700 text-xs italic uppercase font-bold">
                                    {user.preExistingConditions || 'Nenhuma informação cadastrada.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            <Pill className="w-3 h-3 text-emerald-500" /> Medicamentos de Uso Contínuo
                        </label>
                        {isEditing ? (
                            <textarea 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none font-bold uppercase"
                                value={editedUser.continuousMedications || ''}
                                onChange={(e) => setEditedUser({...editedUser, continuousMedications: e.target.value.toUpperCase()})}
                            />
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[80px]">
                                <p className="text-slate-700 text-xs italic uppercase font-bold">
                                    {user.continuousMedications || 'Nenhum medicamento informado.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Acesso à Plataforma</h4>
                        <div className="text-sm text-blue-700">
                            Usuário: <span className="font-bold">{user.username}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
