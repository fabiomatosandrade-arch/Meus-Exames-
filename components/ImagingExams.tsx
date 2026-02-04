
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ImagingExam, Doctor, Laboratory } from '../types';
import { extractImagingDataFromFile, generateExamSymbol } from '../services/geminiService';
import { 
  Plus, Search, Info, X, Save, Calendar, Landmark, 
  Image as ImageIcon, FileText, Upload, Loader2, 
  Filter, Sparkles, Trash2, Printer, Share2, 
  MessageCircle, ChevronDown, User as UserIcon,
  Stethoscope, Eye, MapPin, FileType, RotateCcw,
  Download, ExternalLink, CheckCircle2, FileSearch, Edit3
} from 'lucide-react';

interface ImagingExamsProps {
  imagingExams: ImagingExam[];
  setImagingExams: React.Dispatch<React.SetStateAction<ImagingExam[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  laboratories: Laboratory[];
  setLaboratories: React.Dispatch<React.SetStateAction<Laboratory[]>>;
}

const ImagingExams: React.FC<ImagingExamsProps> = ({ 
  imagingExams, 
  setImagingExams, 
  doctors, 
  setDoctors, 
  laboratories, 
  setLaboratories 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingExam, setViewingExam] = useState<ImagingExam | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [docFilter, setDocFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [examImages, setExamImages] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lifeTrace_imaging_icons');
    return saved ? JSON.parse(saved) : {};
  });
  const [generatingFor, setGeneratingFor] = useState<Set<string>>(new Set());

  const [newExam, setNewExam] = useState<Partial<ImagingExam>>({
    patientName: '',
    examType: '',
    region: '',
    doctorName: '',
    laboratory: '',
    date: new Date().toISOString().split('T')[0],
    reportSummary: '',
    conclusion: '',
    notes: '',
    fileUri: '',
    fileMimeType: ''
  });

  const uniqueTypes = useMemo(() => {
    const types = imagingExams.map(e => e.examType.toUpperCase().trim());
    return Array.from(new Set(types)).sort();
  }, [imagingExams]);

  const uniqueDocs = useMemo(() => {
    const docs = imagingExams.map(e => e.doctorName.toUpperCase().trim());
    return Array.from(new Set(docs)).sort();
  }, [imagingExams]);

  // Sincroniza geração de ícones
  useEffect(() => {
    uniqueTypes.forEach(async (name) => {
      const normalizedName = name.toUpperCase().trim();
      if (normalizedName && !examImages[normalizedName] && !generatingFor.has(normalizedName)) {
        setGeneratingFor(prev => new Set(prev).add(normalizedName));
        const img = await generateExamSymbol(normalizedName);
        if (img) {
          setExamImages(prev => {
            const next = { ...prev, [normalizedName]: img };
            localStorage.setItem('lifeTrace_imaging_icons', JSON.stringify(next));
            return next;
          });
        }
        setGeneratingFor(prev => {
          const next = new Set(prev);
          next.delete(normalizedName);
          return next;
        });
      }
    });
  }, [uniqueTypes, examImages, generatingFor]);

