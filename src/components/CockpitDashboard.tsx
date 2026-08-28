import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Target,
  Sparkles,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  BarChart3,
  Layers,
  PieChart as PieIcon,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { TabType } from './Navbar';

interface CockpitDashboardProps {
  onNavigate: (tab: TabType) => void;
  onOpenSaleModal: () => void;
  onOpenNolaModal: () => void;
  onOpenCostModal: () => void;
}

export const CockpitDashboard: React.FC<CockpitDashboardProps> = ({
  onNavigate,
  onOpenSaleModal,
  onOpenNolaModal,
  onOpenCostModal,
}) => {
  const {
    currentDRE,
    pecReais,
    pecUnits,
    peeReais,
    peeUnits,
    pefReais,
    weightedMCPercent,
    totalNolaLossReais,
    totalNolaDiscardedUnits,
    marginOfSafetyReais,
    marginOfSafetyPercent,
    dailyTargetPEC,
    productCalculations,
    paretoLossReasons,
    sales,
  } = useFinance();

  // Progress towards Break-Even (PEC)
  const breakEvenProgress = pecReais > 0 ? Math.min((currentDRE.grossRevenue / pecReais) * 100, 150) : 0;
  const isPastBreakEven = currentDRE.grossRevenue >= pecReais && pecReais > 0;

  // Chart data for Sales mix
  const b2cSales = sales.filter((s) => s.channel === 'B2C');
  const b2bSales = sales.filter((s) => s.channel === 'B2B');
  const totalB2CRev = b2cSales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalB2BRev = b2bSales.reduce((acc, s) => acc + s.totalRevenue, 0);

  const channelMixData = [
    { name: 'B2C (Varejo / Direto)', value: totalB2CRev, color: '#10b981' },
    { name: 'B2B (Atacado / Foodservice)', value: totalB2BRev, color: '#3b82f6' },
  ];

  // Pareto Top 3 loss reasons
  const topLosses = paretoLossReasons.slice(0, 3);

  // Product loss ranking
  const productLossList = Object.values(productCalculations)
    .map((pc) => ({
      name: pc.product.name,
      code: pc.product.code,
      allocatedLoss: pc.allocatedLossPerUnit,
      totalLoss: pc.totalLossCostNola,
      realCost: pc.realVariableCost,
      mcPercentB2C: pc.mcPercentB2C,
      mcPercentB2B: pc.mcPercentB2B,
    }))
    .sort((a, b) => b.totalLoss - a.totalLoss);

  return (
    <div className="space-y-6">
      {/* Welcome & Guided Journey Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Painel Integrado de Gestão • Guardiões da Lasanha</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Cockpit Executivo & Termômetro Operacional
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Monitore a esteira completa: <strong>Custos Reais com Perdas NOLA</strong> ➔{' '}
              <strong>Precificação B2C/B2B</strong> ➔ <strong>Ponto de Equilíbrio (CVL)</strong> ➔{' '}
              <strong>Meta de Lucro Líquido</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenSaleModal}
              id="btn-dash-sale"
              className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lançar Venda</span>
            </button>
            <button
              onClick={onOpenNolaModal}
              id="btn-dash-nola"
              className="flex items-center space-x-2 px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Lançar Perda NOLA</span>
            </button>
            <button
              onClick={() => onNavigate('guide')}
              id="btn-dash-guide"
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Guia Didático</span>
            </button>
          </div>
        </div>

        {/* 5-Step Journey Navigation Breadcrumbs */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <button
            onClick={() => onNavigate('pricing')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left group cursor-pointer"
          >
            <span className="text-slate-300 group-hover:text-amber-400 font-medium">1. Produtos & Custos</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
          </button>
          <button
            onClick={() => onNavigate('fixed-costs')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left group cursor-pointer"
          >
            <span className="text-slate-300 group-hover:text-amber-400 font-medium">2. Custos Fixos</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
          </button>
          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left group cursor-pointer"
          >
            <span className="text-slate-300 group-hover:text-amber-400 font-medium">3. Vendas & Canais</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
          </button>
          <button
            onClick={() => onNavigate('breakeven')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left group cursor-pointer"
          >
            <span className="text-slate-300 group-hover:text-amber-400 font-medium">4. Ponto Equilíbrio</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
          </button>
          <button
            onClick={() => onNavigate('nola')}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left group cursor-pointer"
          >
            <span className="text-slate-300 group-hover:text-amber-400 font-medium">5. Perdas NOLA</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
          </button>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Registrado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento Atual</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(currentDRE.grossRevenue)}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{sales.length} vendas registradas</span>
              <span>•</span>
              <span>Líquido: {formatCurrency(currentDRE.netRevenue)}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Meta Diária PEC:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(dailyTargetPEC)}/dia</span>
          </div>
        </div>

        {/* Card 2: Margem de Contribuição Média */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MC Média Ponderada</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatPercent(weightedMCPercent)}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
              <span className="text-amber-600 font-semibold">
                {formatCurrency(currentDRE.contributionMargin)}
              </span>
              <span>gerados para cobrir custos fixos</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Saúde da Margem:</span>
            <span className="font-semibold text-emerald-600">
              {weightedMCPercent >= 35 ? 'Excelente (>35%)' : 'Atenção (<35%)'}
            </span>
          </div>
        </div>

        {/* Card 3: Ponto de Equilíbrio Contábil (PEC) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">P.E. Contábil (PEC)</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(pecReais)}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
              <span className="text-sky-600 font-semibold">{formatNumber(pecUnits)} unidades</span>
              <span>necessárias p/ lucro zero</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>PE Econômico (c/ lucro):</span>
            <span className="font-semibold text-slate-800">{formatCurrency(peeReais)}</span>
          </div>
        </div>

        {/* Card 4: Perdas NOLA Acumuladas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perdas NOLA (27 sem.)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {formatCurrency(totalNolaLossReais)}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
              <span className="text-rose-600 font-semibold">{formatNumber(totalNolaDiscardedUnits)} un.</span>
              <span>descartadas no chão de fábrica</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Projeção Anual:</span>
            <span className="font-semibold text-rose-700">
              {formatCurrency(totalNolaLossReais * (52 / 27))}/ano
            </span>
          </div>
        </div>
      </div>

      {/* Break-Even Thermometer (Visual Gauge) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">Termômetro da Operação: Faturamento vs. Ponto de Equilíbrio</h2>
              {isPastBreakEven ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Zona de Lucro
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <Flame className="w-3.5 h-3.5 mr-1" /> Fase de Cobertura de Custos
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização didática: enquanto o faturamento não atinge o PEC, a fábrica opera em prejuízo para pagar as contas fixas.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Margem de Segurança:</span>
            <div className={`text-sm font-bold ${marginOfSafetyReais >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(marginOfSafetyReais)} ({formatPercent(marginOfSafetyPercent)})
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden p-1 relative flex items-center border border-slate-200">
            {/* PEC target line at ~66% mark or dynamic */}
            <div
              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[11px] font-bold text-white ${
                isPastBreakEven
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600 shadow-xs'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${Math.max(Math.min(breakEvenProgress, 100), 5)}%` }}
            >
              {breakEvenProgress.toFixed(0)}%
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-500 px-1 font-medium">
            <span>R$ 0,00</span>
            <span className="text-sky-700 font-bold">PEC: {formatCurrency(pecReais)} (Zero a Zero)</span>
            <span className="text-emerald-700 font-bold">PEE (Meta): {formatCurrency(peeReais)}</span>
          </div>
        </div>
      </div>

      {/* DRE Sintético & Mix de Canais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DRE Sintético (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">DRE Gerencial Sintético (Demonstrativo de Resultado)</h2>
              <p className="text-xs text-slate-500">Custeio por absorção das perdas NOLA no CPV</p>
            </div>
            <button
              onClick={() => onNavigate('breakeven')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver Análise CVL</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {/* 1. Receita Bruta */}
            <div className="py-2.5 flex items-center justify-between font-semibold text-slate-900">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>(+) Receita Bruta de Vendas</span>
              </span>
              <span>{formatCurrency(currentDRE.grossRevenue)}</span>
            </div>

            {/* 2. Impostos */}
            <div className="py-2 flex items-center justify-between text-slate-600 pl-4 text-xs">
              <span>(-) Impostos sobre Vendas (Simples/ICMS)</span>
              <span className="text-rose-600">-{formatCurrency(currentDRE.taxes)}</span>
            </div>

            {/* 3. Receita Líquida */}
            <div className="py-2.5 flex items-center justify-between font-semibold text-slate-800 bg-slate-50/50 px-2 rounded-lg">
              <span>(=) Receita Operacional Líquida</span>
              <span>{formatCurrency(currentDRE.netRevenue)}</span>
            </div>

            {/* 4. CPV Base (Insumos + Embalagens + MOD) */}
            <div className="py-2 flex items-center justify-between text-slate-600 pl-4 text-xs">
              <span>(-) Custos dos Produtos Vendidos (Insumos + Embalagens + MOD)</span>
              <span className="text-rose-600">-{formatCurrency(currentDRE.variableCostsCPV)}</span>
            </div>

            {/* 5. Perdas NOLA Alocadas */}
            <div className="py-2 flex items-center justify-between text-slate-700 pl-4 text-xs bg-amber-50/60 border-l-2 border-amber-500 my-1 px-2 rounded">
              <span className="flex items-center space-x-1">
                <span className="font-semibold text-amber-900">(-) Perdas NOLA Alocadas ao CPV</span>
                <span className="text-[10px] text-amber-700">(Refugo rateado nas unidades vendidas)</span>
              </span>
              <span className="font-semibold text-rose-600">-{formatCurrency(currentDRE.allocatedLosses)}</span>
            </div>

            {/* 6. Margem de Contribuição */}
            <div className="py-2.5 flex items-center justify-between font-bold text-amber-950 bg-amber-100/40 px-2 rounded-lg border border-amber-200/50">
              <span className="flex items-center space-x-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <span>(=) Margem de Contribuição Total</span>
              </span>
              <div className="text-right">
                <div>{formatCurrency(currentDRE.contributionMargin)}</div>
                <div className="text-[11px] font-normal text-amber-800">{formatPercent(currentDRE.contributionMarginPercent)} da Receita</div>
              </div>
            </div>

            {/* 7. Custos Fixos */}
            <div className="py-2 flex items-center justify-between text-slate-600 pl-4 text-xs">
              <span>(-) Custos & Despesas Fixas Totais</span>
              <span className="text-rose-600">-{formatCurrency(currentDRE.fixedCostsTotal)}</span>
            </div>

            {/* 8. Lucro Operacional */}
            <div
              className={`py-3 flex items-center justify-between font-extrabold text-base px-3 rounded-xl border ${
                currentDRE.operationalProfit >= 0
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <span>(=) Lucro Operacional Líquido</span>
              <div className="text-right">
                <div>{formatCurrency(currentDRE.operationalProfit)}</div>
                <div className="text-xs font-semibold">
                  {formatPercent(currentDRE.operationalProfitPercent)} da Receita
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mix de Canais & Resumo Rápido (1 col) */}
        <div className="space-y-6">
          {/* Channel Mix Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Mix de Vendas por Canal</h2>
            <p className="text-xs text-slate-500 mb-4">B2C (Varejo Alto Valor) vs. B2B (Escala)</p>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {channelMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-emerald-50/70 rounded-lg">
                <span className="text-emerald-700 font-semibold block">B2C (Direto)</span>
                <span className="text-slate-900 font-bold">{formatCurrency(totalB2CRev)}</span>
                <span className="text-[10px] text-slate-500 block">Margem ~49%</span>
              </div>
              <div className="p-2 bg-blue-50/70 rounded-lg">
                <span className="text-blue-700 font-semibold block">B2B (Atacado)</span>
                <span className="text-slate-900 font-bold">{formatCurrency(totalB2BRev)}</span>
                <span className="text-[10px] text-slate-500 block">Margem ~30%</span>
              </div>
            </div>
          </div>

          {/* Top 3 Loss Causes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900">Vilões de Perdas (Top 3)</h2>
              <button
                onClick={() => onNavigate('nola')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center cursor-pointer"
              >
                <span>Ver Pareto</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Conforme dados NOLA S01 a S27</p>

            <div className="space-y-2.5">
              {topLosses.map((item, idx) => (
                <div key={item.reason} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800 block">{item.reason}</span>
                      <span className="text-[10px] text-slate-500">{item.totalUnits} unidades</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600">{formatCurrency(item.totalCost)}</span>
                    <span className="text-[10px] text-slate-400 block">{formatPercent(item.percentage)} do total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Cost & Margin Summary Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Produtos da Guardiões da Lasanha: Custo Real & Margens</h2>
            <p className="text-xs text-slate-500">
              Cada produto tem sua perda de fábrica alocada diretamente no custo unitário.
            </p>
          </div>
          <button
            onClick={() => onNavigate('pricing')}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>Gerenciar Fichas Técnicas & Preços</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 text-left">Código / Produto</th>
                <th className="py-2.5 px-3 text-right">Custo Insumos + MOD</th>
                <th className="py-2.5 px-3 text-right bg-amber-50/70 text-amber-900">Perda NOLA Alocada</th>
                <th className="py-2.5 px-3 text-right font-bold">Custo Real Total</th>
                <th className="py-2.5 px-3 text-right text-emerald-800 bg-emerald-50/50">Preço B2C (MC%)</th>
                <th className="py-2.5 px-3 text-right text-blue-800 bg-blue-50/50">Preço B2B (MC%)</th>
                <th className="py-2.5 px-3 text-right">Perda Total 27 sem.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productLossList.map((item) => {
                const prod = productCalculations[item.code as any];
                const baseCostDirect = prod.product.baseCost + prod.product.packagingCost + prod.product.directLaborCost + prod.product.otherVariableCost;
                return (
                  <tr key={item.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <span className="font-mono text-[11px] text-slate-400 mr-1.5">{item.code}</span>
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatCurrency(baseCostDirect)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-800 bg-amber-50/40">
                      +{formatCurrency(item.allocatedLoss)}/un
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.realCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right bg-emerald-50/30">
                      <span className="font-semibold text-slate-900">{formatCurrency(prod.product.priceB2C)}</span>
                      <span className="text-[10px] text-emerald-700 ml-1 font-bold">({formatPercent(item.mcPercentB2C)})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right bg-blue-50/30">
                      <span className="font-semibold text-slate-900">{formatCurrency(prod.product.priceB2B)}</span>
                      <span className="text-[10px] text-blue-700 ml-1 font-bold">({formatPercent(item.mcPercentB2B)})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-600">
                      {formatCurrency(item.totalLoss)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
