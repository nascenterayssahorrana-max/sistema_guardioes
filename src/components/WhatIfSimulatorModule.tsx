import React from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Target,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { DEMO_DATA_CONTEXT } from '../data';

export const WhatIfSimulatorModule: React.FC = () => {
  const {
    simulationParams,
    setSimulationParams,
    currentDRE,
    pecReais,
    peeReais,
    simulatedDRE,
    simulatedPECReais,
    simulatedPEEReais,
    simulatedBreakEvenStatus,
    simulatedAnnualSavings,
    hasSimulationData,
  } = useFinance();

  const handleSliderChange = (key: keyof typeof simulationParams, val: number) => {
    setSimulationParams((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetSimulation = () => {
    setSimulationParams({
      lossReductionPercent: 0,
      b2cPriceChangePercent: 0,
      b2bPriceChangePercent: 0,
      volumeChangePercent: 0,
      fixedCostChangePercent: 0,
    });
  };

  const profitDiff = simulatedDRE.operationalProfit - currentDRE.operationalProfit;
  const pecDiff = simulatedPECReais - pecReais;
  const hasValidSimulatedBreakEven = simulatedBreakEvenStatus === 'valid';
  const simulatedBreakEvenMessage = simulatedBreakEvenStatus === 'non_positive_mc'
    ? 'Com a margem de contribuição simulada, aumentar as vendas não cobre a estrutura de custos. Revise preços, mix ou custos variáveis.'
    : simulatedBreakEvenStatus === 'mc_near_zero'
      ? 'A margem de contribuição simulada está muito próxima de zero; o ponto de equilíbrio não é estável para decisão gerencial.'
      : 'Dados insuficientes para calcular o ponto de equilíbrio do cenário.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Simulador Financeiro de Sensibilidade</span>
            </div>
            <h1 className="text-xl font-bold text-[#111111]">Simulador de Cenários</h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-3xl">
              Teste o impacto de estratégias como <strong>redução de perdas</strong>, reajustes de preço nos canais B2C/B2B
              e corte de despesas fixas sobre a <strong>Margem de Contribuição</strong> e o <strong>Ponto de Equilíbrio</strong>.
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">{DEMO_DATA_CONTEXT.simulationPremise}</p>
          </div>

          <button
            onClick={handleResetSimulation}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#F5F5F5] hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-neutral-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
        </div>

      </div>

      {/* Sliders & Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[#111111]">Ajuste de Variáveis da Operação</h2>

          {/* Slider 1: Redução de perdas da base NOLA */}
          <div className="space-y-1.5 bg-[#FFF0EA]/60 p-3.5 rounded-xl border border-[#FFD7C7]">
            <div className="flex justify-between text-xs font-bold text-neutral-800">
              <span className="flex items-center space-x-1 text-[#962006]">
                <span>1. Redução de Perdas:</span>
              </span>
              <span className="text-[#C92F0A] font-extrabold text-sm">
                -{simulationParams.lossReductionPercent}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={simulationParams.lossReductionPercent}
              onChange={(e) => handleSliderChange('lossReductionPercent', Number(e.target.value))}
              className="w-full h-2 bg-[#FFB79B] rounded-lg appearance-none cursor-pointer accent-[#E33B0C]"
            />
            <div className="flex justify-between text-[10px] text-[#C92F0A] font-medium">
              <span>0% (Atual)</span>
              <span>-50% (Meta 5S)</span>
              <span>-90% (Zero Refugo)</span>
            </div>
          </div>

          {/* Slider 2: Preço B2C */}
          <div className="space-y-1.5 bg-[#F4FAEA]/60 p-3.5 rounded-xl border border-[#E3F3C4]">
            <div className="flex justify-between text-xs font-bold text-neutral-800">
              <span className="text-[#426D12]">2. Reajuste de Preço Varejo (B2C):</span>
              <span className="text-[#5F9C1C] font-extrabold text-sm">
                {simulationParams.b2cPriceChangePercent > 0 ? '+' : ''}
                {simulationParams.b2cPriceChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={30}
              step={1}
              value={simulationParams.b2cPriceChangePercent}
              onChange={(e) => handleSliderChange('b2cPriceChangePercent', Number(e.target.value))}
              className="w-full h-2 bg-[#CAE79A] rounded-lg appearance-none cursor-pointer accent-[#75B82A]"
            />
            <div className="flex justify-between text-[10px] text-[#5F9C1C] font-medium">
              <span>-20% (Desconto)</span>
              <span>0%</span>
              <span>+30% (Premium)</span>
            </div>
          </div>

          {/* Slider 3: Preço B2B */}
          <div className="space-y-1.5 bg-[#EAF9FD]/60 p-3.5 rounded-xl border border-[#CFF2FA]">
            <div className="flex justify-between text-xs font-bold text-neutral-800">
              <span className="text-[#06495E]">3. Reajuste de Preço Atacado (B2B):</span>
              <span className="text-[#08627F] font-extrabold text-sm">
                {simulationParams.b2bPriceChangePercent > 0 ? '+' : ''}
                {simulationParams.b2bPriceChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={30}
              step={1}
              value={simulationParams.b2bPriceChangePercent}
              onChange={(e) => handleSliderChange('b2bPriceChangePercent', Number(e.target.value))}
              className="w-full h-2 bg-[#A7E5F2] rounded-lg appearance-none cursor-pointer accent-[#087B9F]"
            />
            <div className="flex justify-between text-[10px] text-[#08627F] font-medium">
              <span>-20% (Volume)</span>
              <span>0%</span>
              <span>+30%</span>
            </div>
          </div>

          {/* Slider 4: Volume de Vendas */}
          <div className="space-y-1.5 bg-[#FFF8E6]/60 p-3.5 rounded-xl border border-[#FFEDB0]">
            <div className="flex justify-between text-xs font-bold text-neutral-800">
              <span className="text-[#875700]">4. Variação no Volume Total:</span>
              <span className="text-[#AE7000] font-extrabold text-sm">
                {simulationParams.volumeChangePercent > 0 ? '+' : ''}
                {simulationParams.volumeChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min={-40}
              max={60}
              step={5}
              value={simulationParams.volumeChangePercent}
              onChange={(e) => handleSliderChange('volumeChangePercent', Number(e.target.value))}
              className="w-full h-2 bg-[#FFE080] rounded-lg appearance-none cursor-pointer accent-[#D99000]"
            />
            <div className="flex justify-between text-[10px] text-[#AE7000] font-medium">
              <span>-40% (Queda)</span>
              <span>0%</span>
              <span>+60% (Expansão)</span>
            </div>
          </div>

          {/* Slider 5: Custos Fixos */}
          <div className="space-y-1.5 bg-[#F5F5F5]/70 p-3.5 rounded-xl border border-neutral-200">
            <div className="flex justify-between text-xs font-bold text-neutral-800">
              <span className="text-neutral-700">5. Ajuste nos Custos Fixos:</span>
              <span className="text-neutral-800 font-extrabold text-sm">
                {simulationParams.fixedCostChangePercent > 0 ? '+' : ''}
                {simulationParams.fixedCostChangePercent}%
              </span>
            </div>
            <input
              type="range"
              min={-30}
              max={30}
              step={2}
              value={simulationParams.fixedCostChangePercent}
              onChange={(e) => handleSliderChange('fixedCostChangePercent', Number(e.target.value))}
              className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-neutral-700"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 font-medium">
              <span>-30% (Corte)</span>
              <span>0%</span>
              <span>+30% (Novos Invest.)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Results Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Annual Savings Badge */}
          {hasSimulationData && simulationParams.lossReductionPercent > 0 && (
            <div className="bg-gradient-to-r from-[#75B82A] to-[#08627F] rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#CAE79A]">
                  Economia Anual Projetada (52 Semanas)
                </span>
                <div className="text-2xl sm:text-3xl font-black mt-1">
                  +{formatCurrency(simulatedAnnualSavings)}
                </div>
                <p className="text-xs text-[#E3F3C4] mt-0.5">
                  Dinheiro recuperado que antes virava refugo no lixo da produção.
                </p>
              </div>
              <Sparkles className="w-10 h-10 text-[#CAE79A] opacity-80" />
            </div>
          )}

          {/* Comparison Cards */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#111111]">Comparativo: Cenário Atual vs. Cenário Simulado</h2>

            {!hasSimulationData ? (
              <p className="rounded-xl border border-[#FFEDB0] bg-[#FFF8E6] p-4 text-sm text-[#5E3B00]">
                Dados insuficientes para realizar a simulação. Registre ao menos uma venda para utilizar o mix de vendas da base demonstrativa.
              </p>
            ) : (
            <>
            {!hasValidSimulatedBreakEven && (
              <div className="flex items-start gap-3 rounded-xl border border-[#FFB79B] bg-[#FFF0EA] p-4 text-[#691603]">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C92F0A]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">Ponto de equilíbrio não atingível</h3>
                  <p className="mt-1 text-xs leading-relaxed">{simulatedBreakEvenMessage}</p>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 font-semibold">
                    <th className="py-2.5 px-3 text-left">Métrica de Gestão</th>
                    <th className="py-2.5 px-3 text-right">Cenário Atual</th>
                    <th className="py-2.5 px-3 text-right bg-indigo-50/50 text-indigo-900 font-bold">Cenário Simulado</th>
                    <th className="py-2.5 px-3 text-right">Variação Líquida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {/* Faturamento */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-800">Faturamento Bruto</td>
                    <td className="py-2.5 px-3 text-right text-neutral-600">{formatCurrency(currentDRE.grossRevenue)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatCurrency(simulatedDRE.grossRevenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-neutral-800">
                      {simulatedDRE.grossRevenue - currentDRE.grossRevenue >= 0 ? '+' : ''}
                      {formatCurrency(simulatedDRE.grossRevenue - currentDRE.grossRevenue)}
                    </td>
                  </tr>

                  {/* Margem Contribuição */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-800">Margem Contribuição (R$)</td>
                    <td className="py-2.5 px-3 text-right text-neutral-600">{formatCurrency(currentDRE.contributionMargin)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatCurrency(simulatedDRE.contributionMargin)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#5F9C1C]">
                      {simulatedDRE.contributionMargin - currentDRE.contributionMargin >= 0 ? '+' : ''}
                      {formatCurrency(simulatedDRE.contributionMargin - currentDRE.contributionMargin)}
                    </td>
                  </tr>

                  {/* Margem Contribuição % */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-800">Margem Contribuição (%)</td>
                    <td className="py-2.5 px-3 text-right text-neutral-600">{formatPercent(currentDRE.contributionMarginPercent)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatPercent(simulatedDRE.contributionMarginPercent)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#5F9C1C]">
                      {simulatedDRE.contributionMarginPercent - currentDRE.contributionMarginPercent >= 0 ? '+' : ''}
                      {formatPercent(simulatedDRE.contributionMarginPercent - currentDRE.contributionMarginPercent)}
                    </td>
                  </tr>

                  {/* Custos Fixos */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-800">Custos Fixos Mensais</td>
                    <td className="py-2.5 px-3 text-right text-neutral-600">{formatCurrency(currentDRE.fixedCostsTotal)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatCurrency(simulatedDRE.fixedCostsTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-neutral-700">
                      {simulatedDRE.fixedCostsTotal - currentDRE.fixedCostsTotal >= 0 ? '+' : ''}
                      {formatCurrency(simulatedDRE.fixedCostsTotal - currentDRE.fixedCostsTotal)}
                    </td>
                  </tr>

                  {/* Lucro Operacional */}
                  <tr className="bg-neutral-50 font-bold">
                    <td className="py-3 px-3 text-[#111111]">Lucro Operacional Líquido</td>
                    <td className="py-3 px-3 text-right text-neutral-800">{formatCurrency(currentDRE.operationalProfit)}</td>
                    <td className="py-3 px-3 text-right font-black text-[#5F9C1C] bg-[#F4FAEA]/50">
                      {formatCurrency(simulatedDRE.operationalProfit)}
                    </td>
                    <td className={`py-3 px-3 text-right font-extrabold ${profitDiff >= 0 ? 'text-[#5F9C1C]' : 'text-[#C92F0A]'}`}>
                      {profitDiff >= 0 ? '+' : ''}
                      {formatCurrency(profitDiff)}
                    </td>
                  </tr>

                  {/* Ponto de Equilíbrio Contábil */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-800">P.E. Contábil (PEC)</td>
                    <td className="py-2.5 px-3 text-right text-neutral-600">{pecReais > 0 ? formatCurrency(pecReais) : 'Não atingível'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {hasValidSimulatedBreakEven ? formatCurrency(simulatedPECReais) : 'Não atingível'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${hasValidSimulatedBreakEven && pecDiff <= 0 ? 'text-[#5F9C1C]' : 'text-[#C92F0A]'}`}>
                      {hasValidSimulatedBreakEven
                        ? <>{pecDiff >= 0 ? '+' : ''}{formatCurrency(pecDiff)} ({pecDiff <= 0 ? 'Mais fácil de atingir' : 'Mais difícil'})</>
                        : 'Não comparável'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
