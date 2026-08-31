import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, CalendarRange, CircleAlert, PackageSearch, TrendingUp } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

type RankBy = 'units' | 'revenue' | 'mc' | 'mcPercent' | 'share';
const toComparableDate = (date?: string) => {
  if (!date) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [day, month, year] = date.split('/');
  return day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : date;
};
const shiftIsoDate = (date: string, days: number) => {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
};
const signedPercent = (value: number) => `${value > 0 ? '+' : ''}${formatPercent(value)}`;

export const ManagementAnalysisModule = () => {
  const { sales, products, productCalculations, nolaMovements, totalFixedCosts } = useFinance();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [channel, setChannel] = useState('ALL');
  const [product, setProduct] = useState('ALL');
  const [rankBy, setRankBy] = useState<RankBy>('mc');

  const analysis = useMemo(() => {
    const buildData = (start = '', end = '') => {
      const isWithinPeriod = (date?: string) => (!start || toComparableDate(date) >= start) && (!end || toComparableDate(date) <= end);
      const rows = sales.filter((sale) => isWithinPeriod(sale.date) && (channel === 'ALL' || sale.channel === channel) && (product === 'ALL' || sale.productCode === product));
      let gross = 0, tax = 0, direct = 0, loss = 0, units = 0;
      const by: Record<string, { name: string; units: number; revenue: number; mc: number }> = {};
      const timeline: Record<string, { date: string; revenue: number; mc: number; units: number }> = {};
      rows.forEach((sale) => {
        const calculation = productCalculations[sale.productCode];
        const rate = sale.taxRateApplied ?? (sale.channel === 'B2C' ? calculation?.product.taxRateB2C : calculation?.product.taxRateB2B) ?? (sale.channel === 'B2C' ? 7.5 : 5.5);
        const directCost = sale.financialSnapshotVersion ? (sale.directCostUnit ?? sale.variableCostUnit) : (calculation ? calculation.product.baseCost + calculation.product.packagingCost + calculation.product.directLaborCost + calculation.product.otherVariableCost : sale.variableCostUnit);
        const allocatedLoss = sale.financialSnapshotVersion ? sale.allocatedLossUnit : (calculation ? calculation.allocatedLossPerUnit : sale.allocatedLossUnit);
        const contribution = sale.totalRevenue * (1 - rate / 100) - (directCost + allocatedLoss) * sale.quantityUnits;
        gross += sale.totalRevenue; tax += sale.totalRevenue * rate / 100; direct += directCost * sale.quantityUnits; loss += allocatedLoss * sale.quantityUnits; units += sale.quantityUnits;
        const productRow = by[sale.productCode] ??= { name: sale.productName, units: 0, revenue: 0, mc: 0 };
        productRow.units += sale.quantityUnits; productRow.revenue += sale.totalRevenue; productRow.mc += contribution;
        const timelineRow = timeline[sale.date] ??= { date: sale.date, revenue: 0, mc: 0, units: 0 };
        timelineRow.revenue += sale.totalRevenue; timelineRow.mc += contribution; timelineRow.units += sale.quantityUnits;
      });
      const net = gross - tax, mc = net - direct - loss;
      return {
        rows, gross, tax, net, direct, loss, units, mc, mcPercent: gross > 0 ? mc / gross * 100 : 0, result: mc - totalFixedCosts,
        products: Object.values(by).map((entry) => ({ ...entry, mcPercent: entry.revenue > 0 ? entry.mc / entry.revenue * 100 : 0, share: gross > 0 ? entry.revenue / gross * 100 : 0 })),
        timeline: Object.values(timeline).sort((a, b) => toComparableDate(a.date).localeCompare(toComparableDate(b.date))),
        losses: nolaMovements.filter((movement) => isWithinPeriod(movement.date) && (product === 'ALL' || movement.productCode === product)).reduce((total, movement) => total + movement.totalLossValue, 0),
      };
    };
    const current = buildData(dateFrom, dateTo);
    const canCompare = Boolean(dateFrom && dateTo && dateFrom <= dateTo);
    if (!canCompare) return { current, previous: null, periodLabel: null };
    const days = Math.round((new Date(`${dateTo}T12:00:00`).getTime() - new Date(`${dateFrom}T12:00:00`).getTime()) / 86400000) + 1;
    const previousEnd = shiftIsoDate(dateFrom, -1);
    return { current, previous: buildData(shiftIsoDate(previousEnd, -(Math.max(days, 1) - 1)), previousEnd), periodLabel: `${shiftIsoDate(previousEnd, -(Math.max(days, 1) - 1))} a ${previousEnd}` };
  }, [sales, productCalculations, nolaMovements, totalFixedCosts, dateFrom, dateTo, channel, product]);

  const { current, previous } = analysis;
  const ranking = [...current.products].sort((a, b) => b[rankBy] - a[rankBy]);
  const comparisonMetrics = [
    { label: 'Receita', current: current.gross, previous: previous?.gross }, { label: 'Receita líquida', current: current.net, previous: previous?.net }, { label: 'Impostos', current: current.tax, previous: previous?.tax },
    { label: 'Custos variáveis', current: current.direct + current.loss, previous: previous ? previous.direct + previous.loss : undefined }, { label: 'MC', current: current.mc, previous: previous?.mc }, { label: 'MC%', current: current.mcPercent, previous: previous?.mcPercent, percent: true },
    { label: 'Resultado', current: current.result, previous: previous?.result }, { label: 'Volume', current: current.units, previous: previous?.units, units: true }, { label: 'Perdas', current: current.losses, previous: previous?.losses },
  ];
  const alerts = [
    current.mc < 0 ? 'Margem de contribuição negativa no período filtrado.' : null,
    current.mc >= 0 && current.mcPercent < 5 && current.rows.length > 0 ? 'Margem de contribuição muito próxima de zero.' : null,
    current.result < 0 && current.rows.length > 0 ? 'Resultado operacional negativo após os custos fixos de referência mensal.' : null,
    previous && previous.losses > 0 && current.losses > previous.losses ? 'As perdas aumentaram em relação ao período anterior comparável.' : null,
    ranking.find((entry) => entry.mcPercent < 10) ? `${ranking.find((entry) => entry.mcPercent < 10)?.name} apresenta margem abaixo de 10% no recorte.` : null,
  ].filter(Boolean) as string[];
  const leadProduct = ranking[0];
  const highVolumeProduct = [...current.products].sort((a, b) => b.units - a.units)[0];

  return <div className="space-y-6">
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#087B9F]">Leitura por dados reais</p><h1 className="text-xl font-bold text-[#111111]">Análise Gerencial</h1></div><div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#CFF2FA] bg-[#EAF9FD] px-3 py-2 text-xs font-semibold text-[#06495E]"><CalendarRange className="h-4 w-4" />Filtros somente nesta análise</div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="field-label">Período inicial<input aria-label="Data inicial" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} onInput={(event) => setDateFrom(event.currentTarget.value)} /></label><label className="field-label">Período final<input aria-label="Data final" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} onInput={(event) => setDateTo(event.currentTarget.value)} /></label><label className="field-label">Canal<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="ALL">Todos os canais</option><option>B2C</option><option>B2B</option></select></label><label className="field-label">Produto<select value={product} onChange={(event) => setProduct(event.target.value)}><option value="ALL">Todos os produtos</option>{products.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label className="field-label">Ordenar ranking<select value={rankBy} onChange={(event) => setRankBy(event.target.value as RankBy)}><option value="mc">Margem de contribuição</option><option value="revenue">Receita</option><option value="units">Volume</option><option value="mcPercent">MC%</option><option value="share">Participação</option></select></label></div>
    </section>
    {current.rows.length === 0 ? <EmptyState /> : <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Receita bruta" value={formatCurrency(current.gross)} /><MetricCard label="Receita líquida" value={formatCurrency(current.net)} /><MetricCard label="Margem de contribuição" value={formatCurrency(current.mc)} detail={formatPercent(current.mcPercent)} tone={current.mc >= 0 ? 'positive' : 'critical'} /><MetricCard label="Resultado operacional" value={formatCurrency(current.result)} detail={`${current.units} unidades`} tone={current.result >= 0 ? 'positive' : 'critical'} /><MetricCard label="Impostos" value={formatCurrency(current.tax)} /><MetricCard label="Custos variáveis reais" value={formatCurrency(current.direct + current.loss)} /><MetricCard label="Perdas" value={formatCurrency(current.losses)} /><MetricCard label="Vendas no filtro" value={String(current.rows.length)} /></section>
      <section className="grid gap-6 xl:grid-cols-3"><Panel className="xl:col-span-2" eyebrow="Evolução" title="Receita e margem de contribuição"><ResponsiveContainer width="100%" height={260}><LineChart data={current.timeline}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Line type="monotone" dataKey="revenue" name="Receita" stroke="#00A6D7" strokeWidth={2} /><Line type="monotone" dataKey="mc" name="MC" stroke="#9DDD25" strokeWidth={2} /></LineChart></ResponsiveContainer></Panel><Panel eyebrow="Volume" title="Unidades vendidas"><ResponsiveContainer width="100%" height={260}><BarChart data={current.timeline}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="units" name="Unidades" fill="#FFBC0D" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Panel></section>
      <ComparisonSection metrics={comparisonMetrics} periodLabel={analysis.periodLabel} />
      <section className="grid gap-6 xl:grid-cols-3"><section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs xl:col-span-2"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#087B9F]" /><div><p className="text-xs font-bold uppercase tracking-wider text-[#087B9F]">Ranking configurável</p><h2 className="font-bold text-[#111111]">Desempenho por produto</h2></div></div><table className="min-w-[700px] w-full text-sm"><thead><tr><th>Produto</th><th>Volume</th><th>Receita</th><th>MC</th><th>MC%</th><th>Participação</th></tr></thead><tbody>{ranking.map((entry) => <tr key={entry.name}><td className="font-semibold">{entry.name}</td><td>{entry.units}</td><td>{formatCurrency(entry.revenue)}</td><td className={entry.mc < 0 ? 'text-[#C92F0A]' : 'text-[#426D12]'}>{formatCurrency(entry.mc)}</td><td>{formatPercent(entry.mcPercent)}</td><td>{formatPercent(entry.share)}</td></tr>)}</tbody></table></section><section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"><p className="text-xs font-bold uppercase tracking-wider text-[#D99000]">Interpretação</p><h2 className="font-bold text-[#111111]">Insights gerenciais</h2><div className="mt-4 space-y-3 text-sm text-neutral-600"><Insight icon={<TrendingUp className="h-4 w-4" />} text={leadProduct ? `${leadProduct.name} lidera o ranking por ${rankLabel(rankBy)}.` : 'Não há produtos com vendas no período.'} /><Insight icon={<PackageSearch className="h-4 w-4" />} text={highVolumeProduct ? `${highVolumeProduct.name} teve o maior volume vendido.` : 'Não há volume suficiente para comparação.'} /><Insight icon={<CircleAlert className="h-4 w-4" />} text={previous ? 'A comparação abaixo considera apenas o período anterior de mesma duração.' : 'Defina início e fim de período para habilitar a comparação temporal.'} /></div></section></section>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#C92F0A]" /><div><p className="text-xs font-bold uppercase tracking-wider text-[#C92F0A]">Alertas gerenciais</p><h2 className="font-bold text-[#111111]">Pontos que pedem investigação</h2></div></div>{alerts.length > 0 ? <ul className="mt-4 grid gap-3 md:grid-cols-2">{alerts.map((alert) => <li key={alert} className="rounded-xl border border-[#FFB79B] bg-[#FFF0EA] p-3 text-sm text-[#691603]">{alert}</li>)}</ul> : <p className="mt-4 rounded-xl bg-[#F4FAEA] p-3 text-sm text-[#426D12]">Não há alertas críticos sustentados pelos dados do período filtrado.</p>}</section>
    </>}
  </div>;
};

function ComparisonSection({ metrics, periodLabel }: { metrics: { label: string; current: number; previous?: number; percent?: boolean; units?: boolean }[]; periodLabel: string | null }) {
  if (!periodLabel || !metrics.some((metric) => metric.previous !== undefined && metric.previous !== 0)) return <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-500"><strong className="text-neutral-700">Comparação entre períodos</strong><p className="mt-1">Não há período anterior comparável para este filtro.</p></section>;
  const display = (value: number, metric: { percent?: boolean; units?: boolean }) => metric.percent ? formatPercent(value) : metric.units ? `${value} un.` : formatCurrency(value);
  return <section className="rounded-2xl border border-[#CFF2FA] bg-[#F9FEFF] p-5 shadow-xs"><p className="text-xs font-bold uppercase tracking-wider text-[#087B9F]">Atual × anterior</p><h2 className="font-bold text-[#111111]">Comparação com {periodLabel}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((metric) => { const previous = metric.previous ?? 0; const difference = metric.current - previous; const variation = previous !== 0 ? difference / previous * 100 : null; return <div key={metric.label} className="rounded-xl border border-[#CFF2FA] bg-white p-3"><p className="text-xs font-semibold text-neutral-500">{metric.label}</p><dl className="mt-2 space-y-1 text-xs"><div className="flex justify-between gap-3"><dt>Atual</dt><dd className="font-bold text-[#111111]">{display(metric.current, metric)}</dd></div><div className="flex justify-between gap-3 text-neutral-500"><dt>Anterior</dt><dd>{display(previous, metric)}</dd></div><div className={`flex justify-between gap-3 font-semibold ${difference >= 0 ? 'text-[#426D12]' : 'text-[#C92F0A]'}`}><dt className="flex items-center gap-1">{difference >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}Variação</dt><dd>{difference > 0 ? '+' : ''}{display(difference, metric)}</dd></div><div className={`flex justify-between gap-3 font-semibold ${difference >= 0 ? 'text-[#426D12]' : 'text-[#C92F0A]'}`}><dt>Variação %</dt><dd>{variation === null ? '— (sem base percentual)' : signedPercent(variation)}</dd></div></dl></div>; })}</div></section>;
}
function MetricCard({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail?: string; tone?: 'neutral' | 'positive' | 'critical' }) { const styles = tone === 'positive' ? 'border-[#CAE79A] bg-[#F4FAEA]' : tone === 'critical' ? 'border-[#FFB79B] bg-[#FFF0EA]' : 'border-neutral-200 bg-white'; return <div className={`rounded-2xl border p-4 shadow-xs ${styles}`}><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-3 text-xl font-black tracking-tight text-[#111111]">{value}</p>{detail && <p className="mt-1 text-xs text-neutral-500">{detail}</p>}</div>; }
function Panel({ eyebrow, title, children, className = '' }: { eyebrow: string; title: string; children: React.ReactNode; className?: string }) { return <section className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs ${className}`}><p className="text-xs font-bold uppercase tracking-wider text-[#087B9F]">{eyebrow}</p><h2 className="font-bold text-[#111111]">{title}</h2><div className="mt-4">{children}</div></section>; }
function Insight({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex gap-2 rounded-xl bg-[#F7F7F5] p-3"><span className="mt-0.5 text-[#087B9F]">{icon}</span><p>{text}</p></div>; }
function EmptyState() { return <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center"><h2 className="font-bold text-neutral-800">Não há dados suficientes para esta análise.</h2><p className="mt-1 text-sm text-neutral-500">Ajuste os filtros ou registre vendas para visualizar indicadores, ranking e insights.</p></section>; }
function rankLabel(value: RankBy) { return ({ units: 'volume', revenue: 'receita', mc: 'margem de contribuição', mcPercent: 'MC%', share: 'participação na receita' })[value]; }
