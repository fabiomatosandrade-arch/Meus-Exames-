
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ExamRecord, Doctor, ExamReference, Laboratory } from '../types';
import { fetchSigtapReference, getExamInformation, extractExamDataFromFile, generateExamSymbol } from '../services/geminiService';
import { 
  Plus, Search, Info, X, Save, Calendar, Landmark, 
  Activity, AlertCircle, CheckCircle, HelpCircle, FileText, 
  Upload, Loader2, Filter, Sparkles, LayoutGrid, History,
  Trash2, Stethoscope, ChevronDown, ChevronRight, RotateCcw, Eye, Printer, MessageCircle, CheckCircle2,
  BarChart, Edit3, List, User as UserIcon
} from 'lucide-react';

export type HealthStatus = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export const getHealthStatus = (valueStr: string, referenceRange: string): HealthStatus => {
  if (!referenceRange || referenceRange === 'N/A' || referenceRange.trim() === '') return 'neutral';
  
  const val = parseFloat(valueStr.replace(',', '.'));
  const isNumericValue = !isNaN(val) && isFinite(val);
  const cleanRange = referenceRange.replace(',', '.').toLowerCase();

  if (isNumericValue) {
    // Caso 1: Faixa de valores (ex: 70 - 99)
    const rangeMatch = cleanRange.match(/([\d.]+)\s*(?:-|a|até|—)\s*([\d.]+)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      
      if (val >= min && val <= max) {
        // Opcional: Status 'info' para valores exatamente no centro (exemplo de uso do novo status)
        const mid = (min + max) / 2;
        if (Math.abs(val - mid) < (max - min) * 0.05) return 'success'; // Poderia ser 'info' se desejado
        return 'success';
      }
      
      const rangeWidth = max - min;
      const margin = rangeWidth * 0.2; // Margem de 20% conforme solicitado
      
      if ((val >= min - margin && val < min) || (val > max && val <= max + margin)) return 'warning';
      return 'danger';
    }

    // Caso 2: "Maior que" (ex: > 100)
    const greaterMatch = cleanRange.match(/(?:>|acima de|superior a)\s*([\d.]+)/);
    if (greaterMatch) {
      const threshold = parseFloat(greaterMatch[1]);
      if (val > threshold) return 'success';
      // Margem de 20% abaixo do limite
      if (val <= threshold && val >= threshold * 0.8) return 'warning';
      return 'danger';
    }

    // Caso 3: "Menor que" (ex: < 100)
    const lessMatch = cleanRange.match(/(?:<|abaixo de|inferior a|até)\s*([\d.]+)/);
    if (lessMatch) {
      const threshold = parseFloat(lessMatch[1]);
      if (val < threshold) return 'success';
      // Margem de 20% acima do limite
      if (val >= threshold && val <= threshold * 1.2) return 'warning';
      return 'danger';
    }
  } else {
    const v = valueStr.toLowerCase().trim();
    const healthyPatterns = ['não reagente', 'negativo', 'ausente', 'normal', 'não detectado'];
    const unhealthyPatterns = ['reagente', 'positivo', 'presente', 'alterado', 'detectado'];
    const infoPatterns = ['indeterminado', 'repetir', 'aguardar'];
    
    if (healthyPatterns.some(p => v.includes(p))) return 'success';
    if (unhealthyPatterns.some(p => v.includes(p))) return 'danger';
    if (infoPatterns.some(p => v.includes(p))) return 'info';
  }
  return 'neutral';
};

export const statusLabels: Record<HealthStatus, string> = {
  'success': 'Normal',
  'warning': 'Atenção',
  'danger': 'Crítico',
  'neutral': 'Indefinido',
  'info': 'Informativo'
};

