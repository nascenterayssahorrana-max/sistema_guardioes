import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { DEMO_DATA_CONTEXT } from '../data';
import { formatCurrency, formatPercent } from '../utils/formatters';

type DRELine = {
  label: string;
  value: number;
  tone: 'revenue' | 'expense' | 'subtotal' | 'result';
};

export const DREModule: React.FC = () => {
  const { currentDRE, breakEvenStatus } = useFinance();
  const hasData = currentDRE.grossRevenue > 0;
  const totalVariableCosts = currentDRE.variableCostsCPV + currentDRE.allocatedLosses;
  const isPositiveResult = currentDRE.operationalProfit >= 0;
  const percentOfGross = (value: number) =>
    currentDRE.grossRevenue > 0 ? (value / currentDRE.grossRevenue) * 100 : 0;

  const lines: DRELine[] = [
    { label: 'Receita Bruta', value: currentDRE.grossRevenue, tone: 'revenue' },
    { label: '(-) Impostos', value: -currentDRE.taxes, tone: 'expense' },
    { label: '(=) Receita Líquida', value: currentDRE.netRevenue, tone: 'subtotal' },
    { label: '(-) Custos Diretos Variáveis', value: -currentDRE.variableCostsCPV, tone: 'expense' },
    { label: '(-) Perdas Rateadas', value: -currentDRE.allocatedLosses, tone: 'expense' },
    { label: '(=) Custos Variáveis Reais', value: -totalVariableCosts, tone: 'subtotal' },
    { label: '(=) Margem de Contribuição', value: currentDRE.contributionMargin, tone: 'subtotal' },
    { label: '(-) Custos Fixos Totais', value: -currentDRE.fixedCostsTotal, tone: 'expense' },
    { label: '(=) Resultado Operacional', value: currentDRE.operationalProfit, tone: 'result' },
  ];

  const displayValue = (value: number) => `${value < 0 ? '-' : ''}${formatCurrency(Math.abs(value))}`;

  const insights = [
    `A margem de contribuição representa ${formatPercent(currentDRE.contributionMarginPercent)} da receita bruta.`,
    `Os impostos representam ${formatPercent(percentOfGross(currentDRE.taxes))} do faturamento bruto.`,
    `As perdas rateadas representam ${formatCurrency(currentDRE.allocatedLosses)} do custo variável real no recorte de vendas.`,
    currentDRE.fixedCostsTotal > currentDRE.contributionMargin
      ? `Os custos fixos de ${formatCurrency(currentDRE.fixedCostsTotal)} são superiores à margem de contribuição gerada no período.`
      : `A margem de contribuição gerada no período cobre os custos fixos de ${formatCurrency(currentDRE.fixedCostsTotal)}.`,
    isPositiveResult
      ? 'O resultado operacional atual é positivo após a cobertura dos custos fixos considerados.'
      : 'O resultado operacional atual é negativo porque a margem de contribuição não é suficiente para cobrir os custos fixos considerados.',
  ];

  const flowSteps = [
    { label: 'Receita Bruta', value: currentDRE.grossRevenue, color: 'border-[#A7E5F2] bg-[#EAF9FD] text-[#06495E]' },
    { label: 'Impostos', value: -currentDRE.taxes, color: 'border-[#FFEDB0] bg-[#FFF8E6] text-[#875700]' },
    { label: 'Receita Líquida', value: currentDRE.netRevenue, color: 'border-[#CAE79A] bg-[#F4FAEA] text-[#426D12]' },
    { label: 'Custos Variáveis Reais', value: -totalVariableCosts, color: 'border-[#FFB79B] bg-[#FFF0EA] text-[#962006]' },
    { label: 'Margem de Contribuição', value: currentDRE.contributionMargin, color: 'border-[#FFE080] bg-[#FFF8E6] text-[#5E3B00]' },
    { label: 'Resultado Operacional', value: currentDRE.operationalProfit, color: isPositiveResult ? 'border-[#CAE79A] bg-[#F4FAEA] text-[#314E0D]' : 'border-[#FFB79B] bg-[#FFF0EA] text-[#691603]' },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#087B9F]">
              <ReceiptText className="h-4 w-4" />
              <span>Resultado gerencial consolidado</span>
            </div>
            <h1 className="text-xl font-bold text-[#111111]">DRE — Demonstração do Resultado</h1>
            <p className="mt-1 max-w-3xl text-xs text-neutral-500 sm:text-sm">
              Entenda de onde veio o resultado da operação e quais componentes estão impactando a rentabilidade.
            </p>
          </div>
          <div className="rounded-xl border border-[#FFEDB0] bg-[#FFF8E6] px-3 py-2 text-xs text-[#5E3B00]">
            <strong>Base demonstrativa:</strong> vendas de 25–29/08/2026. Custos fixos em referência mensal. Resultado não representa projeção mensal automática.
          </div>
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">
          Perdas: {DEMO_DATA_CONTEXT.nolaLosses.periodLabel}; incorporadas somente na parcela rateada correspondente às vendas.
        </p>
      </section>

      {!hasData ? (
        <section className="flex items-start gap-3 rounded-2xl border border-[#FFEDB0] bg-[#FFF8E6] p-5 text-[#5E3B00]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D99000]" />
          <div>
            <h2 className="text-sm font-bold">Dados insuficientes para apresentar a DRE</h2>
            <p className="mt-1 text-xs leading-relaxed">Registre ao menos uma venda para consolidar receita, impostos, custos variáveis e resultado operacional.</p>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Receita Bruta" value={formatCurrency(currentDRE.grossRevenue)} icon={CircleDollarSign} tone="info" />
            <MetricCard label="Receita Líquida" value={formatCurrency(currentDRE.netRevenue)} icon={WalletCards} tone="neutral" />
            <MetricCard label="Margem de Contribuição" value={formatCurrency(currentDRE.contributionMargin)} icon={TrendingUp} tone="highlight" />
            <MetricCard label="MC sobre receita bruta" value={formatPercent(currentDRE.contributionMarginPercent)} icon={BarChart3} tone="highlight" />
            <MetricCard label="Custos Fixos" value={formatCurrency(currentDRE.fixedCostsTotal)} icon={Landmark} tone="attention" />
            <MetricCard label="Resultado Operacional" value={formatCurrency(currentDRE.operationalProfit)} icon={isPositiveResult ? TrendingUp : TrendingDown} tone={isPositiveResult ? 'positive' : 'negative'} />
          </section>

          {currentDRE.operationalProfit < 0 && (
            <section className="flex items-start gap-3 rounded-2xl border border-[#FFB79B] bg-[#FFF0EA] p-4 text-[#691603]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C92F0A]" />
              <p className="text-sm leading-relaxed"><strong>Resultado operacional negativo.</strong> A margem de contribuição gerada no período não é suficiente para cobrir os custos fixos considerados.</p>
            </section>
          )}

          {breakEvenStatus !== 'valid' && (
            <section className="flex items-start gap-3 rounded-2xl border border-[#FFB79B] bg-[#FFF0EA] p-4 text-[#691603]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C92F0A]" />
              <p className="text-sm leading-relaxed"><strong>Ponto de equilíbrio não exibido nesta DRE.</strong> A margem de contribuição atual não permite um cálculo de equilíbrio confiável. Consulte o módulo CVL para o detalhamento.</p>
            </section>
          )}

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#111111]">Como o resultado é formado</h2>
              <p className="mt-1 text-xs text-neutral-500">Receita bruta → impostos → receita líquida → custos variáveis reais → margem de contribuição → custos fixos → resultado operacional.</p>
            </div>
            <div className="flex flex-wrap items-stretch gap-2">
              {flowSteps.map((step, index) => (
                <React.Fragment key={step.label}>
                  <div className={`min-w-32 flex-1 rounded-xl border p-3 ${step.color}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide">{step.label}</p>
                    <p className="mt-1 text-sm font-extrabold">{displayValue(step.value)}</p>
                  </div>
                  {index < flowSteps.length - 1 && <ArrowRight className="my-auto h-4 w-4 shrink-0 text-neutral-400" />}
                </React.Fragment>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs xl:col-span-3">
              <div className="mb-4">
                <h2 className="text-base font-bold text-[#111111]">Composição da DRE</h2>
                <p className="mt-1 text-xs text-neutral-500">Todos os percentuais são calculados sobre a receita bruta.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full text-xs">
                  <thead className="border-y border-neutral-200 bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">Linha</th>
                      <th className="px-3 py-3 text-right font-semibold">Valor</th>
                      <th className="px-3 py-3 text-right font-semibold">% da Receita Bruta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {lines.map((line) => (
                      <tr key={line.label} className={line.tone === 'result' ? (isPositiveResult ? 'bg-[#F4FAEA]/70' : 'bg-[#FFF0EA]/70') : line.tone === 'subtotal' ? 'bg-neutral-50/80' : ''}>
                        <td className={`px-3 py-3 ${line.tone === 'expense' ? 'pl-6 text-neutral-600' : 'font-semibold text-neutral-800'} ${line.tone === 'result' ? 'font-extrabold' : ''}`}>{line.label}</td>
                        <td className={`px-3 py-3 text-right font-semibold ${line.value < 0 ? 'text-[#C92F0A]' : line.tone === 'result' ? (isPositiveResult ? 'text-[#426D12]' : 'text-[#C92F0A]') : 'text-[#111111]'}`}>{displayValue(line.value)}</td>
                        <td className={`px-3 py-3 text-right ${line.value < 0 ? 'text-[#C92F0A]' : 'text-neutral-600'}`}>{formatPercent(percentOfGross(line.value))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs xl:col-span-2">
              <h2 className="text-base font-bold text-[#111111]">Leitura gerencial</h2>
              <p className="mt-1 text-xs text-neutral-500">Insights calculados a partir do resultado consolidado da base atual.</p>
              <ul className="mt-4 space-y-3">
                {insights.map((insight, index) => (
                  <li key={insight} className="flex gap-2 text-xs leading-relaxed text-neutral-700">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index === 4 && !isPositiveResult ? 'bg-[#FFF0EA] text-[#C92F0A]' : 'bg-[#EAF9FD] text-[#08627F]'}`}>{index + 1}</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        </>
      )}
    </div>
  );
};

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: 'info' | 'neutral' | 'highlight' | 'attention' | 'positive' | 'negative';
}) {
  const tones = {
    info: 'border-[#A7E5F2] bg-[#EAF9FD] text-[#06495E]',
    neutral: 'border-neutral-200 bg-white text-[#111111]',
    highlight: 'border-[#FFE080] bg-[#FFF8E6] text-[#5E3B00]',
    attention: 'border-[#FFEDB0] bg-[#FFF8E6] text-[#875700]',
    positive: 'border-[#CAE79A] bg-[#F4FAEA] text-[#314E0D]',
    negative: 'border-[#FFB79B] bg-[#FFF0EA] text-[#691603]',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-xs ${tones[tone]}`}>
      <Icon className="h-5 w-5" />
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-black tracking-tight">{value}</p>
    </div>
  );
}
