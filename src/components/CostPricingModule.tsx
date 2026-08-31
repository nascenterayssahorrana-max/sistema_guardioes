import React, { useState } from 'react';
import {
  Calculator,
  Percent,
  Layers,
  Edit3,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Trophy,
  CircleAlert,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { Product, ProductCode } from '../types/finance';
import { formatCurrency, formatPercent, formatDecimal } from '../utils/formatters';
import { DEMO_DATA_CONTEXT } from '../data';

interface CostPricingModuleProps {
  onEditProduct: (product: Product) => void;
}

export const CostPricingModule: React.FC<CostPricingModuleProps> = ({ onEditProduct }) => {
  const { productCalculations, products, sales, totalNolaLossReais } = useFinance();
  const [selectedProductCode, setSelectedProductCode] = useState<ProductCode>('GL001');

  const selectedCalc = productCalculations[selectedProductCode] || Object.values(productCalculations)[0];
  const prod = selectedCalc.product;
  const calculationList = Object.values(productCalculations);

  // Direct costs sum
  const directCostsSum = prod.baseCost + prod.packagingCost + prod.directLaborCost + prod.otherVariableCost;

  // Chart data for comparing Margins across products
  const marginComparisonData = Object.values(productCalculations).map((pc) => ({
    name: pc.product.name.replace('Lasanha ', 'Las. ').replace('Rondelli ', 'Rond. ').replace('Nhoque ', 'Nh. ').replace('Ravioli ', 'Rav. '),
    mcB2C: Number(pc.mcPercentB2C.toFixed(1)),
    mcB2B: Number(pc.mcPercentB2B.toFixed(1)),
    realCost: pc.realVariableCost,
    lossCost: pc.allocatedLossPerUnit,
  }));

  const averageRealCost = calculationList.length > 0
    ? calculationList.reduce((total, pc) => total + pc.realVariableCost, 0) / calculationList.length
    : null;
  const averageMCB2C = calculationList.length > 0
    ? calculationList.reduce((total, pc) => total + pc.mcPercentB2C, 0) / calculationList.length
    : null;
  const averageMCB2B = calculationList.length > 0
    ? calculationList.reduce((total, pc) => total + pc.mcPercentB2B, 0) / calculationList.length
    : null;
  const lossImpactPercent = directCostsSum > 0
    ? (selectedCalc.allocatedLossPerUnit / directCostsSum) * 100
    : null;

  const productMargins = calculationList.flatMap((pc) => [
    { product: pc.product, channel: 'B2C' as const, margin: pc.mcPercentB2C },
    { product: pc.product, channel: 'B2B' as const, margin: pc.mcPercentB2B },
  ]);
  const highestMargin = [...productMargins].sort((a, b) => b.margin - a.margin)[0];
  const lowestMargin = [...productMargins].sort((a, b) => a.margin - b.margin)[0];
  const channelDifference = averageMCB2C !== null && averageMCB2B !== null ? Math.abs(averageMCB2C - averageMCB2B) : null;
  const bestChannel = averageMCB2C !== null && averageMCB2B !== null
    ? averageMCB2C >= averageMCB2B ? 'B2C' : 'B2B'
    : null;

  const productFinancialResults = calculationList.map((pc) => {
    const productSales = sales.filter((sale) => sale.productCode === pc.product.code);
    const revenue = productSales.reduce((total, sale) => total + sale.totalRevenue, 0);
    const contribution = productSales.reduce((total, sale) => {
      const taxRate = sale.taxRateApplied ?? (sale.channel === 'B2C' ? pc.product.taxRateB2C : pc.product.taxRateB2B);
      const netRevenue = sale.totalRevenue * (1 - taxRate / 100);
      const costUnit = sale.financialSnapshotVersion
        ? (sale.directCostUnit ?? sale.variableCostUnit) + sale.allocatedLossUnit
        : pc.realVariableCost;
      return total + netRevenue - costUnit * sale.quantityUnits;
    }, 0);
    return { product: pc.product, revenue, contribution };
  });
  const highestFinancialImpact = [...productFinancialResults].sort((a, b) => b.contribution - a.contribution)[0];

  const getProfitabilityStatus = (mcB2C: number, mcB2B: number) => {
    if (mcB2C <= 0 || mcB2B <= 0) return { label: 'Baixa margem', className: 'bg-[#FFF0EA] text-[#C92F0A] border-[#FFB79B]' };
    if (mcB2C >= 40 && mcB2B >= 25) return { label: 'Boa margem', className: 'bg-[#F4FAEA] text-[#426D12] border-[#CAE79A]' };
    return { label: 'Atenção', className: 'bg-[#FFF8E6] text-[#875700] border-[#FFE080]' };
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#111111]">Custos Industriais e Formação de Preço (B2C & B2B)</h1>
          </div>
        </div>
      </div>

      {/* Executive indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Custo médio real" value={averageRealCost === null ? 'Dados insuficientes' : formatCurrency(averageRealCost)} context="Média dos produtos cadastrados" tone="cyan" />
        <MetricCard label="MC média B2C" value={averageMCB2C === null ? 'Dados insuficientes' : formatPercent(averageMCB2C)} context="Média das margens do varejo" tone="green" />
        <MetricCard label="MC média B2B" value={averageMCB2B === null ? 'Dados insuficientes' : formatPercent(averageMCB2B)} context="Média das margens do atacado" tone="yellow" />
        <MetricCard label="Perdas incorporadas" value={formatCurrency(totalNolaLossReais)} context={`Rateio: ${DEMO_DATA_CONTEXT.nolaLosses.periodLabel}`} tone="orange" />
      </div>

      {/* Product profitability table */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111111]">Rentabilidade por produto</h2>
            <p className="text-xs text-neutral-500">Compare custo real, preço e margem por canal. Selecione um produto para analisar a composição abaixo.</p>
          </div>
          <span className="text-[11px] text-neutral-500">Status: boa margem ≥ 40% B2C e ≥ 25% B2B; baixa margem ≤ 0%.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full divide-y divide-neutral-200 text-xs">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Produto</th>
                <th className="px-3 py-3 text-right font-semibold">Custo real</th>
                <th className="px-3 py-3 text-right font-semibold">Preço B2C</th>
                <th className="px-3 py-3 text-right font-semibold">MC B2C</th>
                <th className="px-3 py-3 text-right font-semibold">Preço B2B</th>
                <th className="px-3 py-3 text-right font-semibold">MC B2B</th>
                <th className="px-3 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {calculationList.map((pc) => {
                const status = getProfitabilityStatus(pc.mcPercentB2C, pc.mcPercentB2B);
                return (
                  <tr key={pc.product.code} className={selectedProductCode === pc.product.code ? 'bg-[#FFF8E6]/50' : 'hover:bg-neutral-50'}>
                    <td className="px-3 py-3">
                      <button onClick={() => setSelectedProductCode(pc.product.code)} className="text-left font-semibold text-[#111111] hover:text-[#AE7000]">
                        {pc.product.name}<span className="ml-1.5 font-mono text-[10px] text-neutral-400">{pc.product.code}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-neutral-800">{formatCurrency(pc.realVariableCost)}</td>
                    <td className="px-3 py-3 text-right text-neutral-700">{formatCurrency(pc.product.priceB2C)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-[#5F9C1C]">{formatPercent(pc.mcPercentB2C)}</td>
                    <td className="px-3 py-3 text-right text-neutral-700">{formatCurrency(pc.product.priceB2B)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-[#08627F]">{formatPercent(pc.mcPercentB2B)}</td>
                    <td className="px-3 py-3 text-right"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Selector Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {products.map((p) => {
          const isSelected = p.code === selectedProductCode;
          return (
            <button
              key={p.code}
              id={`select-prod-${p.code}`}
              onClick={() => setSelectedProductCode(p.code)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-[#FFB800] text-white border-[#D99000] shadow-sm'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200'
              }`}
            >
              <span className="font-mono opacity-70 mr-1.5 text-xs">{p.code}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Detailed Technical Sheet of Selected Product */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown (Left Col - 1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-[#D99000]">{prod.code}</span>
              <h2 className="text-lg font-bold text-[#111111]">{prod.name}</h2>
              <span className="text-xs text-neutral-500">{prod.weightGrams}g • {prod.category}</span>
            </div>
            <button
              onClick={() => onEditProduct(prod)}
              id="btn-edit-active-product"
              className="p-2 text-neutral-500 hover:text-[#D99000] hover:bg-[#FFF8E6] rounded-xl transition-colors cursor-pointer border border-neutral-200"
              title="Editar Parâmetros de Custo e Preço"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 pt-2 text-xs">
            <h3 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">Composição do Custo Unitário</h3>

            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-600">Insumos & Ingredientes (BOM):</span>
              <span className="font-medium text-neutral-800">{formatCurrency(prod.baseCost)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-600">Embalagem (Bandeja/Filme/Caixa):</span>
              <span className="font-medium text-neutral-800">{formatCurrency(prod.packagingCost)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-600">Mão de Obra Direta (MOD):</span>
              <span className="font-medium text-neutral-800">{formatCurrency(prod.directLaborCost)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-600">Outros Custos Variáveis:</span>
              <span className="font-medium text-neutral-800">{formatCurrency(prod.otherVariableCost)}</span>
            </div>

            {/* Subtotal Direct Costs */}
            <div className="flex justify-between py-1.5 font-semibold text-neutral-700 bg-neutral-50 px-2 rounded">
              <span>Subtotal Custo Direto Padrão:</span>
              <span>{formatCurrency(directCostsSum)}</span>
            </div>

            {/* Allocated NOLA Loss Card */}
            <div className="bg-[#FFF8E6]/90 border border-[#FFE080] p-3 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#5E3B00] flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D99000]" />
                  <span>Perdas alocadas:</span>
                </span>
                <span className="font-bold text-[#5E3B00] text-sm">
                  +{formatCurrency(selectedCalc.allocatedLossPerUnit)}/un
                </span>
              </div>
              <p className="text-[10px] text-[#875700]">
                Rateio das perdas de fábrica (R$ {formatCurrency(selectedCalc.totalLossCostNola)} divididos por {selectedCalc.totalProducedUnitsNola || 'lotes'} unidades produzidas).
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#FFF8E6] px-3 py-2 text-[11px] text-[#5E3B00]">
              <span>Impacto das perdas no custo direto</span>
              <strong>+{lossImpactPercent === null ? '—' : formatPercent(lossImpactPercent)}</strong>
            </div>

            {/* Total Real Variable Cost */}
            <div className="bg-black text-white p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block font-medium">CUSTO VARIÁVEL REAL TOTAL:</span>
                <span className="text-xs text-[#FFC52B] font-semibold">(Direto + perdas rateadas)</span>
              </div>
              <span className="text-lg font-black text-[#FFC52B]">
                {formatCurrency(selectedCalc.realVariableCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Strategy: B2C vs B2B (Right Col - 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dual Channel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* B2C Card */}
            <div className="bg-gradient-to-br from-[#F4FAEA]/70 to-[#E3F3C4]/30 rounded-2xl p-5 border border-[#CAE79A] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#75B82A] text-white flex items-center justify-center font-bold text-xs">
                    B2C
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111111] text-sm">Canal Varejo / Consumidor Final</h3>
                    <span className="text-[11px] text-[#426D12] font-medium">E-commerce próprio, Loja de fábrica, Delivery</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-3 border border-[#CAE79A]/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-medium">Preço de Venda Bruto:</span>
                  <span className="text-base font-bold text-[#111111]">{formatCurrency(prod.priceB2C)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500">
                  <span>(-) Imposto ({prod.taxRateB2C}%):</span>
                  <span className="text-[#C92F0A]">-{formatCurrency(prod.priceB2C * (prod.taxRateB2C / 100))}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-neutral-700 pt-1 border-t border-neutral-100">
                  <span>(=) Preço Líquido de Venda:</span>
                  <span>{formatCurrency(selectedCalc.netPriceB2C)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500">
                  <span>(-) Custo Variável Real Total:</span>
                  <span className="text-[#C92F0A]">-{formatCurrency(selectedCalc.realVariableCost)}</span>
                </div>
              </div>

              {/* B2C Results */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                <div className="bg-white rounded-xl p-2.5 border border-[#B6DE68]/60">
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Margem Contribuição (R$)</span>
                  <span className="text-base font-extrabold text-[#5F9C1C]">{formatCurrency(selectedCalc.mcB2C)}</span>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-[#B6DE68]/60">
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Margem Contribuição (%)</span>
                  <span className="text-base font-extrabold text-[#5F9C1C]">{formatPercent(selectedCalc.mcPercentB2C)}</span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 flex justify-between px-1">
                <span>Markup Multiplicador: <strong>{formatDecimal(selectedCalc.markupB2C, 2)}x</strong></span>
                <span>Margem saudável &gt; 40%</span>
              </div>
            </div>

            {/* B2B Card */}
            <div className="bg-gradient-to-br from-[#EAF9FD]/70 to-[#CFF2FA]/30 rounded-2xl p-5 border border-[#A7E5F2] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#087B9F] text-white flex items-center justify-center font-bold text-xs">
                    B2B
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111111] text-sm">Canal Atacado / Foodservice</h3>
                    <span className="text-[11px] text-[#06495E] font-medium">Restaurantes, Empórios, Rotisserias, Hotéis</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-3 border border-[#A7E5F2]/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-medium">Preço de Venda Bruto:</span>
                  <span className="text-base font-bold text-[#111111]">{formatCurrency(prod.priceB2B)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500">
                  <span>(-) Imposto ({prod.taxRateB2B}%):</span>
                  <span className="text-[#C92F0A]">-{formatCurrency(prod.priceB2B * (prod.taxRateB2B / 100))}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-neutral-700 pt-1 border-t border-neutral-100">
                  <span>(=) Preço Líquido de Venda:</span>
                  <span>{formatCurrency(selectedCalc.netPriceB2B)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500">
                  <span>(-) Custo Variável Real Total:</span>
                  <span className="text-[#C92F0A]">-{formatCurrency(selectedCalc.realVariableCost)}</span>
                </div>
              </div>

              {/* B2B Results */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                <div className="bg-white rounded-xl p-2.5 border border-[#63D3E9]/60">
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Margem Contribuição (R$)</span>
                  <span className="text-base font-extrabold text-[#08627F]">{formatCurrency(selectedCalc.mcB2B)}</span>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-[#63D3E9]/60">
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Margem Contribuição (%)</span>
                  <span className="text-base font-extrabold text-[#08627F]">{formatPercent(selectedCalc.mcPercentB2B)}</span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 flex justify-between px-1">
                <span>Markup Multiplicador: <strong>{formatDecimal(selectedCalc.markupB2B, 2)}x</strong></span>
                <span>Margem de escala (&gt; 25%)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Comparison Chart of Margins across the 6 items */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111111] mb-1">Comparativo de Rentabilidade: Margem de Contribuição (%) por Canal</h2>
            <p className="text-xs text-neutral-500 mb-4">
              Compare visualmente o retorno percentual de cada prato no canal B2C (verde) e no canal B2B (azul-ciano).
            </p>
          </div>
          {bestChannel && channelDifference !== null && (
            <div className="rounded-xl border border-[#CFF2FA] bg-[#EAF9FD] px-3 py-2 text-xs text-[#06495E]">
              <span className="block font-bold">Melhor canal: {bestChannel}</span>
              <span>Média superior em {formatDecimal(channelDifference, 1)} p.p.</span>
            </div>
          )}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marginComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" domain={[0, 60]} />
              <Tooltip formatter={(val: number) => `${val}%`} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="mcB2C" name="Margem B2C (%)" fill="#9DDD25" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mcB2B" name="Margem B2B (%)" fill="#00A6D7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {bestChannel && channelDifference !== null && (
          <p className="mt-4 rounded-xl border border-neutral-200 bg-[#F7F7F5] px-4 py-3 text-sm text-neutral-700">
            <strong>Insight:</strong> {bestChannel} apresenta margem de contribuição média superior ao outro canal em {formatDecimal(channelDifference, 1)} pontos percentuais na base demonstrativa.
          </p>
        )}
      </div>

      {/* Decision-oriented profitability analysis */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard icon={<Trophy className="h-4 w-4" />} title="Maior margem" tone="green">
          {highestMargin ? <><strong>{highestMargin.product.name} · {highestMargin.channel}</strong><br />MC de {formatPercent(highestMargin.margin)} — maior margem entre os produtos analisados.</> : 'Dados insuficientes para este indicador.'}
        </InsightCard>
        <InsightCard icon={<Calculator className="h-4 w-4" />} title="Maior impacto financeiro" tone="cyan">
          {highestFinancialImpact && highestFinancialImpact.revenue > 0 ? <><strong>{highestFinancialImpact.product.name}</strong><br />{formatCurrency(highestFinancialImpact.contribution)} de MC total sobre {formatCurrency(highestFinancialImpact.revenue)} em vendas.</> : 'Dados insuficientes para este indicador.'}
        </InsightCard>
        <InsightCard icon={<CircleAlert className="h-4 w-4" />} title="Menor margem" tone="yellow">
          {lowestMargin ? <><strong>{lowestMargin.product.name} · {lowestMargin.channel}</strong><br />MC de {formatPercent(lowestMargin.margin)} — menor margem entre os produtos analisados.</> : 'Dados insuficientes para este indicador.'}
        </InsightCard>
        <InsightCard icon={<TrendingUp className="h-4 w-4" />} title="Melhor canal" tone="cyan">
          {bestChannel && channelDifference !== null ? <><strong>{bestChannel}</strong><br />Margem média {formatDecimal(channelDifference, 1)} p.p. superior ao outro canal.</> : 'Dados insuficientes para este indicador.'}
        </InsightCard>
      </section>
    </div>
  );
};

function MetricCard({ label, value, context, tone }: { label: string; value: string; context: string; tone: 'green' | 'yellow' | 'orange' | 'cyan' }) {
  const tones = {
    green: 'bg-[#F4FAEA] text-[#5F9C1C]',
    yellow: 'bg-[#FFF8E6] text-[#AE7000]',
    orange: 'bg-[#FFF0EA] text-[#C92F0A]',
    cyan: 'bg-[#EAF9FD] text-[#08627F]',
  };
  return <div className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs"><span className="block min-h-10 text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span><div className={`mt-3 inline-flex w-fit rounded-lg px-2 py-0.5 text-lg font-black ${tones[tone]}`}>{value}</div><p className="mt-3 text-xs text-neutral-500">{context}</p></div>;
}

function InsightCard({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: 'green' | 'yellow' | 'cyan'; children: React.ReactNode }) {
  const tones = {
    green: 'border-[#CAE79A] bg-[#F4FAEA]/60 text-[#426D12]',
    yellow: 'border-[#FFE080] bg-[#FFF8E6]/70 text-[#875700]',
    cyan: 'border-[#CFF2FA] bg-[#EAF9FD]/70 text-[#06495E]',
  };
  return <div className={`rounded-xl border p-4 text-xs leading-5 ${tones[tone]}`}><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">{icon}<span>{title}</span></div><p className="text-neutral-700">{children}</p></div>;
}
