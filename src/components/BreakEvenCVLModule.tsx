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
  AlertTriangle,
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
import { DEMO_DATA_CONTEXT } from '../data';

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
    breakEvenStatus,
  } = useFinance();

  const hasValidBreakEven = breakEvenStatus === 'valid';
  const breakEvenMessage = breakEvenStatus === 'non_positive_mc'
    ? 'Com a margem de contribuição atual, o aumento das vendas não é suficiente para atingir o equilíbrio. É necessário melhorar preço, mix ou custos variáveis.'
    : breakEvenStatus === 'mc_near_zero'
      ? 'A margem de contribuição está muito próxima de zero. O ponto de equilíbrio calculado não é estável o suficiente para uma decisão gerencial.'
      : 'Não há vendas suficientes para calcular o ponto de equilíbrio com o mix atual.';

  const [simulatedUnits, setSimulatedUnits] = useState<number>(hasValidBreakEven ? Math.round(pecUnits * 1.3) : 5000);

  // Generate CVL Chart curve data points
  const maxUnits = hasValidBreakEven ? Math.max(peeUnits * 1.5, 8000) : 0;
  const step = hasValidBreakEven ? Math.max(1, Math.ceil(maxUnits / 10)) : 1;
  const cvlChartData = [];

  const avgCostVarUnit = averageUnitPrice - averageUnitMC;

  for (let q = 0; hasValidBreakEven && q <= maxUnits; q += step) {
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

  const UnavailableBreakEvenValue = () => (
    <div className="my-4 bg-[#FFF0EA] p-3.5 rounded-xl border border-[#FFB79B] space-y-1">
      <div className="text-base font-black text-[#962006]">Não atingível</div>
      <p className="text-[11px] leading-relaxed text-[#691603]">{breakEvenMessage}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#087B9F] text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Análise Custo-Volume-Lucro (CVL)</span>
            </div>
            <h1 className="text-xl font-bold text-[#111111]">Pontos de Equilíbrio: Contábil, Econômico e Financeiro</h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-3xl">
              Descubra o volume exato de vendas em reais (R$) e em unidades de massas que a fábrica precisa comercializar
              para cobrir custos, honrar compromissos de caixa e atingir a meta de lucro estipulada.
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">{DEMO_DATA_CONTEXT.breakEvenPremise}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
              Premissa de leitura: custos fixos com referência mensal, índice de MC pela metodologia atual e mix das vendas demonstrativas de <strong>25–29/08/2026</strong>. Esses cinco dias não representam, por si só, uma projeção mensal.
            </p>
          </div>

          {/* Quick Settings: Target Profit & Working Days */}
          <div className="flex flex-wrap items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs">
            <div>
              <label className="text-[11px] text-neutral-500 block font-semibold mb-0.5">Meta Lucro Mensal:</label>
              <div className="flex items-center space-x-1">
                <span className="text-neutral-400 font-bold">R$</span>
                <input
                  type="number"
                  value={targetMonthlyProfit}
                  onChange={(e) => setTargetMonthlyProfit(Number(e.target.value))}
                  className="w-24 px-2 py-1 bg-white border border-neutral-300 rounded-md font-bold text-neutral-800 text-xs"
                  step={1000}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-500 block font-semibold mb-0.5">Dias Úteis/Mês:</label>
              <select
                value={workingDaysMonth}
                onChange={(e) => setWorkingDaysMonth(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-neutral-300 rounded-md font-bold text-neutral-800 text-xs"
              >
                <option value={20}>20 dias</option>
                <option value={22}>22 dias (Padrão)</option>
                <option value={26}>26 dias (Sábados)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {!hasValidBreakEven && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#FFB79B] bg-[#FFF0EA] p-4 text-[#691603]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C92F0A]" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide">{breakEvenStatus === 'insufficient_data' ? 'Dados insuficientes para calcular o ponto de equilíbrio' : 'Ponto de equilíbrio não atingível'}</h2>
            <p className="mt-1 text-xs leading-relaxed">{breakEvenMessage}</p>
          </div>
        </div>
      )}

      {/* The 3 Break-Even Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. PEC - Ponto de Equilíbrio Contábil */}
        <div className="bg-white rounded-2xl p-5 border-2 border-[#A7E5F2] shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#EAF9FD] rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-[#08627F] mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">1. P.E. Contábil (PEC)</span>
            </div>
            <h3 className="font-bold text-[#111111] text-base">Lucro Zero</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Cobre 100% dos Custos e Despesas Fixas ({formatCurrency(totalFixedCosts)}).
            </p>

            {hasValidBreakEven ? (
              <div className="my-4 bg-[#EAF9FD]/70 p-3.5 rounded-xl border border-[#CFF2FA] space-y-1">
                <div className="text-2xl font-black text-[#043342]">{formatCurrency(pecReais)}</div>
                <div className="text-xs font-bold text-[#08627F] flex items-center space-x-1">
                  <span>{formatNumber(pecUnits)} unidades equivalentes no mix atual</span>
                </div>
                <p className="pt-1 text-[11px] leading-relaxed text-[#06495E]">Faturamento bruto necessário para cobrir os custos fixos, considerando o índice de MC e o mix atual.</p>
              </div>
            ) : <UnavailableBreakEvenValue />}
          </div>

          {hasValidBreakEven && <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-600 space-y-1">
            <div className="flex justify-between">
              <span>Meta Diária ({workingDaysMonth} dias):</span>
              <strong className="text-neutral-800">{formatCurrency(dailyTargetPEC)}/dia</strong>
            </div>
            <div className="flex justify-between">
              <span>Volume Diário:</span>
              <strong className="text-neutral-800">{formatNumber(pecUnits / workingDaysMonth)} un/dia</strong>
            </div>
          </div>}
        </div>

        {/* 2. PEE - Ponto de Equilíbrio Econômico */}
        <div className="bg-white rounded-2xl p-5 border-2 border-[#CAE79A] shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F4FAEA] rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-[#5F9C1C] mb-2">
              <Target className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">2. P.E. Econômico (PEE)</span>
            </div>
            <h3 className="font-bold text-[#111111] text-base">Com Meta de Lucro</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Custos Fixos + Meta de Lucro de {formatCurrency(targetMonthlyProfit)}.
            </p>

            {hasValidBreakEven ? <div className="my-4 bg-[#F4FAEA]/70 p-3.5 rounded-xl border border-[#E3F3C4] space-y-1">
              <div className="text-2xl font-black text-[#314E0D]">{formatCurrency(peeReais)}</div>
              <div className="text-xs font-bold text-[#5F9C1C] flex items-center space-x-1">
                <span>{formatNumber(peeUnits)} unidades equivalentes no mix atual</span>
              </div>
            </div> : <UnavailableBreakEvenValue />}
          </div>

          {hasValidBreakEven && <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-600 space-y-1">
            <div className="flex justify-between">
              <span>Meta Diária ({workingDaysMonth} dias):</span>
              <strong className="text-neutral-800">{formatCurrency(dailyTargetPEE)}/dia</strong>
            </div>
            <div className="flex justify-between">
              <span>Volume Diário:</span>
              <strong className="text-neutral-800">{formatNumber(peeUnits / workingDaysMonth)} un/dia</strong>
            </div>
          </div>}
        </div>

        {/* 3. PEF - Ponto de Equilíbrio Financeiro */}
        <div className="bg-white rounded-2xl p-5 border-2 border-[#FFE080] shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFF8E6] rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-[#AE7000] mb-2">
              <Coins className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">3. P.E. Financeiro (PEF)</span>
            </div>
            <h3 className="font-bold text-[#111111] text-base">Caixa / Desembolsável</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Exclui depreciação contábil não desembolsada ({formatCurrency(totalFixedCosts - totalDisbursableFixedCosts)}).
            </p>

            {hasValidBreakEven ? <div className="my-4 bg-[#FFF8E6]/70 p-3.5 rounded-xl border border-[#FFEDB0] space-y-1">
              <div className="text-2xl font-black text-[#5E3B00]">{formatCurrency(pefReais)}</div>
              <div className="text-xs font-bold text-[#AE7000] flex items-center space-x-1">
                <span>{formatNumber(pefUnits)} unidades equivalentes no mix atual</span>
              </div>
            </div> : <UnavailableBreakEvenValue />}
          </div>

          {hasValidBreakEven && <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-600 space-y-1">
            <div className="flex justify-between">
              <span>Custos Desembolsáveis:</span>
              <strong className="text-neutral-800">{formatCurrency(totalDisbursableFixedCosts)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Alívio de Caixa vs PEC:</span>
              <strong className="text-[#5F9C1C]">-{formatCurrency(pecReais - pefReais)}</strong>
            </div>
          </div>}
        </div>
      </div>

      {/* Dynamic CVL Chart */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#111111]">Gráfico Interativo de Análise CVL (Custo x Volume x Lucro)</h2>
            <p className="text-xs text-neutral-500">
              O cruzamento entre a <strong>Linha Verde (Receita Bruta)</strong> e a <strong>Linha Vermelha (Custos + Impostos)</strong> é o PEC.
              A linha vermelha soma custos fixos, custos variáveis e os impostos incidentes sobre a receita.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-[#8CCB35]" />
              <span className="text-neutral-600">Receita Bruta</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-[#F0440C]" />
              <span className="text-neutral-600">Custos + Impostos</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-[#FFB800]" />
              <span className="text-neutral-600">Custos + Impostos + Meta</span>
            </span>
          </div>
        </div>

        {hasValidBreakEven ? <div className="h-80">
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
                name="Receita Bruta (RT)"
                stroke="#9DDD25"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="CustoTotalContabil"
                name="Custos + Impostos (PEC)"
                stroke="#FFBC0D"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="CustoTotalEconomico"
                name="Custos + Impostos + Meta (PEE)"
                stroke="#FFBC0D"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="CustoFixoContabil"
                name="Custo Fixo Total (CFT)"
                stroke="#00A6D7"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div> : (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-[#FFB79B] bg-[#FFF0EA] p-6 text-center">
            <div className="max-w-md">
              <AlertTriangle className="mx-auto h-7 w-7 text-[#C92F0A]" />
              <h3 className="mt-2 text-sm font-bold text-[#691603]">Gráfico CVL indisponível para a margem atual</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#962006]">{breakEvenMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Volume Simulator & Margin of Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin of Safety (MS) */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111111]">Margem de Segurança Operacional (MS)</h2>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                hasValidBreakEven && marginOfSafetyReais >= 0
                  ? 'bg-[#E3F3C4] text-[#426D12]'
                  : 'bg-[#FFD7C7] text-[#962006]'
              }`}
            >
              {hasValidBreakEven ? (marginOfSafetyReais >= 0 ? 'Operação Segura' : 'Alerta de Prejuízo') : 'Não calculável'}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            {hasValidBreakEven
              ? 'A Margem de Segurança indica quanto o faturamento atual da Guardiões da Lasanha pode cair antes de a empresa entrar no prejuízo.'
              : 'A Margem de Segurança depende de um PEC válido e não é exibida enquanto a margem de contribuição não permitir um ponto de equilíbrio confiável.'}
          </p>

          {hasValidBreakEven && <><div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
              <span className="text-[11px] text-neutral-500 block uppercase font-bold">Margem de Segurança (R$)</span>
              <span className={`text-lg font-extrabold ${marginOfSafetyReais >= 0 ? 'text-[#5F9C1C]' : 'text-[#C92F0A]'}`}>
                {formatCurrency(marginOfSafetyReais)}
              </span>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
              <span className="text-[11px] text-neutral-500 block uppercase font-bold">Margem de Segurança (%)</span>
              <span className={`text-lg font-extrabold ${marginOfSafetyPercent >= 0 ? 'text-[#5F9C1C]' : 'text-[#C92F0A]'}`}>
                {formatPercent(marginOfSafetyPercent)}
              </span>
            </div>
          </div>
          </>}
        </div>

        {/* Interactive Production Simulator */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111111]">Simulador de Volume & Lucro</h2>
            <Sliders className="w-4 h-4 text-[#D99000]" />
          </div>
          <p className="text-xs text-neutral-500">
            Arraste para simular o resultado operacional para diferentes volumes mensais de vendas.
          </p>

          <div>
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span>Volume Mensal Simulado:</span>
              <span className="text-[#D99000] font-bold">{formatNumber(simulatedUnits)} unidades</span>
            </div>
            <input
              type="range"
              min={1000}
              max={15000}
              step={100}
              value={simulatedUnits}
              onChange={(e) => setSimulatedUnits(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#FFF8E6]0"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Receita Bruta</span>
              <span className="font-bold text-[#111111] text-sm">{formatCurrency(customRevenue)}</span>
            </div>
            <div className="p-2.5 bg-[#FFF8E6] rounded-xl border border-[#FFEDB0]">
              <span className="text-[#875700] block text-[10px] uppercase font-bold">Margem Contrib.</span>
              <span className="font-bold text-[#5E3B00] text-sm">{formatCurrency(customMC)}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${customProfit >= 0 ? 'bg-[#F4FAEA] border-[#CAE79A] text-[#314E0D]' : 'bg-[#FFF0EA] border-[#FFB79B] text-[#691603]'}`}>
              <span className="block text-[10px] uppercase font-bold">Lucro Operacional</span>
              <span className="font-bold text-sm">{formatCurrency(customProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
