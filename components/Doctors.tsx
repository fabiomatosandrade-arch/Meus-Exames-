
import React, { useState, useMemo } from 'react';
import { Doctor } from '../types';
import { Plus, Trash2, User as DocIcon, Award, X, Save, Phone, Edit3, Eye, Stethoscope, MapPin, ChevronRight, MoreHorizontal } from 'lucide-react';

interface DoctorsProps {
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
}

const Doctors: React.FC<DoctorsProps> = ({ doctors, setDoctors }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [actionMenuDoctorId, setActionMenuDoctorId] = useState<string | null>(null);
  
  const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
    name: '',
    specialty: '',
    crm: '',
    phone: '',
    address: ''
  });

  // Lógica aprimorada para unificar médicos duplicados pelo nome (case-insensitive)
  const unifiedDoctors = useMemo(() => {
    const map = new Map<string, Doctor>();
    doctors.forEach(doc => {
      const normalized = doc.name.trim().toUpperCase();
      const existing = map.get(normalized);
      
      // Se já existe, mantemos o que tiver mais informações (CRM ou Endereço)
      if (!existing || (doc.crm && !existing.crm) || (doc.address && !existing.address)) {
        map.set(normalized, doc);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [doctors]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDoctor.name && newDoctor.specialty) {
        setDoctors([...doctors, { 
          ...newDoctor, 
          id: Date.now().toString(), 
          name: newDoctor.name.toUpperCase().trim(), 
          specialty: newDoctor.specialty.toUpperCase().trim(), 
          crm: (newDoctor.crm || '').toUpperCase().trim(),
          address: (newDoctor.address || '').toUpperCase().trim()
        } as Doctor]);
        setShowAddModal(false);
        setNewDoctor({ name: '', specialty: '', crm: '', phone: '', address: '' });
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewingDoctor) {
      const updated = {
        ...viewingDoctor,
        name: viewingDoctor.name.toUpperCase().trim(),
        specialty: viewingDoctor.specialty.toUpperCase().trim(),
        crm: (viewingDoctor.crm || '').toUpperCase().trim(),
        address: (viewingDoctor.address || '').toUpperCase().trim()
      };
      setDoctors(doctors.map(d => d.id === viewingDoctor.id ? updated : d));
      setIsEditing(false);
      setViewingDoctor(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja remover este médico permanentemente?')) {
      setDoctors(doctors.filter(d => d.id !== id));
      setViewingDoctor(null);
      setActionMenuDoctorId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Meus Médicos</h2>
          <p className="text-slate-500">Lista unificada de profissionais cadastrados</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5" /> Cadastrar Médico
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {unifiedDoctors.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-[40px] border border-dashed border-slate-300">
            <DocIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum médico cadastrado.</p>
          </div>
        ) : (
          unifiedDoctors.map(doc => (
            <div 
              key={doc.id} 
              className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center text-center relative group transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              onClick={() => setActionMenuDoctorId(actionMenuDoctorId === doc.id ? null : doc.id)}
            >
                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center text-blue-600 mb-6 ring-8 ring-blue-50 group-hover:scale-95 transition-transform">
                    <DocIcon className="w-8 h-8" />
                </div>
                
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">{doc.name}</h3>
                <div className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                    <Award className="w-3.5 h-3.5" />
                    {doc.specialty}
                </div>

                {doc.address && (
                  <div className="text-[9px] text-slate-400 font-black uppercase flex items-center gap-1 mt-1 truncate w-full justify-center px-4 leading-relaxed">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {doc.address}
                  </div>
                )}

                {/* Menu de Ações Gerado ao Clicar */}
                {actionMenuDoctorId === doc.id && (
                  <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm rounded-[40px] p-6 flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                     <button 
                        onClick={() => { setViewingDoctor(doc); setIsEditing(false); setActionMenuDoctorId(null); }}
                        className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-colors"
                     >
                        <Eye className="w-4 h-4" /> Visualizar
                     </button>
                     <button 
                        onClick={() => { setViewingDoctor(doc); setIsEditing(true); setActionMenuDoctorId(null); }}
                        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-colors"
                     >
                        <Edit3 className="w-4 h-4" /> Editar
                     </button>
                     <button 
                        onClick={() => setActionMenuDoctorId(null)}
                        className="text-white/50 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] mt-2"
                     >
                        Fechar
                     </button>
                  </div>
                )}
            </div>
          ))
        )}
      </div>

      {viewingDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-blue-600 h-24 relative">
                <button onClick={() => setViewingDoctor(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-lg">
                   <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center text-blue-600">
                      <DocIcon className="w-10 h-10" />
                   </div>
                </div>
             </div>
             
             <div className="pt-14 pb-10 px-10">
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs" value={viewingDoctor.name} onChange={(e) => setViewingDoctor({...viewingDoctor, name: e.target.value.toUpperCase()})} />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Especialidade</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs" value={viewingDoctor.specialty} onChange={(e) => setViewingDoctor({...viewingDoctor, specialty: e.target.value.toUpperCase()})} />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Endereço</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs" value={viewingDoctor.address || ''} onChange={(e) => setViewingDoctor({...viewingDoctor, address: e.target.value.toUpperCase()})} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CRM</label>
                           <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none uppercase text-xs font-black" value={viewingDoctor.crm || ''} onChange={(e) => setViewingDoctor({...viewingDoctor, crm: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Contato</label>
                           <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-black" value={viewingDoctor.phone || ''} onChange={(e) => setViewingDoctor({...viewingDoctor, phone: e.target.value})} />
                        </div>
                     </div>
                     <div className="flex gap-2 pt-4">
                        <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                           <Save className="w-4 h-4" /> Salvar
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-4 border border-slate-200 text-slate-400 font-black rounded-2xl hover:bg-slate-50 uppercase text-[10px] tracking-widest">
                           Sair
                        </button>
                     </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight leading-tight">{viewingDoctor.name}</h3>
                    <div className="inline-flex items-center gap-2 text-blue-600 font-black text-[10px] bg-blue-50 px-5 py-2 rounded-full mb-8 uppercase tracking-[0.2em]">
                       <Award className="w-4 h-4" /> {viewingDoctor.specialty}
                    </div>
                    
                    <div className="space-y-6 text-left border-t border-slate-50 pt-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                             <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Localização</p>
                            <p className="text-xs font-black text-slate-700 uppercase leading-relaxed">{viewingDoctor.address || 'Não cadastrado'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                             <Stethoscope className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Registro Profissional</p>
                            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{viewingDoctor.crm || 'NÃO INFORMADO'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                             <Phone className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Telefone / WhatsApp</p>
                            <p className="text-xs font-black text-slate-700">{viewingDoctor.phone || 'NÃO INFORMADO'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                       <button 
                          onClick={() => setIsEditing(true)}
                          className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                       >
                          <Edit3 className="w-5 h-5" /> Editar
                       </button>
                       <button 
                          onClick={() => handleDelete(viewingDoctor.id)}
                          className="px-5 py-4 border border-rose-100 text-rose-500 rounded-2xl hover:bg-rose-50 transition-all"
                          title="Excluir Médico"
                       >
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                    <h3 className="text-xl font-black uppercase tracking-tight">Novo Médico</h3>
                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-10 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                        <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs" value={newDoctor.name} onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Especialidade</label>
                        <input type="text" required placeholder="EX: CARDIOLOGIA" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs" value={newDoctor.specialty} onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Endereço da Clínica</label>
                        <input type="text" placeholder="RUA, NÚMERO, BAIRRO..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs" value={newDoctor.address} onChange={(e) => setNewDoctor({...newDoctor, address: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">CRM</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black uppercase text-xs" value={newDoctor.crm} onChange={(e) => setNewDoctor({...newDoctor, crm: e.target.value.toUpperCase()})} /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Telefone</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-black" value={newDoctor.phone} onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})} /></div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl mt-6 uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"><Save className="w-6 h-6" /> Salvar Cadastro</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