  const filteredExams = useMemo(() => {
    return imagingExams.filter(exam => {
      const matchType = typeFilter === 'all' || exam.examType.toUpperCase().trim() === typeFilter.toUpperCase().trim();
      const matchDoc = docFilter === 'all' || exam.doctorName.toUpperCase().trim() === docFilter.toUpperCase().trim();
      return matchType && matchDoc;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [imagingExams, typeFilter, docFilter]);

  const registerDoctorIfNew = (doctorName: string) => {
    if (!doctorName || doctorName.toUpperCase() === 'NÃO INFORMADO') return;
    const normalized = doctorName.toUpperCase().trim();
    const exists = doctors.some(d => d.name.toUpperCase().trim() === normalized);
    if (!exists) {
      setDoctors(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        name: normalized,
        specialty: 'RADIOLOGISTA/ESPECIALISTA',
      }]);
    }
  };

  const registerLaboratoryIfNew = (labName: string) => {
    if (!labName || labName.toUpperCase() === 'NÃO INFORMADO') return;
    const normalized = labName.toUpperCase().trim();
    const exists = laboratories.some(l => l.name.toUpperCase().trim() === normalized);
    if (!exists) {
      setLaboratories(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        name: normalized,
      }]);
    }
  };

  const viewPdfAttachment = (exam: ImagingExam) => {
    if (!exam.fileUri) return;
    
    try {
      if (exam.fileUri.startsWith('data:')) {
        const parts = exam.fileUri.split(',');
        if (parts.length < 2) throw new Error("URI de dados inválida");
        
        const base64Content = parts[1];
        const mime = exam.fileMimeType || parts[0].split(':')[1].split(';')[0] || 'application/pdf';
        
        const byteCharacters = atob(base64Content);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: mime });
        const url = URL.createObjectURL(blob);
        
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          alert('Por favor, autorize pop-ups para visualizar o PDF.');
        }
      } else {
        window.open(exam.fileUri, '_blank');
      }
    } catch (e) {
      console.error("Erro ao abrir PDF:", e);
      window.open(exam.fileUri, '_blank');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fullDataUri = reader.result as string;
        const base64 = fullDataUri.split(',')[1];
        const extracted = await extractImagingDataFromFile(base64, file.type);
        
        if (extracted) {
          setNewExam(prev => ({
            ...prev,
            patientName: (extracted.patientName || '').toUpperCase(),
            examType: (extracted.examType || '').toUpperCase(),
            region: (extracted.region || '').toUpperCase(),
            laboratory: (extracted.laboratory || '').toUpperCase(),
            doctorName: (extracted.doctorName || '').toUpperCase(),
            date: extracted.date || prev.date,
            reportSummary: (extracted.reportSummary || '').toUpperCase(),
            conclusion: (extracted.conclusion || '').toUpperCase(),
            fileUri: fullDataUri,
            fileMimeType: file.type
          }));
        } else {
          setNewExam(prev => ({ ...prev, fileUri: fullDataUri, fileMimeType: file.type }));
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro no processamento:", error);
      setIsAnalyzing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExam.examType && newExam.laboratory) {
      const docName = (newExam.doctorName || 'NÃO INFORMADO').toUpperCase().trim();
      const labName = (newExam.laboratory || 'NÃO INFORMADO').toUpperCase().trim();
      
      registerDoctorIfNew(docName);
      registerLaboratoryIfNew(labName);

      const exam: ImagingExam = {
        id: Date.now().toString(),
        patientName: (newExam.patientName || '').toUpperCase().trim(),
        examType: newExam.examType.toUpperCase().trim(),
        region: (newExam.region || '').toUpperCase().trim(),
        doctorName: docName,
        laboratory: labName,
        date: newExam.date || new Date().toISOString().split('T')[0],
        reportSummary: (newExam.reportSummary || '').toUpperCase().trim(),
        conclusion: (newExam.conclusion || '').toUpperCase().trim(),
        notes: (newExam.notes || '').toUpperCase().trim(),
        fileUri: newExam.fileUri,
        fileMimeType: newExam.fileMimeType
      };
      setImagingExams([exam, ...imagingExams]);
      setShowAddModal(false);
      setNewExam({
        patientName: '', examType: '', region: '', doctorName: '', laboratory: '',
        date: new Date().toISOString().split('T')[0], reportSummary: '', conclusion: '', notes: '',
        fileUri: '', fileMimeType: ''
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Exames de Imagem</h2>
          <p className="text-slate-500">Gestão inteligente de laudos radiológicos</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5" />Anexar Novo Laudo
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 print:hidden">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </span>
          <button onClick={() => { setTypeFilter('all'); setDocFilter('all'); }} className="text-[10px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Limpar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Tipo de Exame</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-black text-slate-700 uppercase appearance-none focus:ring-2 focus:ring-blue-500" 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">TODOS OS TIPOS</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Médico</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-black text-slate-700 uppercase appearance-none focus:ring-2 focus:ring-blue-500" 
                value={docFilter} 
                onChange={(e) => setDocFilter(e.target.value)}
              >
                <option value="all">TODOS OS MÉDICOS</option>
                {uniqueDocs.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExams.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
            <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <p className="text-slate-500 text-xl uppercase font-black tracking-widest">Nenhum laudo encontrado.</p>
          </div>
        ) : (
          filteredExams.map(exam => {
            const iconUrl = examImages[exam.examType.toUpperCase().trim()];
            return (
              <div key={exam.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col cursor-pointer" onClick={() => setViewingExam(exam)}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-blue-50 p-0 rounded-[20px] text-blue-600 shadow-inner overflow-hidden w-14 h-14 flex items-center justify-center border border-blue-100">
                    {iconUrl ? (
                      <img src={iconUrl} alt={exam.examType} className="w-full h-full object-cover" />
                    ) : generatingFor.has(exam.examType.toUpperCase().trim()) ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-300" />
                    ) : (
                      <ImageIcon className="w-7 h-7" />
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(exam.date).toLocaleDateString('pt-BR')}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight line-clamp-1">{exam.examType}</h3>
                <p className="text-blue-600 text-[11px] font-black uppercase tracking-[0.2em] mb-4">{exam.region || 'REGIÃO GERAL'}</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-tight">
                    <Landmark className="w-3.5 h-3.5 text-slate-300" /> {exam.laboratory}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-tight">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-300" /> {exam.doctorName}
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl mb-6 flex-grow border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-blue-400" /> Conclusão</p>
                  <p className="text-[11px] font-bold text-slate-700 uppercase italic line-clamp-3 leading-relaxed">{exam.conclusion || 'NÃO INFORMADA'}</p>
                </div>

                <div className="flex gap-2 relative z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setViewingExam(exam); }}
                    className="flex-1 bg-slate-900 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <Eye className="w-4 h-4" /> Abrir Laudo
                  </button>
                  {exam.fileUri && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); viewPdfAttachment(exam); }}
                      className="p-3.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Visualizar PDF original"
                    >
                      <FileSearch className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {viewingExam && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:static overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:rounded-none print:max-h-none print:static">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white print:hidden">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-blue-400" />
                <h3 className="text-sm font-black uppercase tracking-widest">Laudo de Imagem Detalhado</h3>
              </div>
              <div className="flex items-center gap-2">
                {viewingExam.fileUri && (
                  <button 
                    onClick={() => viewPdfAttachment(viewingExam)}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-full transition-all font-black uppercase text-[10px] tracking-widest mr-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Visualizar PDF
                  </button>
                )}
                <button 
                   onClick={() => window.print()} 
                   className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-all font-black uppercase text-[10px] tracking-widest"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button onClick={() => setViewingExam(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="flex-1 p-10 lg:p-16 bg-white print:p-0 font-serif">
               <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-10">
                  <div className="space-y-1">
                     <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter font-sans">{viewingExam.laboratory}</h1>
                     <p className="text-[10px] font-bold text-slate-500 uppercase font-sans tracking-widest flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> LAUDO DIGITAL LIFE-TRACE
                     </p>
                  </div>
                  <div className="text-right">
                     <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block border border-slate-200 print:bg-white">
                        <p className="text-[9px] font-black text-slate-400 uppercase font-sans mb-0.5">Identificação</p>
                        <p className="text-xs font-black text-slate-700 font-sans tracking-widest">#{viewingExam.id.slice(-6).toUpperCase()}</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100 print:bg-white print:border-slate-200">
                  <div className="col-span-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase font-sans block mb-1">Paciente</label>
                     <p className="text-sm font-black text-slate-800 uppercase font-sans">{viewingExam.patientName || 'NÃO IDENTIFICADO'}</p>
                  </div>
                  <div>
                     <label className="text-[9px] font-black text-slate-400 uppercase font-sans block mb-1">Data</label>
                     <p className="text-sm font-black text-slate-800 font-sans">{new Date(viewingExam.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                     <label className="text-[9px] font-black text-slate-400 uppercase font-sans block mb-1">Solicitante</label>
                     <p className="text-sm font-black text-slate-800 uppercase font-sans">{viewingExam.doctorName}</p>
                  </div>
               </div>

               <div className="text-center mb-12">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest border-y border-slate-200 py-4 font-sans">
                     {viewingExam.examType} {viewingExam.region && `(${viewingExam.region})`}
                  </h2>
               </div>

               <div className="space-y-12">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest font-sans flex items-center gap-2">
                       <FileText className="w-4 h-4" /> Achados Radiológicos
                    </h4>
                    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 print:bg-transparent print:p-0 print:border-none">
                      <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap text-justify uppercase font-sans font-medium">
                        {viewingExam.reportSummary || 'DETALHAMENTO NÃO DISPONÍVEL.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl relative overflow-hidden print:bg-white print:text-black print:border-2 print:border-black print:shadow-none mt-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 print:hidden"></div>
                    <div>
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 print:text-black">Impressão Diagnóstica</h4>
                      <p className="text-xl font-black leading-snug uppercase italic print:not-italic font-sans">
                         {viewingExam.conclusion}
                      </p>
                    </div>
                    {viewingExam.fileUri && (
                      <button 
                        onClick={() => viewPdfAttachment(viewingExam)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 p-4 rounded-2xl transition-all flex flex-col items-center gap-2 group print:hidden shrink-0"
                      >
                        <FileSearch className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Ver PDF</span>
                      </button>
                    )}
                  </div>
               </div>

               <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 print:mt-12">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-sans">Autenticação de Registro</p>
                     <p className="text-[8px] text-slate-300 font-sans uppercase">ID: {viewingExam.id}</p>
                  </div>
                  <div className="flex gap-4 print:hidden">
                    <button 
                       onClick={() => { if(confirm('Excluir permanentemente este laudo?')) { setImagingExams(imagingExams.filter(e => e.id !== viewingExam.id)); setViewingExam(null); } }} 
                       className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:underline font-sans"
                    ><Trash2 className="w-4 h-4" /> Excluir</button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight">Anexar Novo Exame</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-7 h-7" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div 
                    className="bg-white rounded-[40px] p-8 border-2 border-dashed border-blue-200 text-center hover:bg-blue-50/50 transition-all group relative cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isAnalyzing ? (
                      <div className="py-12 flex flex-col items-center gap-6">
                        <Loader2 className="w-14 h-14 text-blue-600 animate-spin" />
                        <p className="font-black text-blue-600 uppercase tracking-widest text-xs animate-pulse">Extraindo Dados por IA...</p>
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center gap-6">
                        <div className={`p-6 rounded-[24px] text-white shadow-xl group-hover:scale-110 transition-transform ${newExam.fileUri ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                           {newExam.fileUri ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                            {newExam.fileUri ? 'Laudo Carregado' : 'Digitalizar Laudo'}
                          </h4>
                          <p className="text-slate-400 text-xs font-medium mt-1">
                            Arraste PDF ou Fotos do seu exame.
                          </p>
                        </div>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome do Exame</label>
                        <input required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-sm" value={newExam.examType} onChange={(e) => setNewExam({...newExam, examType: e.target.value.toUpperCase()})} placeholder="EX: RESSONÂNCIA MAGNÉTICA" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Região do Corpo</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-sm" value={newExam.region} onChange={(e) => setNewExam({...newExam, region: e.target.value.toUpperCase()})} placeholder="EX: JOELHO ESQUERDO" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data</label>
                        <input type="date" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={newExam.date} onChange={(e) => setNewExam({...newExam, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Laboratório</label>
                        <input required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs" value={newExam.laboratory} onChange={(e) => setNewExam({...newExam, laboratory: e.target.value.toUpperCase()})} />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Conclusão do Laudo</label>
                      <textarea required className="w-full p-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase h-32 resize-none text-xs leading-relaxed" value={newExam.conclusion} onChange={(e) => setNewExam({...newExam, conclusion: e.target.value.toUpperCase()})} />
                   </div>

                   <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest hover:bg-blue-700 transition-all mt-4"><Save className="w-6 h-6" /> Salvar Exame</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagingExams;
