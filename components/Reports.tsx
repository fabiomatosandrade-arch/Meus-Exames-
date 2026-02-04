
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ExamRecord, Doctor, Laboratory } from '../types';
import { getHealthStatus, statusLabels } from './Exams';
import { 
  Download, 
  Filter, 
  Search, 
  Printer, 
  ChevronDown, 
  FileSpreadsheet, 
  X, 
  Check, 
  Square, 
  CheckSquare,
  Activity
} from 'lucide-react';

interface ReportsProps {
  exams: ExamRecord[];
  doctors: Doctor[];
  laboratories: Laboratory[];
}

const statusColors: Record<string, string> = {
  success: 'bg-emerald-500', 
  warning: 'bg-amber-500', 
  danger: 'bg-rose-500', 
  neutral: 'bg-slate-300'
};

const Reports: React.FC<ReportsProps> = ({ exams, doctors, laboratories }) => {
  const [filter, setFilter] = useState({
    examNames: [] as string[],
    laboratory: '',
    doctorName: '',
    dateStart: '',
    dateEnd: ''
  });
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const examDropdownRef = useRef<HTMLDivElement>(null);

  const uniqueExams = useMemo(() => Array.from(new Set(exams.map(e => e.examName))).sort(), [exams]);
  
  const uniqueLabs = useMemo(() => laboratories.length > 0 
    ? Array.from(new Set(laboratories.map(l => l.name))).sort()
    : Array.from(new Set(exams.map(e => e.laboratory))).sort(), 
  [laboratories, exams]);

  const uniqueDocs = useMemo(() => doctors.length > 0 
    ? Array.from(new Set(doctors.map(d => d.name))).sort() 
    : Array.from(new Set(exams.map(e => e.doctorName))).sort(), 
  [doctors, exams]);

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchName = filter.examNames.length === 0 || filter.examNames.includes(exam.examName);
      const matchLab = filter.laboratory === '' || exam.laboratory === filter.laboratory;
      const matchDoc = filter.doctorName === '' || exam.doctorName === filter.doctorName;
      
      let matchDate = true;
      if (filter.dateStart) matchDate = matchDate && new Date(exam.date) >= new Date(filter.dateStart);
      if (filter.dateEnd) matchDate = matchDate && new Date(exam.date) <= new Date(filter.dateEnd);
      
      return matchName && matchLab && matchDoc && matchDate;
    });
  }, [exams, filter]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Exame', 'Resultado', 'Unidade', 'Referencia', 'Status', 'Laboratorio', 'Medico'];
    const rows = filteredExams.map(exam => [
      new Date(exam.date).toLocaleDateString('pt-BR'),
      exam.examName,
      exam.value,
      exam.unit,
      exam.referenceRange,
      statusLabels[getHealthStatus(exam.value, exam.referenceRange)],
      exam.laboratory,
      exam.doctorName
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_exames_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExamSelection = (name: string) => {
    setFilter(prev => {
      const isSelected = prev.examNames.includes(name);
      if (isSelected) {
        return { ...prev, examNames: prev.examNames.filter(n => n !== name) };
      } else {
        return { ...prev, examNames: [...prev.examNames, name] };
      }
    });
  };

  const clearExams = () => setFilter({ ...filter, examNames: [] });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examDropdownRef.current && !examDropdownRef.current.contains(event.target as Node)) {
        setShowExamDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:bg-white print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-slate-500">Filtre e exporte seus registros laboratoriais</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg uppercase tracking-widest text-xs"
            >
                <FileSpreadsheet className="w-5 h-5" />
                Exportar CSV
            </button>
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg uppercase tracking-widest text-xs"
            >
                <Printer className="w-5 h-5" />
                Imprimir / PDF
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-2 font-bold text-slate-700 mb-6">
            <Filter className="w-5 h-5 text-blue-600" />
            Opções de Filtro
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="relative" ref={examDropdownRef}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exames (Seleção Múltipla)</label>
                <button 
                    onClick={() => setShowExamDropdown(!showExamDropdown)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase flex items-center justify-between transition-all"
                >
                    <span className="truncate pr-2">
                      {filter.examNames.length === 0 
                        ? 'TODOS OS EXAMES' 
                        : `${filter.examNames.length} SELECIONADO(S)`}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExamDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showExamDropdown && (
                  <div className="absolute z-50 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opções de Exame</span>
                       {filter.examNames.length > 0 && (
                         <button onClick={clearExams} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Limpar</button>
                       )}
                    </div>
                    <div className="max-h-64 overflow-y-auto py-2">
                       {uniqueExams.length === 0 ? (
                         <div className="p-4 text-center text-xs text-slate-400 italic">Nenhum exame disponível</div>
                       ) : uniqueExams.map(name => {
                         const isSelected = filter.examNames.includes(name);
                         return (
                           <button 
                             key={name}
                             onClick={() => toggleExamSelection(name)}
                             className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                           >
                             {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                             <span className={`text-xs font-bold uppercase tracking-tight ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{name}</span>
                           </button>
                         );
                       })}
                    </div>
                  </div>
                )}
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Laboratório</label>
                <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase"
                    value={filter.laboratory}
                    onChange={(e) => setFilter({...filter, laboratory: e.target.value})}
                >
                    <option value="">TODOS OS LABS</option>
                    {uniqueLabs.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Médico</label>
                <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase"
                    value={filter.doctorName}
                    onChange={(e) => setFilter({...filter, doctorName: e.target.value})}
                >
                    <option value="">TODOS OS MÉDICOS</option>
                    {uniqueDocs.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">De</label>
                <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    value={filter.dateStart}
                    onChange={(e) => setFilter({...filter, dateStart: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Até</label>
                <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    value={filter.dateEnd}
                    onChange={(e) => setFilter({...filter, dateEnd: e.target.value})}
                />
            </div>
        </div>

        {filter.examNames.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest self-center mr-2">Filtros ativos:</span>
            {filter.examNames.map(name => (
              <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tight border border-blue-100">
                {name}
                <button onClick={() => toggleExamSelection(name)} className="hover:text-blue-800 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="p-10 hidden print:block text-center border-b border-slate-200">
           <h1 className="text-3xl font-black text-blue-600 uppercase tracking-tight">Relatório de Exames Laboratoriais</h1>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Documento gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Exame</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Referência</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Laboratório</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => {
                    const status = getHealthStatus(exam.value, exam.referenceRange);
                    return (
                        <tr key={exam.id} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                            <td className="px-6 py-4 text-xs text-slate-600 font-bold whitespace-nowrap">
                                {new Date(exam.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-black text-slate-800 uppercase">{exam.examName}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-black text-blue-600">{exam.value} <span className="font-normal text-slate-400">{exam.unit}</span></div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase">{exam.referenceRange}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex justify-center">
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${status === 'success' ? 'bg-emerald-50 text-emerald-600' : status === 'warning' ? 'bg-amber-50 text-amber-600' : status === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`}></div>
                                        {statusLabels[status]}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-xs text-slate-600 font-bold uppercase">{exam.laboratory}</div>
                            </td>
                        </tr>
                    );
                })
              ) : (
                <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">
                        Nenhum registro encontrado para os filtros selecionados.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
