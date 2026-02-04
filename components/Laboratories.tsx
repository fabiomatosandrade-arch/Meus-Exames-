
import React, { useState, useMemo } from 'react';
import { Laboratory } from '../types';
import { Plus, Trash2, Landmark, MapPin, Phone, X, Save, Edit3, Eye } from 'lucide-react';

interface LaboratoriesProps {
  laboratories: Laboratory[];
  setLaboratories: React.Dispatch<React.SetStateAction<Laboratory[]>>;
}

const Laboratories: React.FC<LaboratoriesProps> = ({ laboratories, setLaboratories }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingLab, setViewingLab] = useState<Laboratory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newLab, setNewLab] = useState<Partial<Laboratory>>({
    name: '',
    address: '',
    phone: ''
  });

  const unifiedLaboratories = useMemo(() => {
    const seen = new Set();
    return laboratories.filter(lab => {
      const normalized = lab.name.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [laboratories]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLab.name) {
        setLaboratories([...laboratories, { 
          ...newLab, 
          id: Date.now().toString(), 
          name: newLab.name.toUpperCase(),
          address: (newLab.address || '').toUpperCase()
        } as Laboratory]);
        setShowAddModal(false);
        setNewLab({ name: '', address: '', phone: '' });
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewingLab) {
      const updated = {
        ...viewingLab,
        name: viewingLab.name.toUpperCase(),
        address: (viewingLab.address || '').toUpperCase()
      };
      setLaboratories(laboratories.map(l => l.id === viewingLab.id ? updated : l));
      setIsEditing(false);
      setViewingLab(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja remover este laboratório da sua lista?')) {
      setLaboratories(laboratories.filter(l => l.id !== id));
      setViewingLab(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Meus Laboratórios</h2>
          <p className="text-slate-500">Estabelecimentos onde realiza seus exames</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Laboratório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {unifiedLaboratories.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <Landmark className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Nenhum laboratório cadastrado ainda.</p>
          </div>
        ) : (
          unifiedLaboratories.map(lab => (
            <div 
              key={lab.id} 
              className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center relative group overflow-hidden transition-all hover:shadow-md"
            >
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleDelete(lab.id)} className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="absolute inset-0 bg-blue-600/90 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 z-10">
                   <button 
                      onClick={() => { setViewingLab(lab); setIsEditing(false); }}
                      className="bg-white text-blue-600 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-lg hover:scale-105 transition-transform uppercase"
                   >
                      <Eye className="w-4 h-4" /> Visualizar
                   </button>
                   <button 
                      onClick={() => { setViewingLab(lab); setIsEditing(true); }}
                      className="bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-lg border border-blue-400 hover:scale-105 transition-transform uppercase"
                   >
                      <Edit3 className="w-4 h-4" /> Editar
                   </button>
                </div>

                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center text-blue-600 mb-4 ring-4 ring-blue-50 group-hover:scale-90 transition-transform">
                    <Landmark className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 uppercase">{lab.name}</h3>
                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest">
                   <MapPin className="w-3 h-3" />
                   {lab.address ? 'Endereço cadastrado' : 'Sem endereço'}
                </div>
            </div>
          ))
        )}
      </div>

      {viewingLab && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-blue-600 h-24 relative">
                <button onClick={() => setViewingLab(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-lg">
                   <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center text-blue-600">
                      <Landmark className="w-10 h-10" />
                   </div>
                </div>
             </div>
             <div className="pt-14 pb-10 px-8">
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nome do Laboratório</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" value={viewingLab.name} onChange={(e) => setViewingLab({...viewingLab, name: e.target.value.toUpperCase()})} />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Endereço</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" value={viewingLab.address || ''} onChange={(e) => setViewingLab({...viewingLab, address: e.target.value.toUpperCase()})} />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contato</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={viewingLab.phone || ''} onChange={(e) => setViewingLab({...viewingLab, phone: e.target.value})} />
                     </div>
                     <div className="flex gap-2 pt-4">
                        <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                           <Save className="w-4 h-4" /> Salvar
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 uppercase">
                           Cancelar
                        </button>
                     </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">{viewingLab.name}</h3>
                    
                    <div className="space-y-4 text-left border-t border-slate-50 pt-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                             <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Endereço</p>
                            <p className="text-sm font-black text-slate-700 uppercase">{viewingLab.address || 'Não informado'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                             <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Contato</p>
                            <p className="text-sm font-black text-slate-700">{viewingLab.phone || 'Não informado'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-2 mt-10">
                       <button 
                          onClick={() => setIsEditing(true)}
                          className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                       >
                          <Edit3 className="w-5 h-5" /> Editar
                       </button>
                       <button 
                          onClick={() => handleDelete(viewingLab.id)}
                          className="px-5 py-4 border border-rose-100 text-rose-500 rounded-2xl hover:bg-rose-50 transition-all"
                          title="Excluir Laboratório"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                    <h3 className="text-xl font-bold uppercase tracking-tight">Novo Laboratório</h3>
                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome</label>
                        <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" value={newLab.name} onChange={(e) => setNewLab({...newLab, name: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço</label>
                        <input type="text" placeholder="RUA, NÚMERO, BAIRRO, CIDADE" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold uppercase" value={newLab.address} onChange={(e) => setNewLab({...newLab, address: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Telefone</label>
                        <input type="text" placeholder="(00) 0000-0000" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newLab.phone} onChange={(e) => setNewLab({...newLab, phone: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl mt-4 uppercase tracking-widest shadow-lg"><Save className="w-5 h-5" /> Salvar Laboratório</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Laboratories;
