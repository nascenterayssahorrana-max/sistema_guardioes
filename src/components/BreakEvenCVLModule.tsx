import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Target,
  Coins,
  Calendar,
  Layers,
  HelpCircle,
  ArrowRight,
  Info,
  Sliders,
  DollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

export const BreakEvenCVLModule: React.FC = () => {
  const {
    totalFixedCosts,
    totalDisbursableFixedCosts,
    targetMonthlyProfit,
    setTargetMonthlyProfit,
    workingDaysMonth,
    setWorkingDaysMonth,
    weightedMCPercent,
    averageUnitMC,
    averageUnitPrice,
    pecReais,
    pecUnits,
    peeReais,
    peeUnits,
    pefReais,
    pefUnits,
    currentDRE,
    marginOfSafetyReais,
    marginOfSafetyPercent,
    dailyTargetPEC,
    dailyTargetPEE,
  } = useFinance();

  const [simulatedUnits, setSimulatedUnits] = useState<number>(pecUnits > 0 ? Math.round(pecUnits * 1.3) : 5000);

  // Generate CVL Chart curve data points
  const maxUnits = Math.max(peeUnits * 1.5, 8000);
  const step = Math.ceil(maxUnits / 10);
  const cvlChartData = [];

  const avgCostVarUnit = averageUnitPrice - averageUnitMC;

  for (let q = 0; q <= maxUnits; q += step) {
    const revenue = q * averageUnitPrice;
    const totalCost = totalFixedCosts + q * avgCostVarUnit;
    const totalCostWithProfit = totalFixedCosts + targetMonthlyProfit + q * avgCostVarUnit;
    const totalCostFinancial = totalDisbursableFixedCosts + q * avgCostVarUnit;

    cvlChartData.push({
      units: q,
      ReceitaTotal: Math.round(revenue),
      CustoTotalContabil: Math.round(totalCost),
      CustoTotalEconomico: Math.round(totalCostWithProfit),
      CustoTotalFinanceiro: Math.round(totalCostFinancial),
      CustoFixoContabil: Math.round(totalFixedCosts),
    });
  }

  // Interactive slider calculation for custom quantity
  const customRevenue = simulatedUnits * averageUnitPrice;
  const customTotalVar = simulatedUnits * avgCostVarUnit;
  const customMC = customRevenue - customTotalVar;
  const customProfit = customMC - totalFixedCosts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sky-600 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Análise Custo-Volume-Lucro (CVL)</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pontos de Equilíbrio: Contábil, Econômico e Financeiro</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Descubra o volume exato de vendas em reais (R$) e em unidades de massas que a fábrica precisa comercializar
              para cobrir custos, honrar compromissos de caixa e atingir a meta de lucro estipulada.
            </p>
          </div>

          {/* Quick Settings: Target Profit & Working Days */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="text-[11px] text-slate-500 block font-semibold mb-0.5">Meta Lucro Mensal:</label>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  value={targetMonthlyProfit}
                  onChange={(e) => setTargetMonthlyProfit(Number(e.target.value))}
                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 text-xs"
                  step={1000}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block font-semibold mb-0.5">Dias Úteis/Mês:</label>
              <select
                value={workingDaysMonth}
                onChange={(e) => setWorkingDaysMonth(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 text-xs"
              >
                <option value={20}>20 dias</option>
                <option value={22}>22 dias (Padrão)</option>
                <option value={26}>26 dias (Sábados)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Break-Even Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. PEC - Ponto de Equilíbrio Contábil */}
        <div className="bg-white rounded-2xl p-5 border-2 border-sky-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-sky-700 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">1. P.E. Contábil (PEC)</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Lucro Zero</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cobre 100% dos Custos e Despesas Fixas ({formatCurrency(totalFixedCosts)}).
            </p>

            <div className="my-4 bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 space-y-1">
              <div className="text-2xl font-black text-sky-900">{formatCurrency(pecReais)}</div>
              <div className="text-xs font-bold text-sky-700 flex items-center space-x-1">
                <span>{formatNumber(pecUnits)} unidades de massa</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Meta Diária ({workingDaysMonth} dias):</span>
              <strong className="text-slate-800">{formatCurrency(dailyTargetPEC)}/dia</strong>
            </div>
            <div className="flex justify-between">
              <span>Volume Diário:</span>
              <strong className="text-slate-800">{formatNumber(pecUnits / workingDaysMonth)} un/dia</strong>
            </div>
          </div>
        </div>

        {/* 2. PEE - Ponto de Equilíbrio Econômico */}
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 mb-2">
              <Target className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">2. P.E. Econômico (PEE)</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Com Meta de Lucro</h3>
            <p className="text-xs text-slate-500 mt-1">
              Custos Fixos + Meta de Lucro de {formatCurrency(targetMonthlyProfit)}.
            </p>

            <div className="my-4 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 space-y-1">
              <div className="text-2xl font-black text-emerald-900">{formatCurrency(peeReais)}</div>
              <div className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                <span>{formatNumber(peeUnits)} unidades de massa</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Meta Diária ({workingDaysMonth} dias):</span>
              <strong className="text-slate-800">{formatCurrency(dailyTargetPEE)}/dia</strong>
            </div>
            <div className="flex justify-between">
              <span>Volume Diário:</span>
              <strong className="text-slate-800">{formatNumber(peeUnits / workingDaysMonth)} un/dia</strong>
            </div>
          </div>
        </div>

        {/* 3. PEF - Ponto de Equilíbrio Financeiro */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-amber-700 mb-2">
              <Coins className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">3. P.E. Financeiro (PEF)</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Caixa / Desembolsável</h3>
            <p className="text-xs text-slate-500 mt-1">
              Exclui depreciação contábil não desembolsada ({formatCurrency(totalFixedCosts - totalDisbursableFixedCosts)}).
            </p>

            <div className="my-4 bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 space-y-1">
              <div className="text-2xl font-black text-amber-900">{formatCurrency(pefReais)}</div>
              <div className="text-xs font-bold text-amber-700 flex items-center space-x-1">
                <span>{formatNumber(pefUnits)} unidades de massa</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Custos Desembolsáveis:</span>
              <strong className="text-slate-800">{formatCurrency(totalDisbursableFixedCosts)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Alívio de Caixa vs PEC:</span>
              <strong className="text-emerald-600">-{formatCurrency(pecReais - pefReais)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic CVL Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Gráfico Interativo de Análise CVL (Custo x Volume x Lucro)</h2>
            <p className="text-xs text-slate-500">
              O ponto de cruzamento entre a <strong>Linha Verde (Receita)</strong> e a <strong>Linha Vermelha (Custo Total)</strong> é o PEC.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-emerald-500" />
              <span className="text-slate-600">Receita Total</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-rose-500" />
              <span className="text-slate-600">Custo Contábil</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-amber-500" />
              <span className="text-slate-600">Custo c/ Meta Lucro</span>
            </span>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cvlChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="units"
                tick={{ fontSize: 11, fill: '#64748b' }}
                label={{ value: 'Volume Produzido / Vendido (Unidades de Massa)', position: 'bottom', offset: 0, fontSize: 12, fill: '#64748b' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: number) => formatCurrency(val)}
                labelFormatter={(label) => `${formatNumber(Number(label))} unidades`}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />

              <Line
                type="monotone"
                dataKey="ReceitaTotal"
                name="Receita Total (RT)"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="CustoTotalContabil"
                name="Custo Total Contábil (CT)"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="CustoTotalEconomico"
                name="Custo Total + Meta Lucro (PEE)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="CustoFixoContabil"
                name="Custo Fixo Total (CFT)"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Volume Simulator & Margin of Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin of Safety (MS) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Margem de Segurança Operacional (MS)</h2>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                marginOfSafetyReais >= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {marginOfSafetyReais >= 0 ? 'Operação Segura' : 'Alerta de Prejuízo'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            A Margem de Segurança indica quanto o faturamento atual da Guardiões da Lasanha pode cair antes de a empresa entrar no prejuízo.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 block uppercase font-bold">Margem de Segurança (R$)</span>
              <span className={`text-lg font-extrabold ${marginOfSafetyReais >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(marginOfSafetyReais)}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 block uppercase font-bold">Margem de Segurança (%)</span>
              <span className={`text-lg font-extrabold ${marginOfSafetyPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatPercent(marginOfSafetyPercent)}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 font-mono">
            <p>
              MS (R$) = Receita Atual ({formatCurrency(currentDRE.grossRevenue)}) - P.E. Contábil ({formatCurrency(pecReais)}) = <strong className="text-slate-900">{formatCurrency(marginOfSafetyReais)}</strong>
            </p>
          </div>
        </div>

        {/* Interactive Production Simulator */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Simulador de Volume & Lucro</h2>
            <Sliders className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-slate-500">
            Arraste para simular o resultado operacional para diferentes volumes mensais de vendas.
          </p>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Volume Mensal Simulado:</span>
              <span className="text-amber-600 font-bold">{formatNumber(simulatedUnits)} unidades</span>
            </div>
            <input
              type="range"
              min={1000}
              max={15000}
              step={100}
              value={simulatedUnits}
              onChange={(e) => setSimulatedUnits(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Receita Bruta</span>
              <span className="font-bold text-slate-900 text-sm">{formatCurrency(customRevenue)}</span>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-amber-800 block text-[10px] uppercase font-bold">Margem Contrib.</span>
              <span className="font-bold text-amber-900 text-sm">{formatCurrency(customMC)}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${customProfit >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
              <span className="block text-[10px] uppercase font-bold">Lucro Operacional</span>
              <span className="font-bold text-sm">{formatCurrency(customProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
