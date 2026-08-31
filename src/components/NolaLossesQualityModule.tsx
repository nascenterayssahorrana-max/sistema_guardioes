import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CircleAlert,
  FileSpreadsheet,
  Layers,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
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
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { ProductCode } from '../types/finance';
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from '../utils/formatters';
import { DEMO_DATA_CONTEXT } from '../data';

interface NolaLossesQualityModuleProps {
  onOpenAddNolaModal: () => void;
}

const SECTOR_COLORS: Record<string, string> = {
  'Cozinha Central': '#FFB800',
  'Produção - Massas': '#F0440C',
  Produção: '#0B9FC7',
  'Estoque Central': '#75B82A',
  COZINHA_CENTRAL: '#FFB800',
  PRODUCAO_MASSAS: '#F0440C',
  PRODUCAO: '#0B9FC7',
  ESTOQUE_CENTRAL: '#75B82A',
};

const formatOrigin = (origin: string) => origin.replace(/\bNOLA\s*-\s*/gi, '');

export const NolaLossesQualityModule: React.FC<NolaLossesQualityModuleProps> = ({ onOpenAddNolaModal }) => {
  const { nolaMovements, deleteNolaMovement } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState<'ALL' | ProductCode>('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');

  const availableSectors = useMemo(() => [...new Set(nolaMovements.map((movement) => movement.sector))].sort(), [nolaMovements]);
  const availableProducts = useMemo(() => Array.from(new Map(nolaMovements.map((movement) => [movement.productCode, movement.productName])).entries()), [nolaMovements]);
  const availableReasons = useMemo(() => [...new Set(nolaMovements.map((movement) => movement.lossReason))].sort(), [nolaMovements]);

  const filteredMovements = useMemo(() => nolaMovements.filter((movement) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = movement.id.toLowerCase().includes(term)
      || movement.productName.toLowerCase().includes(term)
      || movement.lossReason.toLowerCase().includes(term)
      || movement.origin.toLowerCase().includes(term);
    return matchesSearch
      && (sectorFilter === 'ALL' || movement.sector === sectorFilter)
      && (productFilter === 'ALL' || movement.productCode === productFilter)
      && (reasonFilter === 'ALL' || movement.lossReason === reasonFilter);
  }), [nolaMovements, searchTerm, sectorFilter, productFilter, reasonFilter]);

  const analysis = useMemo(() => {
    const totalLoss = filteredMovements.reduce((total, movement) => total + movement.totalLossValue, 0);
    const totalDiscarded = filteredMovements.reduce((total, movement) => total + movement.discardedUnits, 0);
    const aggregate = <T extends string>(key: (movement: typeof filteredMovements[number]) => T) => {
      const items = new Map<T, { value: number; units: number; records: number }>();
      filteredMovements.forEach((movement) => {
        const name = key(movement);
        const current = items.get(name) ?? { value: 0, units: 0, records: 0 };
        current.value += movement.totalLossValue;
        current.units += movement.discardedUnits;
        current.records += 1;
        items.set(name, current);
      });
      return [...items.entries()]
        .map(([name, value]) => ({ name, ...value, percentage: totalLoss > 0 ? (value.value / totalLoss) * 100 : 0 }))
        .sort((a, b) => b.value - a.value);
    };

    const reasons = aggregate((movement) => movement.lossReason);
    let accumulated = 0;
    const pareto = reasons.map((reason) => {
      accumulated += reason.percentage;
      return { ...reason, accumulated };
    });
    const sectors = aggregate((movement) => movement.sector);
    const products = aggregate((movement) => movement.productName);
    const weeks = aggregate((movement) => movement.week)
      .map((week) => ({ ...week, weekNumber: Number(week.name.replace('S', '')) || 0 }))
      .sort((a, b) => a.weekNumber - b.weekNumber);
    return { totalLoss, totalDiscarded, records: filteredMovements.length, pareto, sectors, products, weeks };
  }, [filteredMovements]);

  const primaryCause = analysis.pareto[0];
  const primarySector = analysis.sectors[0];
  const primaryProduct = analysis.products[0];
  const highestLossWeek = [...analysis.weeks].sort((a, b) => b.value - a.value)[0];

  const handleExportCSV = () => {
    const headers = ['ID', 'Semana', 'Setor', 'Código Produto', 'Produto', 'Qtd Produzida', 'Qtd Descartada', 'Custo Unitário', 'Perda Total R$', 'Motivo', 'Origem'];
    const rows = filteredMovements.map((movement) => [
      movement.id, movement.week, movement.sector, movement.productCode, `"${movement.productName}"`,
      movement.producedUnits, movement.discardedUnits, movement.unitCost.toFixed(2), movement.totalLossValue.toFixed(2),
      `"${movement.lossReason}"`, `"${formatOrigin(movement.origin)}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `guardioes_lasanha_perdas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C92F0A]"><AlertTriangle className="h-4 w-4" /><span>Controle de qualidade industrial e refugo</span></div>
            <h1 className="text-xl font-bold text-[#111111]">Gestão de Perdas</h1>
            <p className="mt-1 max-w-3xl text-xs text-neutral-500 sm:text-sm">Conecte os apontamentos operacionais ao impacto financeiro e priorize onde investigar primeiro.</p>
            <p className="mt-2 text-[11px] text-neutral-500"><strong className="text-neutral-700">{DEMO_DATA_CONTEXT.label}</strong> · Perdas: {DEMO_DATA_CONTEXT.nolaLosses.periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} id="btn-export-nola-csv" className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-[#F5F5F5] px-3 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200"><FileSpreadsheet className="h-4 w-4 text-[#5F9C1C]" /><span>Exportar recorte CSV</span></button>
            <button onClick={onOpenAddNolaModal} id="btn-add-nola-main" className="flex items-center gap-2 rounded-xl bg-[#C92F0A] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#E33B0C] sm:text-sm"><PlusCircle className="h-4 w-4" /><span>Lançar apontamento</span></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Perda total" value={formatCurrency(analysis.totalLoss)} context={`Valor financeiro do recorte · ${analysis.records} registros`} tone="red" />
        <MetricCard label="Unidades descartadas" value={`${formatNumber(analysis.totalDiscarded)} un.`} context="Quantidade de perdas no recorte" tone="dark" />
        <MetricCard label="Setor com maior impacto" value={primarySector?.name ?? 'Dados insuficientes'} context={primarySector ? `${formatCurrency(primarySector.value)} · ${formatPercent(primarySector.percentage)} do valor perdido` : 'Sem dados no recorte'} tone="yellow" />
        <MetricCard label="Impacto no custo" value="Já rateado" context="As perdas compõem o custo real conforme a metodologia da base demonstrativa." tone="cyan" />
      </div>

      <p className="rounded-xl border border-[#CFF2FA] bg-[#EAF9FD] px-4 py-3 text-sm text-[#06495E]"><strong>Relação com o custo real:</strong> os valores financeiros das perdas desta base são rateados ao custo real por produto. Não é exibido percentual sobre custo total porque a base de perdas cobre 27 semanas e não há denominador temporalmente comparável neste recorte.</p>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-bold text-[#111111]">Pareto de perdas por causa</h2><p className="text-xs text-neutral-500">Barras: valor perdido. Linha: percentual acumulado no recorte selecionado.</p></div><span className="w-fit rounded-lg border border-[#FFE080] bg-[#FFF8E6] px-2.5 py-1 text-xs font-semibold text-[#875700]">Priorize as maiores causas financeiras</span></div>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={analysis.pareto} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#525252' }} angle={-20} textAnchor="end" interval={0} /><YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#525252' }} tickFormatter={(value) => `R$ ${value}`} /><YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#AE7000' }} unit="%" /><Tooltip formatter={(value: number, name: string) => name === 'Percentual acumulado (%)' ? `${formatDecimal(value, 1)}%` : formatCurrency(value)} /><Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} /><Bar yAxisId="left" dataKey="value" name="Valor perdido (R$)" fill="#FFBC0D" radius={[4, 4, 0, 0]} /><Line yAxisId="right" type="monotone" dataKey="accumulated" name="Percentual acumulado (%)" stroke="#FFBC0D" strokeWidth={3} dot={{ r: 4, fill: '#FFB800' }} /></ComposedChart></ResponsiveContainer></div>
        </div>
        <PriorityCard icon={<CircleAlert className="h-4 w-4" />} title="Principal causa" tone="red">{primaryCause ? <><strong>{primaryCause.name}</strong><br />{formatCurrency(primaryCause.value)} · {formatPercent(primaryCause.percentage)} das perdas.</> : 'Dados insuficientes para este indicador.'}</PriorityCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs"><h2 className="text-base font-bold text-[#111111]">Perdas por setor</h2><p className="mb-4 text-xs text-neutral-500">Ranking por valor financeiro do recorte atual.</p><div className="space-y-3">{analysis.sectors.map((sector) => <div key={sector.name} className="space-y-1"><div className="flex justify-between gap-3 text-xs font-semibold"><span className="text-neutral-800">{sector.name}</span><span className="text-[#C92F0A]">{formatCurrency(sector.value)} ({formatPercent(sector.percentage)})</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F5F5]"><div className="h-full rounded-full" style={{ width: `${sector.percentage}%`, backgroundColor: SECTOR_COLORS[sector.name] || '#0B9FC7' }} /></div></div>)}{analysis.sectors.length === 0 && <p className="text-sm text-neutral-500">Dados insuficientes para este indicador.</p>}</div></div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs lg:col-span-2"><h2 className="text-base font-bold text-[#111111]">Evolução semanal de perdas</h2><p className="mb-4 text-xs text-neutral-500">Semana → valor perdido, sem previsão ou tendência projetada.</p><div className="h-56"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={analysis.weeks} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#525252' }} interval={2} /><YAxis tick={{ fontSize: 10, fill: '#525252' }} tickFormatter={(value) => `R$ ${value}`} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Bar dataKey="value" name="Perda semanal (R$)" fill="#FFBC0D" radius={[2, 2, 0, 0]} /></ComposedChart></ResponsiveContainer></div></div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <PriorityCard icon={<Layers className="h-4 w-4" />} title="1º setor para investigar" tone="yellow">{primarySector ? <><strong>{primarySector.name}</strong><br />{formatCurrency(primarySector.value)} · maior impacto financeiro entre os setores.</> : 'Dados insuficientes para este indicador.'}</PriorityCard>
        <PriorityCard icon={<AlertTriangle className="h-4 w-4" />} title="2ª causa para investigar" tone="red">{primaryCause ? <><strong>{primaryCause.name}</strong><br />{formatCurrency(primaryCause.value)} · principal causa de perda financeira.</> : 'Dados insuficientes para este indicador.'}</PriorityCard>
        <PriorityCard icon={<Sparkles className="h-4 w-4" />} title="3º produto para investigar" tone="cyan">{primaryProduct ? <><strong>{primaryProduct.name}</strong><br />{formatCurrency(primaryProduct.value)} · {formatNumber(primaryProduct.units)} unidades descartadas.</> : 'Dados insuficientes para este indicador.'}</PriorityCard>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InsightCard icon={<BarChart3 className="h-4 w-4" />} title="Impacto da causa" tone="red">{primaryCause ? `${primaryCause.name} representa ${formatPercent(primaryCause.percentage)} do valor total perdido no recorte.` : 'Dados insuficientes para este indicador.'}</InsightCard>
        <InsightCard icon={<CircleAlert className="h-4 w-4" />} title="Impacto do setor" tone="yellow">{primarySector ? `${primarySector.name} concentra o maior impacto financeiro entre os setores analisados.` : 'Dados insuficientes para este indicador.'}</InsightCard>
        <InsightCard icon={<Sparkles className="h-4 w-4" />} title="Semana crítica" tone="cyan">{highestLossWeek ? `${highestLossWeek.name} apresentou o maior valor de perdas: ${formatCurrency(highestLossWeek.value)}.` : 'Dados insuficientes para este indicador.'}</InsightCard>
      </section>

      <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-base font-bold text-[#111111]">Tabela de apontamentos</h2><p className="text-xs text-neutral-500">Exibindo <strong>{filteredMovements.length}</strong> de {nolaMovements.length} registros. Todos os indicadores e gráficos acima usam o mesmo recorte.</p></div><div className="flex flex-wrap items-center gap-2"><label className="relative"><span className="sr-only">Buscar perda</span><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" /><input type="text" placeholder="Buscar motivo ou produto..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-44 rounded-lg border border-neutral-300 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs sm:w-56" /></label><select aria-label="Filtrar por setor" value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)} className="rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-700"><option value="ALL">Todos os setores</option>{availableSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select><select aria-label="Filtrar por produto" value={productFilter} onChange={(event) => setProductFilter(event.target.value as 'ALL' | ProductCode)} className="rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-700"><option value="ALL">Todos os produtos</option>{availableProducts.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select><select aria-label="Filtrar por causa" value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)} className="rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-700"><option value="ALL">Todas as causas</option>{availableReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></div></div>
        <div className="max-h-96 overflow-x-auto"><table className="min-w-[980px] w-full divide-y divide-neutral-200 text-xs"><thead className="sticky top-0 bg-neutral-50"><tr className="font-semibold text-neutral-600"><th className="px-3 py-2 text-left">Data / sem.</th><th className="px-3 py-2 text-left">Setor</th><th className="px-3 py-2 text-left">Produto</th><th className="px-3 py-2 text-right">Descartado</th><th className="px-3 py-2 text-right">Perda total</th><th className="px-3 py-2 text-right">% do recorte</th><th className="px-3 py-2 text-left">Motivo / origem</th><th className="px-3 py-2 text-right">Ação</th></tr></thead><tbody className="divide-y divide-neutral-100">{filteredMovements.map((movement) => <tr key={movement.id} className="transition-colors hover:bg-neutral-50/60"><td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-neutral-500"><strong className="text-neutral-700">{movement.date || movement.id}</strong> <span>({movement.week})</span></td><td className="px-3 py-2"><span className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${SECTOR_COLORS[movement.sector] || '#0B9FC7'}15`, color: SECTOR_COLORS[movement.sector] || '#08627F' }}>{movement.sector}</span></td><td className="px-3 py-2 font-medium text-[#111111]"><span className="mr-1 font-mono text-[10px] text-neutral-400">{movement.productCode}</span>{movement.productName}</td><td className="px-3 py-2 text-right font-bold text-[#C92F0A]">{formatNumber(movement.discardedUnits)}</td><td className="bg-[#FFF0EA]/30 px-3 py-2 text-right font-black text-[#C92F0A]">{formatCurrency(movement.totalLossValue)}</td><td className="px-3 py-2 text-right text-neutral-600">{analysis.totalLoss > 0 ? formatPercent((movement.totalLossValue / analysis.totalLoss) * 100) : '—'}</td><td className="px-3 py-2"><div className="font-semibold text-neutral-800">{movement.lossReason}</div><div className="text-[10px] text-neutral-400">{formatOrigin(movement.origin)}</div></td><td className="px-3 py-2 text-right"><button onClick={() => deleteNolaMovement(movement.id)} className="rounded p-1 text-neutral-400 transition-colors hover:text-[#C92F0A]" title="Excluir registro" aria-label={`Excluir registro ${movement.id}`}><Trash2 className="h-3.5 w-3.5" /></button></td></tr>)}{filteredMovements.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-neutral-500">Dados insuficientes para este filtro.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
};

function MetricCard({ label, value, context, tone }: { label: string; value: string; context: string; tone: 'red' | 'dark' | 'yellow' | 'cyan' }) {
  const tones = { red: 'bg-[#FFF0EA] text-[#C92F0A]', dark: 'bg-[#111111] text-white', yellow: 'bg-[#FFF8E6] text-[#875700]', cyan: 'bg-[#EAF9FD] text-[#08627F]' };
  return <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span><div className={`mt-3 inline-flex rounded-xl px-2.5 py-1 text-xl font-black ${tones[tone]}`}>{value}</div><p className="mt-3 text-xs text-neutral-500">{context}</p></div>;
}

function PriorityCard({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: 'red' | 'yellow' | 'cyan'; children: React.ReactNode }) {
  const tones = { red: 'border-[#FFB79B] bg-[#FFF0EA]/70 text-[#962006]', yellow: 'border-[#FFE080] bg-[#FFF8E6]/70 text-[#875700]', cyan: 'border-[#CFF2FA] bg-[#EAF9FD]/70 text-[#06495E]' };
  return <div className={`rounded-xl border p-4 text-xs leading-5 ${tones[tone]}`}><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">{icon}<span>{title}</span></div><p className="text-neutral-700">{children}</p></div>;
}

function InsightCard({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: 'red' | 'yellow' | 'cyan'; children: React.ReactNode }) {
  return <PriorityCard icon={icon} title={title} tone={tone}>{children}</PriorityCard>;
}
