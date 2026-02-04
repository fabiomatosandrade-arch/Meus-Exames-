
import React, { useState, useMemo } from 'react';
import { ExamRecord } from '../types';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line,
    ScatterChart,
    Scatter,
    ZAxis,
    AreaChart,
    Area,
    Defs,
    LinearGradient
} from 'recharts';
import { TrendingUp, Target, Maximize, Minimize, Activity, CircleDot, LineChart as LineIcon, BarChart3, Presentation } from 'lucide-react';

interface AnalyticsProps {
  exams: ExamRecord[];
}

const Analytics: React.FC<AnalyticsProps> = ({ exams }) => {
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'scatter' | 'area'>('line');

  const uniqueExams = useMemo(() => {
    return Array.from(new Set(exams.map(e => e.examName))).sort();
  }, [exams]);

  if (!selectedExamType && uniqueExams.length > 0) {
    setSelectedExamType(uniqueExams[0]);
  }

  const chartData = useMemo(() => {
    if (!selectedExamType) return [];
    return exams
      .filter(e => e.examName === selectedExamType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => {
        const numericValue = parseFloat(e.value.replace(',', '.'));
        return {
          date: new Date(e.date).toLocaleDateString('pt-BR'),
          value: numericValue,
          originalValue: e.value,
          originalDate: e.date,
          isValid: !isNaN(numericValue)
        };
      })
      .filter(d => d.isValid);
  }, [exams, selectedExamType]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    const trend = chartData.length > 1 ? (latest > values[values.length - 2] ? 'subindo' : latest < values[values.length - 2] ? 'descendo' : 'estável') : 'estável';

    return { min, max, latest, trend };
  }, [chartData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Análise Evolutiva</h2>
          <p className="text-slate-500">Acompanhe seu progresso de saúde graficamente</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            {/* Novo Seletor de Tipo de Gráfico */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                <Presentation className="w-5 h-5 text-slate-400 ml-2" />
                <select 
                    className="bg-transparent text-slate-700 font-bold outline-none pr-4 min-w-[150px] uppercase text-xs" 
                    value={chartType} 
                    onChange={(e) => setChartType(e.target.value as any)}
                >
                    <option value="line">GRÁFICO DE LINHA</option>
                    <option value="area">GRÁFICO DE ÁREA</option>
                    <option value="scatter">GRÁFICO DE PONTOS</option>
                </select>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                <BarChart3 className="w-5 h-5 text-slate-400 ml-2" />
                <select className="bg-transparent text-slate-700 font-bold outline-none pr-4 min-w-[180px] uppercase text-xs" value={selectedExamType} onChange={(e) => setSelectedExamType(e.target.value)}>
                    {uniqueExams.map(name => <option key={name} value={name}>{name.toUpperCase()}</option>)}
                </select>
            </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase mb-4"><Target className="w-4 h-4 text-blue-500" /> Último Resultado</div>
                <div className="text-4xl font-black text-blue-600">{stats?.latest}<span className="text-base font-medium text-slate-400 ml-2">{exams.find(e => e.examName === selectedExamType)?.unit}</span></div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase mb-3"><Maximize className="w-4 h-4 text-rose-500" /> Resultado Maior</div>
                    <div className="text-2xl font-black text-slate-800">{stats?.max}</div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase mb-3"><Minimize className="w-4 h-4 text-emerald-500" /> Resultado Menor</div>
                    <div className="text-2xl font-black text-slate-800">{stats?.min}</div>
                </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm min-h-[450px] relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase">{selectedExamType} <span className="text-slate-300 font-medium">| {chartType === 'line' ? 'Evolução' : chartType === 'area' ? 'Tendência' : 'Coletas'}</span></h3>
            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                          <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700}} />
                          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} dot={{r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0}} animationDuration={1500} />
                      </LineChart>
                    ) : chartType === 'area' ? (
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700}} />
                        <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500} />
                      </AreaChart>
                    ) : (
                      <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                        <YAxis dataKey="value" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-10} />
                        <ZAxis type="number" range={[100, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700}} />
                        <Scatter name={selectedExamType} data={chartData} fill="#2563eb" animationDuration={1000} />
                      </ScatterChart>
                    )}
                </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[48px] border border-dashed border-slate-200 text-center">
             <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-500 text-lg font-medium uppercase tracking-widest">{uniqueExams.length > 0 ? 'Dados insuficientes.' : 'Nenhum exame cadastrado.'}</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