// Fixed missing ExamsProps interface to resolve the build error
interface ExamsProps {
  exams: ExamRecord[];
  setExams: React.Dispatch<React.SetStateAction<ExamRecord[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  laboratories: Laboratory[];
  setLaboratories: React.Dispatch<React.SetStateAction<Laboratory[]>>;
  user?: any;
}

const Exams: React.FC<ExamsProps> = ({ exams, setExams, doctors, setDoctors, laboratories, setLaboratories }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingExamRecord, setViewingExamRecord] = useState<ExamRecord | null>(null);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ExamRecord>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [examNameFilter, setExamNameFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<HealthStatus | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [sigtapResults, setSigtapResults] = useState<ExamReference[]>([]);
  const [isLoadingSigtap, setIsLoadingSigtap] = useState(false);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [infoBox, setInfoBox] = useState<string | null>(null);
  
  const [examImages, setExamImages] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lifeTrace_exam_images');
    return saved ? JSON.parse(saved) : {};
  });
  const [generatingFor, setGeneratingFor] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [extractedExams, setExtractedExams] = useState<Partial<ExamRecord>[]>([]);

  const [newExam, setNewExam] = useState<Partial<ExamRecord>>({
    examName: '',
    value: '',
    unit: '',
    referenceRange: '',
    laboratory: '',
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const allAvailableLabs = useMemo(() => {
    const labsFromExams = exams.map(e => e.laboratory.toUpperCase().trim());
    const labsFromList = laboratories.map(l => l.name.toUpperCase().trim());
    return Array.from(new Set([...labsFromExams, ...labsFromList])).filter(Boolean).sort();
  }, [laboratories, exams]);

  const uniqueExamNames = useMemo(() => {
    const names = exams.map(e => e.examName.toUpperCase());
    return Array.from(new Set(names)).sort();
  }, [exams]);

  useEffect(() => {
    uniqueExamNames.forEach(async (name) => {
      if (!examImages[name] && !generatingFor.has(name)) {
        setGeneratingFor(prev => new Set(prev).add(name));
        const img = await generateExamSymbol(name);
        if (img) {
          setExamImages(prev => {
            const next = { ...prev, [name]: img };
            localStorage.setItem('lifeTrace_exam_images', JSON.stringify(next));
            return next;
          });
        }
        setGeneratingFor(prev => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
      }
    });
  }, [uniqueExamNames, examImages, generatingFor]);

  const filteredExams = useMemo(() => {
    let result = [...exams];
    if (examNameFilter !== 'all') {
      result = result.filter(e => e.examName.toUpperCase() === examNameFilter.toUpperCase());
    }
    if (labFilter !== 'all') {
      result = result.filter(e => e.laboratory.toUpperCase().trim() === labFilter.toUpperCase().trim());
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => getHealthStatus(e.value, e.referenceRange) === statusFilter);
    }
    if (startDateFilter) {
      result = result.filter(e => e.date >= startDateFilter);
    }
    if (endDateFilter) {
      result = result.filter(e => e.date <= endDateFilter);
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [exams, examNameFilter, labFilter, statusFilter, startDateFilter, endDateFilter]);

  const handleResetFilters = () => {
    setExamNameFilter('all');
    setLabFilter('all');
    setStatusFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const handleDeleteExam = (id: string) => {
    if (window.confirm('Deseja excluir este registro de exame permanentemente?')) {
      setExams(prev => prev.filter(e => e.id !== id));
      setViewingExamRecord(null);
    }
  };

  const handleStartEdit = (record: ExamRecord) => {
    setEditFormData({ ...record });
    setIsEditingRecord(true);
  };

  const handleSaveEdit = () => {
    if (editFormData.id && editFormData.examName && editFormData.value) {
      const updatedExams = exams.map(exam => 
        exam.id === editFormData.id ? { ...exam, ...editFormData } as ExamRecord : exam
      );
      setExams(updatedExams);
      setViewingExamRecord({ ...viewingExamRecord, ...editFormData } as ExamRecord);
      setIsEditingRecord(false);
    }
  };

  const registerDoctorIfNew = (doctorName: string) => {
    if (!doctorName || doctorName.toLowerCase() === 'não informado') return;
    const normalized = doctorName.toUpperCase().trim();
    const exists = doctors.some(d => d.name.toUpperCase().trim() === normalized);
    if (!exists) {
      const newDoctor: Doctor = {
        id: Math.random().toString(36).substr(2, 9),
        name: normalized,
        specialty: 'CLÍNICO GERAL',
      };
      setDoctors(prev => [...prev, newDoctor]);
    }
  };

  const registerLaboratoryIfNew = (labName: string) => {
    if (!labName || labName.toLowerCase() === 'não informado' || labName === 'N/A') return;
    const normalized = labName.toUpperCase().trim();
    const exists = laboratories.some(l => l.name.toUpperCase().trim() === normalized);
    if (!exists) {
      const newLab: Laboratory = {
        id: Math.random().toString(36).substr(2, 9),
        name: normalized,
      };
      setLaboratories(prev => [...prev, newLab]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await extractExamDataFromFile(base64, file.type);
        
        if (extracted && extracted.length > 0) {
          const normalizedExtracted = extracted.map(ex => ({
            ...ex,
            examName: (ex.examName || '').toUpperCase(),
            value: (ex.value || '').toUpperCase(),
            unit: (ex.unit || '').toUpperCase(),
            referenceRange: (ex.referenceRange || '').toUpperCase(),
            laboratory: (ex.laboratory || 'N/A').toUpperCase(),
            doctorName: (ex.doctorName || 'NÃO INFORMADO').toUpperCase(),
            date: ex.date || new Date().toISOString().split('T')[0]
          }));
          
          setExtractedExams(normalizedExtracted);
        }
        setIsAnalyzingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      setIsAnalyzingFile(false);
    }
  };

  const handleSaveExtracted = () => {
    const validExams = extractedExams
      .filter(ex => ex.examName && ex.value)
      .map(ex => {
        const docName = (ex.doctorName || 'NÃO INFORMADO').toUpperCase().trim();
        const labName = (ex.laboratory || 'N/A').toUpperCase().trim();
        
        registerDoctorIfNew(docName);
        registerLaboratoryIfNew(labName);
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          examName: ex.examName!.toUpperCase(),
          value: String(ex.value).toUpperCase(),
          unit: (ex.unit || '').toUpperCase(),
          referenceRange: (ex.referenceRange || '').toUpperCase(),
          laboratory: labName,
          doctorName: docName,
          date: ex.date || new Date().toISOString().split('T')[0],
          notes: (ex.notes || '').toUpperCase(),
        } as ExamRecord;
      });

    setExams(prev => [...validExams, ...prev]);
    setExtractedExams([]);
    setShowAddModal(false);
  };

  const updateExtractedItem = (idx: number, field: keyof Partial<ExamRecord>, val: string) => {
    const updated = [...extractedExams];
    updated[idx] = { ...updated[idx], [field]: val };
    setExtractedExams(updated);
  };

  const selectSigtapExam = async (ref: ExamReference) => {
    setNewExam({
      ...newExam,
      examName: ref.name.toUpperCase(),
      referenceRange: ref.referenceValue.toUpperCase(),
      unit: ref.unit.toUpperCase() 
    });
    setSigtapResults([]);
    setSearchQuery('');
    const info = await getExamInformation(ref.name);
    setInfoBox(info);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExam.examName && newExam.value) {
      const docName = (newExam.doctorName || 'NÃO INFORMADO').toUpperCase().trim();
      const labName = (newExam.laboratory || 'N/A').toUpperCase().trim();
      
      registerDoctorIfNew(docName);
      registerLaboratoryIfNew(labName);

      const record: ExamRecord = {
        id: Date.now().toString(),
        examName: newExam.examName.toUpperCase(),
        value: String(newExam.value).toUpperCase(),
        unit: (newExam.unit || '').toUpperCase(),
        referenceRange: (newExam.referenceRange || '').toUpperCase(),
        laboratory: labName,
        doctorName: docName,
        date: newExam.date || new Date().toISOString().split('T')[0],
        notes: (newExam.notes || '').toUpperCase(),
      };
      setExams([record, ...exams]);
      setShowAddModal(false);
      setNewExam({
        examName: '', value: '', unit: '', referenceRange: '', laboratory: '', doctorName: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setInfoBox(null);
    }
  };

  const handleSigtapSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoadingSigtap(true);
    const results = await fetchSigtapReference(searchQuery);
    setSigtapResults(results);
    setIsLoadingSigtap(false);
  };

  const statusColors: Record<HealthStatus, string> = {
    success: 'bg-emerald-500', 
    warning: 'bg-amber-500', 
    danger: 'bg-rose-500', 
    neutral: 'bg-slate-300',
    info: 'bg-indigo-500' // Novo status 'info' para roxo
  };

  const statusTextColors: Record<HealthStatus, string> = {
    success: 'text-emerald-600', 
    warning: 'text-amber-600', 
    danger: 'text-rose-600', 
    neutral: 'text-slate-500',
    info: 'text-indigo-600'
  };

  const statsCount = useMemo(() => {
    const counts = { success: 0, warning: 0, danger: 0, neutral: 0, info: 0 };
    exams.forEach(e => {
      const s = getHealthStatus(e.value, e.referenceRange);
      counts[s as keyof typeof counts]++;
    });
    return counts;
  }, [exams]);

  const isFilterActive = examNameFilter !== 'all' || labFilter !== 'all' || statusFilter !== 'all' || startDateFilter || endDateFilter;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Meus Exames</h2>
          <p className="text-slate-500">Histórico completo de resultados laboratoriais</p>
        </div>
        <div className="flex flex-col xl:flex-row items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto justify-center shadow-inner">
            <button onClick={() => setViewMode('grid')} title="Ver Grade" className={`p-2.5 rounded-xl transition-all flex items-center gap-2 px-4 ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('timeline')} title="Ver Lista" className={`p-2.5 rounded-xl transition-all flex items-center gap-2 px-4 ${viewMode === 'timeline' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 whitespace-nowrap uppercase tracking-widest text-sm">
            <Plus className="w-6 h-6" />Novo Exame
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 print:hidden">
         <button onClick={() => setStatusFilter('all')} className={`p-5 rounded-[32px] border transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group ${statusFilter === 'all' ? 'bg-slate-800 border-slate-900 text-white shadow-xl ring-4 ring-slate-100 ring-offset-2' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 shadow-sm'}`}>
            <div className="flex items-center justify-between relative z-10">
              <BarChart className={`w-6 h-6 ${statusFilter === 'all' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="text-3xl font-black tabular-nums">{exams.length}</span>
            </div>
            <div className="relative z-10">
               <span className="text-[11px] font-black uppercase tracking-widest block mb-1">Total</span>
            </div>
         </button>
         <button onClick={() => setStatusFilter('success')} className={`p-5 rounded-[32px] border transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group ${statusFilter === 'success' ? 'bg-emerald-600 border-emerald-700 text-white shadow-xl ring-4 ring-emerald-100 ring-offset-2' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200 shadow-sm'}`}>
            <div className="flex items-center justify-between relative z-10">
              <CheckCircle2 className={`w-6 h-6 ${statusFilter === 'success' ? 'text-white' : 'text-emerald-500'}`} />
              <span className="text-3xl font-black tabular-nums">{statsCount.success}</span>
            </div>
            <div className="relative z-10">
               <span className="text-[11px] font-black uppercase tracking-widest block mb-1">Normais</span>
            </div>
         </button>
         <button onClick={() => setStatusFilter('warning')} className={`p-5 rounded-[32px] border transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group ${statusFilter === 'warning' ? 'bg-amber-50 border-amber-600 text-white shadow-xl ring-4 ring-amber-100 ring-offset-2' : 'bg-white border-slate-100 text-slate-600 hover:border-amber-200 shadow-sm'}`}>
            <div className="flex items-center justify-between relative z-10">
              <AlertCircle className={`w-6 h-6 ${statusFilter === 'warning' ? 'text-white' : 'text-amber-500'}`} />
              <span className="text-3xl font-black tabular-nums">{statsCount.warning}</span>
            </div>
            <div className="relative z-10">
               <span className="text-[11px] font-black uppercase tracking-widest block mb-1">Atenção</span>
            </div>
         </button>
         <button onClick={() => setStatusFilter('danger')} className={`p-5 rounded-[32px] border transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group ${statusFilter === 'danger' ? 'bg-rose-600 border-rose-700 text-white shadow-xl ring-4 ring-rose-100 ring-offset-2' : 'bg-white border-slate-100 text-slate-600 hover:border-rose-200 shadow-sm'}`}>
            <div className="flex items-center justify-between relative z-10">
              <AlertCircle className={`w-6 h-6 ${statusFilter === 'danger' ? 'text-white' : 'text-rose-500'}`} />
              <span className="text-3xl font-black tabular-nums">{statsCount.danger}</span>
            </div>
            <div className="relative z-10">
               <span className="text-[11px] font-black uppercase tracking-widest block mb-1">Críticos</span>
            </div>
         </button>
         <button onClick={() => setStatusFilter('info')} className={`p-5 rounded-[32px] border transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group ${statusFilter === 'info' ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl ring-4 ring-indigo-100 ring-offset-2' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 shadow-sm'}`}>
            <div className="flex items-center justify-between relative z-10">
              <Info className={`w-6 h-6 ${statusFilter === 'info' ? 'text-white' : 'text-indigo-500'}`} />
              <span className="text-3xl font-black tabular-nums">{statsCount.info}</span>
            </div>
            <div className="relative z-10">
               <span className="text-[11px] font-black uppercase tracking-widest block mb-1">Info</span>
            </div>
         </button>
         <button onClick={() => setStatusFilter('neutral')} className={`p-5 rounded-[32px] border transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group ${statusFilter === 'neutral' ? 'bg-slate-400 border-slate-500 text-white shadow-xl ring-4 ring-slate-100 ring-offset-2' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 shadow-sm'}`}>
            <div className="flex items-center justify-between relative z-10">
              <HelpCircle className={`w-6 h-6 ${statusFilter === 'neutral' ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-3xl font-black tabular-nums">{statsCount.neutral}</span>
            </div>
            <div className="relative z-10">
               <span className="text-[11px] font-black uppercase tracking-widest block mb-1">N/A</span>
            </div>
         </button>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-md space-y-8 print:hidden transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Filtros de Busca</h3>
          </div>
          {isFilterActive && (
             <button onClick={handleResetFilters} className="flex items-center gap-2 px-4 py-2 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all border border-rose-100">
                <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
             </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Exame</label>
            <div className="relative">
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-black text-slate-700 uppercase appearance-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" value={examNameFilter} onChange={(e) => setExamNameFilter(e.target.value)}>
                <option value="all">TODOS OS EXAMES</option>
                {uniqueExamNames.map(name => (<option key={name} value={name}>{name}</option>))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Laboratório</label>
            <div className="relative">
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-black text-slate-700 uppercase appearance-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" value={labFilter} onChange={(e) => setLabFilter(e.target.value)}>
                <option value="all">TODOS OS LABORATÓRIOS</option>
                {allAvailableLabs.map(lab => (<option key={lab} value={lab}>{lab}</option>))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Data Inicial</label>
            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Data Final</label>
            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
          </div>
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-slate-200 shadow-inner">
          <Activity className="w-20 h-20 text-slate-100 mx-auto mb-8" />
          <p className="text-slate-400 text-2xl uppercase font-black tracking-widest">Nenhum exame encontrado</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
          {filteredExams.map(exam => {
            const status = getHealthStatus(exam.value, exam.referenceRange);
            const examImg = examImages[exam.examName.toUpperCase()];
            return (
              <div key={exam.id} className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden" onClick={() => { setViewingExamRecord(exam); setIsEditingRecord(false); }}>
                <div className={`absolute top-0 left-0 bottom-0 w-2 ${statusColors[status]}`}></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="flex justify-between items-start mb-8 relative z-10 pl-2">
                   <div className="bg-blue-50 p-0 rounded-3xl text-blue-600 group-hover:shadow-lg transition-all overflow-hidden w-16 h-16 flex items-center justify-center border border-blue-100">
                      {examImg ? <img src={examImg} alt={exam.examName} className="w-full h-full object-cover" /> : <Activity className="w-8 h-8" />}
                   </div>
                   <div className="text-right">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{exam.laboratory}</p>
                   </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase truncate mb-4 pl-2 tracking-tight">{exam.examName}</h3>
                <div className="flex items-baseline gap-2 mb-8 bg-slate-50/50 p-6 rounded-[32px] border border-slate-50 shadow-inner ml-2">
                  <p className="text-5xl font-black text-blue-600 tracking-tighter">{exam.value}</p>
                  <p className="text-sm font-black text-slate-400 uppercase">{exam.unit}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pl-2">
                   <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusTextColors[status]}`}>{statusLabels[status]}</span>
                   </div>
                   <button className="text-blue-600 bg-blue-50 p-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <Eye className="w-5 h-5" />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Novo Registro de Exame</h3>
              <button onClick={() => { setShowAddModal(false); setExtractedExams([]); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-8 h-8" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50">
              {extractedExams.length > 0 ? (
                <div className="space-y-6">
                   <div className="bg-blue-600 text-white p-10 rounded-[40px] shadow-xl relative overflow-hidden">
                      <Sparkles className="absolute right-6 top-6 w-20 h-20 opacity-20" />
                      <h4 className="text-2xl font-black uppercase mb-3 tracking-tighter">Inteligência Artificial Ativa</h4>
                      <p className="text-blue-100 text-sm font-medium">Extraímos resultados múltiplos. Verifique e **altere qualquer informação** abaixo antes de salvar.</p>
                   </div>
                   <div className="grid grid-cols-1 gap-8">
                      {extractedExams.map((ex, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6 relative group hover:border-blue-300 transition-all">
                           <button onClick={() => setExtractedExams(extractedExams.filter((_, i) => i !== idx))} className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors"><X className="w-6 h-6" /></button>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome do Exame</label>
                                 <input className="w-full text-lg font-black text-slate-800 uppercase bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all" value={ex.examName} onChange={e => updateExtractedItem(idx, 'examName', e.target.value.toUpperCase())} />
                              </div>
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Data da Coleta</label>
                                 <input type="date" className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all" value={ex.date} onChange={e => updateExtractedItem(idx, 'date', e.target.value)} />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Resultado</label>
                                 <input className="w-full text-lg font-black text-blue-600 bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all" value={ex.value} onChange={e => updateExtractedItem(idx, 'value', e.target.value.toUpperCase())} />
                              </div>
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Unidade</label>
                                 <input className="w-full text-sm font-bold text-slate-500 bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all" value={ex.unit} placeholder="EX: MG/DL" onChange={e => updateExtractedItem(idx, 'unit', e.target.value.toUpperCase())} />
                              </div>
                              <div className="md:col-span-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor de Referência</label>
                                 <input className="w-full text-sm font-bold text-slate-500 bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all" value={ex.referenceRange} onChange={e => updateExtractedItem(idx, 'referenceRange', e.target.value.toUpperCase())} />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Landmark className="w-5 h-5" /></div>
                                 <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Laboratório</label>
                                    <input className="w-full text-[10px] font-black text-slate-600 uppercase bg-transparent border-b border-slate-100 p-1 outline-none focus:border-blue-400" value={ex.laboratory} onChange={e => updateExtractedItem(idx, 'laboratory', e.target.value.toUpperCase())} />
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Stethoscope className="w-5 h-5" /></div>
                                 <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Médico Solicitante</label>
                                    <input className="w-full text-[10px] font-black text-slate-600 uppercase bg-transparent border-b border-slate-100 p-1 outline-none focus:border-blue-400" value={ex.doctorName} onChange={e => updateExtractedItem(idx, 'doctorName', e.target.value.toUpperCase())} />
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="pt-10 border-t border-slate-200 flex justify-end gap-6">
                      <button onClick={() => setExtractedExams([])} className="px-10 py-5 font-black text-slate-400 uppercase text-xs hover:text-slate-600 tracking-widest transition-colors">Descartar Tudo</button>
                      <button onClick={handleSaveExtracted} className="px-12 py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Salvar Todos os Registros</button>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-8">
                    <div 
                      className="bg-white rounded-[40px] p-10 border-4 border-dashed border-blue-100 text-center hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isAnalyzingFile ? (
                        <div className="py-16 flex flex-col items-center gap-8">
                           <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
                           <p className="font-black text-blue-600 uppercase tracking-[0.3em] text-sm animate-pulse">Lendo Documento...</p>
                        </div>
                      ) : (
                        <div className="py-16 flex flex-col items-center gap-8">
                           <div className="p-8 bg-blue-600 text-white rounded-[32px] shadow-2xl group-hover:scale-110 transition-transform">
                              <Upload className="w-10 h-10" />
                           </div>
                           <div className="space-y-2">
                              <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Digitalizar Laudo</h4>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Clique para subir PDF ou Foto</p>
                           </div>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </div>
                    <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                       <Sparkles className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10" />
                       <h4 className="text-xs font-black uppercase mb-6 flex items-center gap-3 text-blue-400"><Info className="w-5 h-5" /> Base SIGTAP</h4>
                       <div className="relative">
                          <input type="text" className="w-full bg-white/10 border border-white/20 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/30 font-black uppercase text-xs pr-16" placeholder="PESQUISAR EXAMES..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSigtapSearch()} />
                          <button onClick={handleSigtapSearch} className="absolute right-3 top-3 p-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                            {isLoadingSigtap ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                          </button>
                       </div>
                       {sigtapResults.length > 0 && (
                         <div className="mt-6 max-h-56 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                           {sigtapResults.map((ref, idx) => (
                             <button key={idx} onClick={() => selectSigtapExam(ref)} className="w-full text-left p-4 bg-white/5 hover:bg-blue-600 hover:text-white rounded-2xl transition-all border border-white/5 text-[10px] font-black uppercase flex justify-between items-center group">
                                <span className="truncate pr-4 leading-tight">{ref.name}</span>
                                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </button>
                           ))}
                         </div>
                       )}
                    </div>
                  </div>
                  <form onSubmit={handleSaveExam} className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Exame</label>
                           <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-black uppercase text-sm" value={newExam.examName} onChange={e => setNewExam({...newExam, examName: e.target.value.toUpperCase()})} placeholder="EX: GLICOSE" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Resultado</label>
                              <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-blue-600 text-sm" value={newExam.value} onChange={e => setNewExam({...newExam, value: e.target.value.toUpperCase()})} placeholder="VALOR" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unidade</label>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-slate-400 text-sm" value={newExam.unit} onChange={e => setNewExam({...newExam, unit: e.target.value.toUpperCase()})} placeholder="EX: MG/DL" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Referência</label>
                           <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-xs" value={newExam.referenceRange} onChange={e => setNewExam({...newExam, referenceRange: e.target.value.toUpperCase()})} placeholder="EX: 70 A 99" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Data</label>
                              <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} />
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Laboratório</label>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black uppercase text-xs" value={newExam.laboratory} onChange={e => setNewExam({...newExam, laboratory: e.target.value.toUpperCase()})} placeholder="LABORATÓRIO" />
                           </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-[32px] shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.2em] hover:bg-blue-700 transition-all text-sm"><Save className="w-7 h-7" /> Salvar no Histórico</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingExamRecord && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                 <h3 className="text-xl font-black uppercase tracking-widest">{isEditingRecord ? 'Editando Registro' : 'Análise Detalhada'}</h3>
                 <div className="flex items-center gap-4">
                    {isEditingRecord && (
                      <button onClick={handleSaveEdit} className="bg-white text-blue-600 px-6 py-2 rounded-full font-black text-xs uppercase shadow-lg hover:bg-blue-50 transition-all">Salvar</button>
                    )}
                    <button onClick={() => { setViewingExamRecord(null); setIsEditingRecord(false); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-8 h-8" /></button>
                 </div>
              </div>
              <div className="p-12 overflow-y-auto">
                 <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                   <div className="flex-1 w-full">
                      <h4 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-4">{viewingExamRecord.examName}</h4>
                      <div className="flex items-center gap-3">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full border ${statusTextColors[getHealthStatus(viewingExamRecord.value, viewingExamRecord.referenceRange)]} ${statusColors[getHealthStatus(viewingExamRecord.value, viewingExamRecord.referenceRange)]} bg-opacity-10`}>
                            {statusLabels[getHealthStatus(viewingExamRecord.value, viewingExamRecord.referenceRange)]}
                         </span>
                         <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{viewingExamRecord.laboratory}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-6xl font-black text-blue-600">{viewingExamRecord.value}</p>
                      <p className="text-sm font-black text-slate-400 uppercase mt-2">{viewingExamRecord.unit}</p>
                   </div>
                 </div>
                 <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600"><Printer className="w-4 h-4" /> Imprimir</button>
                    <button onClick={() => handleDeleteExam(viewingExamRecord.id)} className="text-rose-500 font-black text-[10px] uppercase tracking-widest hover:underline"><Trash2 className="w-4 h-4 inline mr-1" /> Excluir Registro</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
