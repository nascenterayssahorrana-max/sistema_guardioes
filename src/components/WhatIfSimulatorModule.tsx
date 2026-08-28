import React from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  DollarSign,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

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
    simulatedAnnualSavings,
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

  // Presets
  const applyPreset = (preset: 'antiRefugo' | 'b2bExpansion' | 'marginBoost' | 'costCut') => {
    if (preset === 'antiRefugo') {
      setSimulationParams({
        lossReductionPercent: 50,
        b2cPriceChangePercent: 0,
        b2bPriceChangePercent: 0,
        volumeChangePercent: 5,
        fixedCostChangePercent: 0,
      });
    } else if (preset === 'b2bExpansion') {
      setSimulationParams({
        lossReductionPercent: 20,
        b2cPriceChangePercent: 0,
        b2bPriceChangePercent: -3,
        volumeChangePercent: 25,
        fixedCostChangePercent: 5,
      });
    } else if (preset === 'marginBoost') {
      setSimulationParams({
        lossReductionPercent: 35,
        b2cPriceChangePercent: 6,
        b2bPriceChangePercent: 2,
        volumeChangePercent: 0,
        fixedCostChangePercent: -2,
      });
    } else if (preset === 'costCut') {
      setSimulationParams({
        lossReductionPercent: 40,
        b2cPriceChangePercent: 0,
        b2bPriceChangePercent: 0,
        volumeChangePercent: -5,
        fixedCostChangePercent: -12,
      });
    }
  };

  const profitDiff = simulatedDRE.operationalProfit - currentDRE.operationalProfit;
  const pecDiff = simulatedPECReais - pecReais;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Simulador Financeiro de Sensibilidade</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Simulador de Cenários "E Se...?" (What-If Analysis)</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Teste o impacto de estratégias como <strong>redução de perdas NOLA</strong>, reajustes de preço nos canais B2C/B2B
              e corte de despesas fixas sobre a <strong>Margem de Contribuição</strong> e o <strong>Ponto de Equilíbrio</strong>.
            </p>
          </div>

          <button
            onClick={handleResetSimulation}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
        </div>

        {/* Quick Scenario Preset Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
            <Zap className="w-3.5 h-3.5 text-amber-500 mr-1" />
            Cenários Rápidos:
          </span>
          <button
            onClick={() => applyPreset('antiRefugo')}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            🔥 Plano 5S & Anti-Refugo (-50% perdas)
          </button>
          <button
            onClick={() => applyPreset('b2bExpansion')}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            🚀 Expansão Foodservice (+25% volume)
          </button>
          <button
            onClick={() => applyPreset('marginBoost')}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            💎 Otimização de Margem (+6% B2C)
          </button>
          <button
            onClick={() => applyPreset('costCut')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ✂️ Redução de Custos Fixos (-12%)
          </button>
        </div>
      </div>

      {/* Sliders & Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900">Ajuste de Variáveis da Operação</h2>

          {/* Slider 1: Redução de Perdas NOLA */}
          <div className="space-y-1.5 bg-rose-50/60 p-3.5 rounded-xl border border-rose-100">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center space-x-1 text-rose-800">
                <span>1. Redução de Perdas NOLA:</span>
              </span>
              <span className="text-rose-700 font-extrabold text-sm">
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
              className="w-full h-2 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <div className="flex justify-between text-[10px] text-rose-700 font-medium">
              <span>0% (Atual)</span>
              <span>-50% (Meta 5S)</span>
              <span>-90% (Zero Refugo)</span>
            </div>
          </div>

          {/* Slider 2: Preço B2C */}
          <div className="space-y-1.5 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span className="text-emerald-800">2. Reajuste de Preço Varejo (B2C):</span>
              <span className="text-emerald-700 font-extrabold text-sm">
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
              className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-emerald-700 font-medium">
              <span>-20% (Desconto)</span>
              <span>0%</span>
              <span>+30% (Premium)</span>
            </div>
          </div>

          {/* Slider 3: Preço B2B */}
          <div className="space-y-1.5 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span className="text-blue-800">3. Reajuste de Preço Atacado (B2B):</span>
              <span className="text-blue-700 font-extrabold text-sm">
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
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-blue-700 font-medium">
              <span>-20% (Volume)</span>
              <span>0%</span>
              <span>+30%</span>
            </div>
          </div>

          {/* Slider 4: Volume de Vendas */}
          <div className="space-y-1.5 bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span className="text-amber-800">4. Variação no Volume Total:</span>
              <span className="text-amber-700 font-extrabold text-sm">
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
              className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-amber-700 font-medium">
              <span>-40% (Queda)</span>
              <span>0%</span>
              <span>+60% (Expansão)</span>
            </div>
          </div>

          {/* Slider 5: Custos Fixos */}
          <div className="space-y-1.5 bg-slate-100/70 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span className="text-slate-700">5. Ajuste nos Custos Fixos:</span>
              <span className="text-slate-800 font-extrabold text-sm">
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
              className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-700"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-medium">
              <span>-30% (Corte)</span>
              <span>0%</span>
              <span>+30% (Novos Invest.)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Results Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Annual Savings Badge */}
          {simulationParams.lossReductionPercent > 0 && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-200">
                  Economia Anual Projetada (52 Semanas)
                </span>
                <div className="text-2xl sm:text-3xl font-black mt-1">
                  +{formatCurrency(simulatedAnnualSavings)}
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Dinheiro recuperado que antes virava refugo no lixo da produção.
                </p>
              </div>
              <Sparkles className="w-10 h-10 text-emerald-200 opacity-80" />
            </div>
          )}

          {/* Comparison Cards */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Comparativo: Cenário Atual vs. Cenário Simulado</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 text-left">Métrica de Gestão</th>
                    <th className="py-2.5 px-3 text-right">Cenário Atual</th>
                    <th className="py-2.5 px-3 text-right bg-indigo-50/50 text-indigo-900 font-bold">Cenário Simulado</th>
                    <th className="py-2.5 px-3 text-right">Variação Líquida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Faturamento */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Faturamento Bruto</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(currentDRE.grossRevenue)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatCurrency(simulatedDRE.grossRevenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {simulatedDRE.grossRevenue - currentDRE.grossRevenue >= 0 ? '+' : ''}
                      {formatCurrency(simulatedDRE.grossRevenue - currentDRE.grossRevenue)}
                    </td>
                  </tr>

                  {/* Margem Contribuição */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Margem Contribuição (R$)</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(currentDRE.contributionMargin)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatCurrency(simulatedDRE.contributionMargin)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      {simulatedDRE.contributionMargin - currentDRE.contributionMargin >= 0 ? '+' : ''}
                      {formatCurrency(simulatedDRE.contributionMargin - currentDRE.contributionMargin)}
                    </td>
                  </tr>

                  {/* Margem Contribuição % */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Margem Contribuição (%)</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatPercent(currentDRE.contributionMarginPercent)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatPercent(simulatedDRE.contributionMarginPercent)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      {simulatedDRE.contributionMarginPercent - currentDRE.contributionMarginPercent >= 0 ? '+' : ''}
                      {formatPercent(simulatedDRE.contributionMarginPercent - currentDRE.contributionMarginPercent)}
                    </td>
                  </tr>

                  {/* Custos Fixos */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Custos Fixos Mensais</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(currentDRE.fixedCostsTotal)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatCurrency(simulatedDRE.fixedCostsTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                      {simulatedDRE.fixedCostsTotal - currentDRE.fixedCostsTotal >= 0 ? '+' : ''}
                      {formatCurrency(simulatedDRE.fixedCostsTotal - currentDRE.fixedCostsTotal)}
                    </td>
                  </tr>

                  {/* Lucro Operacional */}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-3 px-3 text-slate-900">Lucro Operacional Líquido</td>
                    <td className="py-3 px-3 text-right text-slate-800">{formatCurrency(currentDRE.operationalProfit)}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700 bg-emerald-50/50">
                      {formatCurrency(simulatedDRE.operationalProfit)}
                    </td>
                    <td className={`py-3 px-3 text-right font-extrabold ${profitDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {profitDiff >= 0 ? '+' : ''}
                      {formatCurrency(profitDiff)}
                    </td>
                  </tr>

                  {/* Ponto de Equilíbrio Contábil */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">P.E. Contábil (PEC)</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(pecReais)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {formatCurrency(simulatedPECReais)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${pecDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {pecDiff >= 0 ? '+' : ''}
                      {formatCurrency(pecDiff)} ({pecDiff <= 0 ? 'Mais fácil de atingir' : 'Mais difícil'})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
