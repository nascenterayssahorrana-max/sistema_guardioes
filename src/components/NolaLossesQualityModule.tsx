import React, { useState } from 'react';
import {
  AlertTriangle,
  PlusCircle,
  Download,
  Filter,
  Search,
  CheckCircle2,
  TrendingDown,
  Layers,
  PieChart as PieIcon,
  Trash2,
  FileSpreadsheet,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { NolaMovement, LossReason, SectorType, ProductCode } from '../types/finance';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

interface NolaLossesQualityModuleProps {
  onOpenAddNolaModal: () => void;
}

const SECTOR_COLORS: Record<string, string> = {
  'Cozinha Central': '#f59e0b',
  'Produção - Massas': '#ef4444',
  'Produção': '#8b5cf6',
  'Estoque Central': '#3b82f6',
  COZINHA_CENTRAL: '#f59e0b',
  PRODUCAO_MASSAS: '#ef4444',
  PRODUCAO: '#8b5cf6',
  ESTOQUE_CENTRAL: '#3b82f6',
};

export const NolaLossesQualityModule: React.FC<NolaLossesQualityModuleProps> = ({
  onOpenAddNolaModal,
}) => {
  const {
    nolaMovements,
    deleteNolaMovement,
    totalNolaLossReais,
    totalNolaDiscardedUnits,
    paretoLossReasons,
    sectorLosses,
    weeklyLossTrends,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');

  // Filtered movements
  const filteredMovements = nolaMovements.filter((m) => {
    const matchesSearch =
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lossReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.origin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'ALL' || m.sector === sectorFilter;
    const matchesProduct = productFilter === 'ALL' || m.productCode === productFilter;
    const matchesReason = reasonFilter === 'ALL' || m.lossReason === reasonFilter;

    return matchesSearch && matchesSector && matchesProduct && matchesReason;
  });

  // Prepare Pareto Chart Data
  const paretoChartData = paretoLossReasons.map((item) => ({
    name: item.reason,
    custo: Math.round(item.totalCost),
    acumulado: Number(item.cumulativePercentage.toFixed(1)),
  }));

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Semana', 'Setor', 'Código Produto', 'Produto', 'Qtd Produzida', 'Qtd Descartada', 'Custo Unitario', 'Perda Total R$', 'Motivo', 'Origem'];
    const rows = nolaMovements.map((m) => [
      m.id,
      m.week,
      m.sector,
      m.productCode,
      `"${m.productName}"`,
      m.producedUnits,
      m.discardedUnits,
      m.unitCost.toFixed(2),
      m.totalLossValue.toFixed(2),
      `"${m.lossReason}"`,
      `"${m.origin}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guardioes_lasanha_nola_perdas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Controle de Qualidade Industrial & Refugo</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Gestão de Perdas NOLA (Apontamentos S01 a S27)</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Análise dos <strong>180 registros de refugo</strong> do chão de fábrica da Guardiões da Lasanha.
              Identifique as causas-raiz prioritárias pelo Princípio de Pareto (80/20) para conter o sangramento financeiro.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              id="btn-export-nola-csv"
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onOpenAddNolaModal}
              id="btn-add-nola-main"
              className="flex items-center space-x-2 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lançar Apontamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perda Total Acumulada</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalNolaLossReais)}</div>
          <span className="text-xs text-slate-500 mt-1 block">27 semanas de produção auditadas</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidades Descartadas</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatNumber(totalNolaDiscardedUnits)} un.</div>
          <span className="text-xs text-slate-500 mt-1 block">{nolaMovements.length} apontamentos registrados</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Impacto Anualizado Estimado</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {formatCurrency(totalNolaLossReais * (52 / 27))}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Projeção 52 semanas sem correção</span>
        </div>
      </div>

      {/* Pareto 80/20 Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Gráfico de Pareto 80/20 das Perdas Industriais</h2>
            <p className="text-xs text-slate-500">
              As <strong>barras vermelhas</strong> representam o prejuízo em R$; a <strong>linha laranja</strong> mostra o percentual acumulado.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            Foco nos 80% de impacto financeiro
          </span>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoChartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `R$ ${val}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#f59e0b' }}
                unit="%"
              />
              <Tooltip
                formatter={(value: any, name: any) =>
                  name === 'Percentual Acumulado (%)' ? `${value}%` : formatCurrency(Number(value))
                }
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Bar
                yAxisId="left"
                dataKey="custo"
                name="Custo da Perda (R$)"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="acumulado"
                name="Percentual Acumulado (%)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Distribution & Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Perdas por Setor</h2>
          <p className="text-xs text-slate-500">Onde o prejuízo está ocorrendo na fábrica</p>

          <div className="space-y-3">
            {sectorLosses.map((sec) => (
              <div key={sec.sector} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{sec.sector.replace('_', ' ')}</span>
                  <span className="text-rose-600">{formatCurrency(sec.totalCost)} ({formatPercent(sec.percentage)})</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${sec.percentage}%`,
                      backgroundColor: SECTOR_COLORS[sec.sector] || '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Evolução Semanal de Perdas (S01 a S27)</h2>
          <p className="text-xs text-slate-500">Histórico de custos de refugo ao longo das semanas</p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyLossTrends} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="totalCost" name="Perda Semanal (R$)" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full 180 NOLA Records Explorer */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tabela de Apontamentos NOLA Transcritos do PDF</h2>
            <p className="text-xs text-slate-500">
              Exibindo <strong>{filteredMovements.length}</strong> de {nolaMovements.length} registros
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar motivo, produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-44 sm:w-56"
              />
            </div>

            {/* Sector Filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Todos os Setores</option>
              <option value="COZINHA_CENTRAL">Cozinha Central</option>
              <option value="PRODUCAO_MASSAS">Produção Massas</option>
              <option value="PRODUCAO">Produção</option>
              <option value="ESTOQUE_CENTRAL">Estoque Central</option>
            </select>

            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Todos os Produtos</option>
              <option value="GL001">Lasanha Bolonhesa (GL001)</option>
              <option value="RI002">Rondelli 4 Queijos (RI002)</option>
              <option value="NS003">Nhoque Batata (NS003)</option>
              <option value="RC004">Ravioli Carne (RC004)</option>
              <option value="LT005">Lasanha Titã (LT005)</option>
              <option value="RG006">Ravioli Gorgonzola (RG006)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-slate-600 font-semibold">
                <th className="py-2 px-3 text-left">ID / Sem.</th>
                <th className="py-2 px-3 text-left">Setor</th>
                <th className="py-2 px-3 text-left">Produto</th>
                <th className="py-2 px-3 text-right">Produzido</th>
                <th className="py-2 px-3 text-right">Descartado</th>
                <th className="py-2 px-3 text-right">Custo Unit.</th>
                <th className="py-2 px-3 text-right font-bold text-rose-700">Perda Total</th>
                <th className="py-2 px-3 text-left">Motivo / Causa-Raiz</th>
                <th className="py-2 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    <span className="font-bold text-slate-700">{mov.id}</span>
                    <span className="text-slate-400 ml-1">({mov.week})</span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${SECTOR_COLORS[mov.sector]}15`,
                        color: SECTOR_COLORS[mov.sector],
                      }}
                    >
                      {mov.sector.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900">
                    <span className="font-mono text-[10px] text-slate-400 mr-1">{mov.productCode}</span>
                    {mov.productName}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">{formatNumber(mov.producedUnits)}</td>
                  <td className="py-2 px-3 text-right font-bold text-rose-600">{formatNumber(mov.discardedUnits)}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(mov.unitCost)}</td>
                  <td className="py-2 px-3 text-right font-black text-rose-700 bg-rose-50/30">
                    {formatCurrency(mov.totalLossValue)}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-slate-800">{mov.lossReason}</div>
                    <div className="text-[10px] text-slate-400">{mov.origin}</div>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => deleteNolaMovement(mov.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
