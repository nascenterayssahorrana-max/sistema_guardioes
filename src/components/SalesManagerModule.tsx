import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CircleAlert,
  PlusCircle,
  Search,
  ShoppingCart,
  Trash2,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { ProductCode, SalesChannel } from '../types/finance';
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from '../utils/formatters';
import { DEMO_DATA_CONTEXT } from '../data';
import { CommercialPerformanceSection } from './CommercialPerformanceSection';

interface SalesManagerModuleProps {
  onOpenAddSaleModal: () => void;
}

type ChannelSummary = {
  channel: SalesChannel;
  units: number;
  revenue: number;
  contribution: number;
  mcPercent: number;
};

export const SalesManagerModule: React.FC<SalesManagerModuleProps> = ({ onOpenAddSaleModal }) => {
  const { sales, deleteSale, productCalculations, products } = useFinance();
  const [channelFilter, setChannelFilter] = useState<'ALL' | SalesChannel>('ALL');
  const [productFilter, setProductFilter] = useState<'ALL' | ProductCode>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => sales.filter((sale) => {
    const customerName = sale.customerName || sale.clientName || '';
    const matchesChannel = channelFilter === 'ALL' || sale.channel === channelFilter;
    const matchesProduct = productFilter === 'ALL' || sale.productCode === productFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = customerName.toLowerCase().includes(term)
      || sale.productName.toLowerCase().includes(term)
      || sale.productCode.toLowerCase().includes(term);
    return matchesChannel && matchesProduct && matchesSearch;
  }), [sales, channelFilter, productFilter, searchTerm]);

  // Sales created after the stability phase carry their own financial snapshot.
  const analyzedSales = useMemo(() => filteredSales.map((sale) => {
    const productCalc = productCalculations[sale.productCode];
    const taxRate = sale.taxRateApplied ?? (sale.channel === 'B2C'
      ? productCalc?.product.taxRateB2C
      : productCalc?.product.taxRateB2B) ?? (sale.channel === 'B2C' ? 7.5 : 5.5);
    const realVariableCost = sale.financialSnapshotVersion
      ? (sale.directCostUnit ?? sale.variableCostUnit) + sale.allocatedLossUnit
      : productCalc?.realVariableCost ?? sale.variableCostUnit + sale.allocatedLossUnit;
    const netRevenue = sale.totalRevenue * (1 - taxRate / 100);
    const contribution = netRevenue - realVariableCost * sale.quantityUnits;
    return {
      ...sale,
      contribution,
      mcPercent: sale.totalRevenue > 0 ? (contribution / sale.totalRevenue) * 100 : 0,
    };
  }), [filteredSales, productCalculations]);

  const channelSummaries = useMemo(() => {
    const summaries: Record<SalesChannel, ChannelSummary> = {
      B2C: { channel: 'B2C', units: 0, revenue: 0, contribution: 0, mcPercent: 0 },
      B2B: { channel: 'B2B', units: 0, revenue: 0, contribution: 0, mcPercent: 0 },
    };
    analyzedSales.forEach((sale) => {
      const summary = summaries[sale.channel];
      summary.units += sale.quantityUnits;
      summary.revenue += sale.totalRevenue;
      summary.contribution += sale.contribution;
    });
    (Object.values(summaries) as ChannelSummary[]).forEach((summary) => {
      summary.mcPercent = summary.revenue > 0 ? (summary.contribution / summary.revenue) * 100 : 0;
    });
    return summaries;
  }, [analyzedSales]);

  const totals = useMemo(() => {
    const units = analyzedSales.reduce((total, sale) => total + sale.quantityUnits, 0);
    const revenue = analyzedSales.reduce((total, sale) => total + sale.totalRevenue, 0);
    const contribution = analyzedSales.reduce((total, sale) => total + sale.contribution, 0);
    return { units, revenue, contribution, mcPercent: revenue > 0 ? (contribution / revenue) * 100 : 0 };
  }, [analyzedSales]);

  const bestChannel = useMemo(() => {
    const available = (Object.values(channelSummaries) as ChannelSummary[]).filter((summary) => summary.revenue > 0);
    return available.length > 0 ? [...available].sort((a, b) => b.mcPercent - a.mcPercent)[0] : null;
  }, [channelSummaries]);

  const channelMarginDifference = channelSummaries.B2C.revenue > 0 && channelSummaries.B2B.revenue > 0
    ? Math.abs(channelSummaries.B2C.mcPercent - channelSummaries.B2B.mcPercent)
    : null;

  const productSummaries = useMemo(() => products.map((product) => {
    const productSales = analyzedSales.filter((sale) => sale.productCode === product.code);
    const byChannel = (channel: SalesChannel) => {
      const salesInChannel = productSales.filter((sale) => sale.channel === channel);
      const units = salesInChannel.reduce((total, sale) => total + sale.quantityUnits, 0);
      const revenue = salesInChannel.reduce((total, sale) => total + sale.totalRevenue, 0);
      const contribution = salesInChannel.reduce((total, sale) => total + sale.contribution, 0);
      return { units, revenue, contribution, mcPercent: revenue > 0 ? (contribution / revenue) * 100 : 0 };
    };
    const b2c = byChannel('B2C');
    const b2b = byChannel('B2B');
    return {
      product,
      b2c,
      b2b,
      units: b2c.units + b2b.units,
      revenue: b2c.revenue + b2b.revenue,
      contribution: b2c.contribution + b2b.contribution,
    };
  }).filter((summary) => summary.units > 0), [products, analyzedSales]);

  const mostSoldProduct = [...productSummaries].sort((a, b) => b.units - a.units)[0];
  const highestRevenueProduct = [...productSummaries].sort((a, b) => b.revenue - a.revenue)[0];
  const highestContributionProduct = [...productSummaries].sort((a, b) => b.contribution - a.contribution)[0];
  const highestVolumeProductMC = mostSoldProduct && mostSoldProduct.revenue > 0
    ? (mostSoldProduct.contribution / mostSoldProduct.revenue) * 100
    : null;

  const channelChartData = [
    { channel: 'B2C', receita: channelSummaries.B2C.revenue, margem: Number(channelSummaries.B2C.mcPercent.toFixed(1)) },
    { channel: 'B2B', receita: channelSummaries.B2B.revenue, margem: Number(channelSummaries.B2B.mcPercent.toFixed(1)) },
  ];
  const productRevenueChartData = productSummaries.map((summary) => ({
    name: shortProductName(summary.product.name),
    b2c: summary.b2c.revenue,
    b2b: summary.b2b.revenue,
  }));

  const channelShare = (value: number, total: number) => total > 0 ? (value / total) * 100 : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#5F9C1C]">
              <ShoppingCart className="h-4 w-4" />
              <span>Registro de pedidos e análise comercial</span>
            </div>
            <h1 className="text-xl font-bold text-[#111111]">Vendas & Mix de Canais (B2C & B2B)</h1>
            <p className="mt-1 max-w-3xl text-xs text-neutral-500 sm:text-sm">Analise volume, receita e margem de contribuição por canal e produto.</p>
            <p className="mt-2 text-[11px] text-neutral-500"><strong className="text-neutral-700">{DEMO_DATA_CONTEXT.label}</strong> · Vendas: {DEMO_DATA_CONTEXT.sales.periodLabel}</p>
          </div>
          <button onClick={onOpenAddSaleModal} id="btn-add-sale-main" className="flex items-center space-x-2 rounded-xl bg-[#75B82A] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#8CCB35] sm:text-sm">
            <PlusCircle className="h-4 w-4" />
            <span>Lançar Nova Venda</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receita total" value={formatCurrency(totals.revenue)} context={`${analyzedSales.length} vendas no recorte atual`} tone="dark" />
        <MetricCard label="Volume vendido" value={`${formatNumber(totals.units)} un.`} context="Unidades no recorte atual" tone="cyan" />
        <MetricCard label="MC média" value={totals.revenue > 0 ? formatPercent(totals.mcPercent) : 'Dados insuficientes'} context={totals.revenue > 0 ? `${formatCurrency(totals.contribution)} de contribuição` : 'Registre vendas para calcular'} tone="yellow" />
        <MetricCard label="Melhor canal" value={bestChannel?.channel ?? 'Dados insuficientes'} context={bestChannel ? `MC média de ${formatPercent(bestChannel.mcPercent)}` : 'Compare os canais com vendas registradas'} tone="green" />
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChannelCard summary={channelSummaries.B2C} totals={totals} title="B2C · varejo direto" tone="green" />
        <ChannelCard summary={channelSummaries.B2B} totals={totals} title="B2B · atacado e foodservice" tone="cyan" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Receita por canal" description="Participação de cada canal na receita do recorte atual.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelChartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#525252' }} />
              <YAxis tick={{ fontSize: 11, fill: '#525252' }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="receita" name="Receita" fill="#00A6D7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Margem de contribuição por canal" description="A margem compara contribuição financeira, não apenas faturamento.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelChartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#525252' }} />
              <YAxis tick={{ fontSize: 11, fill: '#525252' }} unit="%" domain={[0, 'auto']} />
              <Tooltip formatter={(value: number) => `${formatDecimal(value, 1)}%`} />
              <Bar dataKey="margem" name="MC (%)" fill="#9DDD25" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {channelMarginDifference !== null && bestChannel && (
        <p className="rounded-xl border border-[#CFF2FA] bg-[#EAF9FD] px-4 py-3 text-sm text-[#06495E]">
          <strong>Insight:</strong> {bestChannel.channel} apresenta margem de contribuição média superior em {formatDecimal(channelMarginDifference, 1)} p.p. no recorte selecionado.
        </p>
      )}

      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#111111]">Rentabilidade por produto e canal</h2>
          <p className="text-xs text-neutral-500">Volume, receita e margem calculados a partir das vendas do recorte atual.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full divide-y divide-neutral-200 text-xs">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">Produto</th>
                <th className="px-3 py-3 text-right font-semibold">Volume B2C</th>
                <th className="px-3 py-3 text-right font-semibold">Receita B2C</th>
                <th className="px-3 py-3 text-right font-semibold">MC B2C</th>
                <th className="px-3 py-3 text-right font-semibold">Volume B2B</th>
                <th className="px-3 py-3 text-right font-semibold">Receita B2B</th>
                <th className="px-3 py-3 text-right font-semibold">MC B2B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {productSummaries.map((summary) => (
                <tr key={summary.product.code} className="hover:bg-neutral-50">
                  <td className="px-3 py-3 font-semibold text-[#111111]">{summary.product.name}<span className="ml-1.5 font-mono text-[10px] text-neutral-400">{summary.product.code}</span></td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatNumber(summary.b2c.units)}</td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatCurrency(summary.b2c.revenue)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-[#5F9C1C]">{summary.b2c.revenue > 0 ? formatPercent(summary.b2c.mcPercent) : '—'}</td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatNumber(summary.b2b.units)}</td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatCurrency(summary.b2b.revenue)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-[#08627F]">{summary.b2b.revenue > 0 ? formatPercent(summary.b2b.mcPercent) : '—'}</td>
                </tr>
              ))}
              {productSummaries.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Dados insuficientes para este indicador.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
        <h2 className="mb-1 text-base font-bold text-[#111111]">Faturamento por produto e canal</h2>
        <p className="mb-4 text-xs text-neutral-500">Composição de receita entre varejo direto e atacado, respeitando os filtros ativos.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productRevenueChartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#525252' }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#525252' }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="b2c" name="Varejo B2C (R$)" stackId="a" fill="#9DDD25" />
              <Bar dataKey="b2b" name="Atacado B2B (R$)" stackId="a" fill="#00A6D7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard icon={<Trophy className="h-4 w-4" />} title="Produto mais vendido" tone="green">
          {mostSoldProduct ? <><strong>{mostSoldProduct.product.name}</strong><br />{formatNumber(mostSoldProduct.units)} unidades, equivalentes a {formatPercent(channelShare(mostSoldProduct.units, totals.units) ?? 0)} do volume.</> : 'Dados insuficientes para este indicador.'}
        </InsightCard>
        <InsightCard icon={<BarChart3 className="h-4 w-4" />} title="Maior receita" tone="cyan">
          {highestRevenueProduct ? <><strong>{highestRevenueProduct.product.name}</strong><br />{formatCurrency(highestRevenueProduct.revenue)}, ou {formatPercent(channelShare(highestRevenueProduct.revenue, totals.revenue) ?? 0)} da receita.</> : 'Dados insuficientes para este indicador.'}
        </InsightCard>
        <InsightCard icon={<TrendingUp className="h-4 w-4" />} title="Maior contribuição" tone="green">
          {highestContributionProduct ? <><strong>{highestContributionProduct.product.name}</strong><br />{formatCurrency(highestContributionProduct.contribution)} de margem de contribuição total.</> : 'Dados insuficientes para este indicador.'}
        </InsightCard>
        <InsightCard icon={<CircleAlert className="h-4 w-4" />} title="Ponto de atenção" tone="yellow">
          {mostSoldProduct && highestVolumeProductMC !== null && highestVolumeProductMC < totals.mcPercent ? <><strong>{mostSoldProduct.product.name}</strong><br />Tem maior volume, mas MC de {formatPercent(highestVolumeProductMC)}, abaixo da média de {formatPercent(totals.mcPercent)}. Merece análise.</> : 'Nenhum alerta de volume com margem abaixo da média no recorte atual.'}
        </InsightCard>
      </section>

      <CommercialPerformanceSection />

      <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#111111]">Histórico de Vendas</h2>
            <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-xs font-semibold text-neutral-700">{filteredSales.length} registros</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Buscar cliente ou produto</span>
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input type="text" placeholder="Buscar cliente ou produto..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-48 rounded-lg border border-neutral-300 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs sm:w-60" />
            </label>
            <select aria-label="Filtrar por canal" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value as 'ALL' | SalesChannel)} className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
              <option value="ALL">Todos os canais</option><option value="B2C">Varejo (B2C)</option><option value="B2B">Atacado (B2B)</option>
            </select>
            <select aria-label="Filtrar por produto" value={productFilter} onChange={(event) => setProductFilter(event.target.value as 'ALL' | ProductCode)} className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
              <option value="ALL">Todos os produtos</option>
              {products.map((product) => <option key={product.code} value={product.code}>{product.name} ({product.code})</option>)}
            </select>
          </div>
        </div>
        <div className="max-h-96 overflow-x-auto">
          <table className="min-w-[920px] w-full divide-y divide-neutral-200 text-xs">
            <thead className="sticky top-0 bg-neutral-50"><tr className="font-semibold text-neutral-600"><th className="px-3 py-2.5 text-left">Data</th><th className="px-3 py-2.5 text-left">Cliente</th><th className="px-3 py-2.5 text-center">Canal</th><th className="px-3 py-2.5 text-left">Produto</th><th className="px-3 py-2.5 text-right">Qtd.</th><th className="px-3 py-2.5 text-right">Preço unit.</th><th className="px-3 py-2.5 text-right">Receita</th><th className="bg-[#FFF8E6]/50 px-3 py-2.5 text-right text-[#5E3B00]">Margem contrib.</th><th className="px-3 py-2.5 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {analyzedSales.map((sale) => <tr key={sale.id} className="transition-colors hover:bg-neutral-50/60"><td className="whitespace-nowrap px-3 py-2.5 text-neutral-500">{sale.date}</td><td className="px-3 py-2.5 font-medium text-[#111111]">{sale.customerName || sale.clientName || 'Cliente direto'}</td><td className="px-3 py-2.5 text-center"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sale.channel === 'B2C' ? 'bg-[#E3F3C4] text-[#426D12]' : 'bg-[#CFF2FA] text-[#06495E]'}`}>{sale.channel}</span></td><td className="px-3 py-2.5"><span className="font-semibold text-neutral-800">{sale.productName}</span><span className="ml-1 font-mono text-[10px] text-neutral-400">({sale.productCode})</span></td><td className="px-3 py-2.5 text-right font-semibold text-neutral-800">{formatNumber(sale.quantityUnits)}</td><td className="px-3 py-2.5 text-right text-neutral-600">{formatCurrency(sale.unitPrice)}</td><td className="px-3 py-2.5 text-right font-bold text-[#111111]">{formatCurrency(sale.totalRevenue)}</td><td className="bg-[#FFF8E6]/30 px-3 py-2.5 text-right font-bold text-[#AE7000]"><div>{formatCurrency(sale.contribution)}</div><div className="text-[10px] font-normal text-[#875700]">{formatPercent(sale.mcPercent)}</div></td><td className="px-3 py-2.5 text-right"><button onClick={() => deleteSale(sale.id)} className="rounded p-1 text-neutral-400 transition-colors hover:text-[#C92F0A]" title="Excluir venda" aria-label={`Excluir venda ${sale.id}`}><Trash2 className="h-3.5 w-3.5" /></button></td></tr>)}
              {analyzedSales.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-neutral-500">Dados insuficientes para este filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

function ChannelCard({ summary, totals, title, tone }: { summary: ChannelSummary; totals: { units: number; revenue: number; contribution: number }; title: string; tone: 'green' | 'cyan' }) {
  const isGreen = tone === 'green';
  const volumeShare = totals.units > 0 ? (summary.units / totals.units) * 100 : 0;
  const revenueShare = totals.revenue > 0 ? (summary.revenue / totals.revenue) * 100 : 0;
  const contributionShare = totals.contribution > 0 ? (summary.contribution / totals.contribution) * 100 : 0;
  return <div className={`rounded-2xl border p-5 shadow-xs ${isGreen ? 'border-[#CAE79A] bg-[#F4FAEA]/50' : 'border-[#CFF2FA] bg-[#EAF9FD]/50'}`}><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-[#111111]">{title}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isGreen ? 'bg-[#E3F3C4] text-[#426D12]' : 'bg-[#CFF2FA] text-[#06495E]'}`}>{summary.channel}</span></div><div className="grid grid-cols-2 gap-3 text-xs"><ChannelMetric label="Volume" value={`${formatNumber(summary.units)} un.`} detail={`${formatPercent(volumeShare)} do volume`} /><ChannelMetric label="Receita" value={formatCurrency(summary.revenue)} detail={`${formatPercent(revenueShare)} da receita`} /><ChannelMetric label="MC total" value={formatCurrency(summary.contribution)} detail={`${formatPercent(contributionShare)} da contribuição`} /><ChannelMetric label="MC média" value={summary.revenue > 0 ? formatPercent(summary.mcPercent) : '—'} detail="Sobre a receita bruta" /></div></div>;
}

function ChannelMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-white/80 bg-white/75 p-3"><span className="block text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</span><strong className="mt-1 block text-sm text-[#111111]">{value}</strong><span className="mt-1 block text-[10px] text-neutral-500">{detail}</span></div>;
}

function MetricCard({ label, value, context, tone }: { label: string; value: string; context: string; tone: 'dark' | 'green' | 'yellow' | 'cyan' }) {
  const tones = { dark: 'bg-[#111111] text-white', green: 'bg-[#F4FAEA] text-[#5F9C1C]', yellow: 'bg-[#FFF8E6] text-[#AE7000]', cyan: 'bg-[#EAF9FD] text-[#08627F]' };
  return <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span><div className={`mt-3 inline-flex rounded-xl px-2.5 py-1 text-xl font-black ${tones[tone]}`}>{value}</div><p className="mt-3 text-xs text-neutral-500">{context}</p></div>;
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs"><h2 className="text-base font-bold text-[#111111]">{title}</h2><p className="mt-1 text-xs text-neutral-500">{description}</p><div className="mt-4 h-56">{children}</div></div>;
}

function InsightCard({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: 'green' | 'yellow' | 'cyan'; children: React.ReactNode }) {
  const tones = { green: 'border-[#CAE79A] bg-[#F4FAEA]/60 text-[#426D12]', yellow: 'border-[#FFE080] bg-[#FFF8E6]/70 text-[#875700]', cyan: 'border-[#CFF2FA] bg-[#EAF9FD]/70 text-[#06495E]' };
  return <div className={`rounded-xl border p-4 text-xs leading-5 ${tones[tone]}`}><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">{icon}<span>{title}</span></div><p className="text-neutral-700">{children}</p></div>;
}

function shortProductName(name: string) {
  return name.replace('Lasanha ', 'Las. ').replace('Rondelli ', 'Rond. ').replace('Nhoque ', 'Nh. ').replace('Ravioli ', 'Rav. ');
}
