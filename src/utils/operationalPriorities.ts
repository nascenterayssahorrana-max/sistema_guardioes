import { CommercialPerformanceItem, CommercialPerformanceReport } from './commercialGoals';
import { StockIntelligenceReport } from './stockIntelligence';

export type OperationalPriorityTone = 'critical' | 'attention' | 'info';
export interface OperationalPriority {
  tone: OperationalPriorityTone;
  title: string;
  cause: string;
  impact: string;
  action: string;
}
export interface CommercialHighlight {
  item: CommercialPerformanceItem;
  achievement?: number;
}
export interface ProductOperationalMetric { code: string; name: string; units: number; marginPercent: number; }

const achievementOf = (item: CommercialPerformanceItem) => item.revenueAchievement ?? item.unitsAchievement;
const byAchievement = (items: CommercialPerformanceItem[]) => items.map((item) => ({ item, achievement: achievementOf(item) })).filter((entry): entry is CommercialHighlight & { achievement: number } => entry.achievement !== undefined).sort((a, b) => b.achievement - a.achievement);

export const getCommercialHighlights = (report: CommercialPerformanceReport) => {
  const scored = byAchievement(report.items);
  return {
    primary: report.items[0],
    bestChannel: scored.find(({ item }) => Boolean(item.goal.channel) && !item.goal.productCode),
    bestProduct: scored.find(({ item }) => Boolean(item.goal.productCode)),
    below: report.items.filter((item) => item.status === 'below' || item.status === 'closed'),
  };
};

export const buildOperationalPriorities = ({ commercial, stock, productMetrics, operationalProfit, topLoss }: { commercial: CommercialPerformanceReport; stock: StockIntelligenceReport; productMetrics: ProductOperationalMetric[]; operationalProfit: number; topLoss?: { reason: string; totalCost: number; percentage: number }; }): OperationalPriority[] => {
  const priorities: OperationalPriority[] = [];
  const highlights = getCommercialHighlights(commercial);
  const productNameByCode = new Map(productMetrics.map((product) => [product.code, product.name]));
  const riskyStock = stock.items.filter((item) => item.risk === 'critical' || item.risk === 'attention');

  if (operationalProfit < 0) priorities.push({ tone: 'critical', title: 'Resultado operacional negativo', cause: `O resultado atual é negativo em ${Math.abs(operationalProfit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, impact: 'A operação não cobre integralmente os custos fixos de referência.', action: 'Revisar margem, volume, despesas e as prioridades comerciais antes de qualquer decisão.' });
  stock.items.filter((item) => item.risk === 'critical').forEach((item) => priorities.push({ tone: 'critical', title: `Estoque crítico: ${item.supply.name}`, cause: `Saldo de ${item.supply.currentStock} ${item.supply.unit}, cobertura ${item.coverageDays === undefined ? 'indisponível' : `${item.coverageDays.toFixed(1)} dia(s)`}.`, impact: `Pode comprometer ${item.affectedProducts.join(', ') || 'produtos vinculados'}.`, action: item.action }));

  commercial.items.filter((item) => item.status === 'below' || item.status === 'closed').forEach((item) => priorities.push({ tone: 'critical', title: `Meta abaixo do ritmo: ${item.label}`, cause: `Atingimento de ${achievementOf(item) === undefined ? '—' : `${achievementOf(item)!.toFixed(1)}%`} e desvio de ${item.revenueDeviation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, impact: item.status === 'closed' ? 'O período foi encerrado sem atingir a meta configurada.' : 'O resultado atual está abaixo do objetivo do período.', action: 'Revisar o plano comercial e o canal ou produto afetado.' }));

  commercial.items.filter((item) => item.goal.productCode && item.status === 'achieved').forEach((item) => {
    const productName = productNameByCode.get(item.goal.productCode!) ?? item.label;
    riskyStock.filter((stockItem) => stockItem.affectedProducts.includes(productName)).forEach((stockItem) => priorities.push({ tone: stockItem.risk === 'critical' ? 'critical' : 'attention', title: `Demanda comercial × estoque: ${productName}`, cause: `Meta atingida (${achievementOf(item)?.toFixed(1) ?? '—'}%) e insumo ${stockItem.supply.name} em risco ${stockItem.risk === 'critical' ? 'crítico' : 'de atenção'}.`, impact: `Saldo ${stockItem.supply.currentStock} ${stockItem.supply.unit}; consumo estimado ${stockItem.estimatedConsumption === undefined ? 'indisponível' : `${stockItem.estimatedConsumption.toFixed(2)} ${stockItem.supply.unit}`}; cobertura ${stockItem.coverageDays === undefined ? 'indisponível' : `${stockItem.coverageDays.toFixed(1)} dia(s)`}.`, action: `Recomenda-se verificar reposição do insumo. ${stockItem.action}` }));
  });

  if (topLoss) priorities.push({ tone: 'attention', title: `Perdas: ${topLoss.reason}`, cause: `${topLoss.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} perdidos (${topLoss.percentage.toFixed(1)}% das perdas).`, impact: 'As perdas elevam o custo real e reduzem a margem disponível.', action: 'Investigar a causa e o setor responsável antes de definir contramedidas.' });

  const averageMargin = productMetrics.length ? productMetrics.reduce((sum, product) => sum + product.marginPercent, 0) / productMetrics.length : undefined;
  const highVolume = [...productMetrics].sort((a, b) => b.units - a.units)[0];
  if (highVolume && averageMargin !== undefined && highVolume.marginPercent < averageMargin) priorities.push({ tone: 'attention', title: `Alto volume com MC abaixo da média: ${highVolume.name}`, cause: `${highVolume.units} unidades vendidas com MC de ${highVolume.marginPercent.toFixed(1)}%, abaixo da média de ${averageMargin.toFixed(1)}%.`, impact: 'O produto concentra volume, mas contribui proporcionalmente menos para o resultado.', action: 'Revisar preço, mix, custos variáveis e o canal predominante.' });
  riskyStock.filter((item) => item.risk === 'attention').forEach((item) => priorities.push({ tone: 'attention', title: `Cobertura baixa: ${item.supply.name}`, cause: `Cobertura de ${item.coverageDays?.toFixed(1) ?? '—'} dia(s).`, impact: `Produtos afetados: ${item.affectedProducts.join(', ') || 'não identificados'}.`, action: item.action }));
  stock.recipeIssues.forEach((issue) => priorities.push({ tone: 'attention', title: `Ficha técnica pendente: ${issue.productName}`, cause: issue.message, impact: 'Não é possível relacionar com segurança a demanda comercial ao consumo de insumos.', action: 'Completar ou corrigir a ficha técnica antes de usar a cobertura desse produto para decisão operacional.' }));
  commercial.items.filter((item) => item.status === 'achieved').forEach((item) => priorities.push({ tone: 'info', title: `Meta atingida: ${item.label}`, cause: `Atingimento de ${achievementOf(item)?.toFixed(1) ?? '—'}%.`, impact: 'O recorte já alcançou o objetivo configurado.', action: 'Manter o acompanhamento e confirmar a capacidade operacional para sustentar o resultado.' }));
  if (!commercial.hasGoals) priorities.push({ tone: 'info', title: 'Sem meta comercial configurada', cause: commercial.hasSales ? 'Há vendas registradas, mas não existe meta correspondente.' : 'Não há vendas nem metas para leitura comercial.', impact: 'Não é possível medir atingimento ou ritmo comercial.', action: 'Cadastre uma meta para o período e recorte que deseja acompanhar.' });
  const order: Record<OperationalPriorityTone, number> = { critical: 0, attention: 1, info: 2 };
  return priorities.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 8);
};
