import { CommercialGoal, Product, ProductCode, SaleRecord, SalesChannel } from '../types/finance';

export type CommercialGoalStatus = 'achieved' | 'in_progress' | 'below' | 'no_target' | 'closed';
export interface CommercialFilters { from?: string; to?: string; channel?: SalesChannel; productCode?: ProductCode; }
export interface CommercialPerformanceItem {
  goal: CommercialGoal;
  label: string;
  revenueActual: number;
  unitsActual: number;
  revenueAchievement?: number;
  unitsAchievement?: number;
  revenueDeviation: number;
  unitsDeviation: number;
  remainingDays?: number;
  revenueDailyPace?: number;
  unitsDailyPace?: number;
  status: CommercialGoalStatus;
  alert?: string;
}
export interface CommercialPerformanceReport {
  items: CommercialPerformanceItem[];
  filteredSalesCount: number;
  hasSales: boolean;
  hasGoals: boolean;
  alerts: CommercialPerformanceItem[];
}

const iso = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
const toUtc = (value: string) => { const [year, month, day] = value.split('-').map(Number); return Date.UTC(year, month - 1, day); };
const daysInclusive = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / 86400000) + 1;
const recorteLabel = (goal: CommercialGoal, products: Product[]) => {
  const product = goal.productCode ? products.find((item) => item.code === goal.productCode)?.name ?? goal.productCode : '';
  return [product, goal.channel].filter(Boolean).join(' · ') || 'Meta geral';
};
const metricAchievement = (actual: number, target: number) => target > 0 ? actual / target * 100 : undefined;

export const goalScopeKey = (goal: Pick<CommercialGoal, 'startDate' | 'endDate' | 'channel' | 'productCode'>) => [goal.startDate, goal.endDate, goal.channel ?? 'ALL', goal.productCode ?? 'ALL'].join('|');

export const validateCommercialGoal = (goal: Pick<CommercialGoal, 'startDate' | 'endDate' | 'revenueTarget' | 'unitTarget'>) => {
  if (!iso(goal.startDate) || !iso(goal.endDate) || goal.startDate > goal.endDate) return 'Informe um período válido para a meta.';
  if (!Number.isFinite(goal.revenueTarget) || !Number.isFinite(goal.unitTarget) || goal.revenueTarget < 0 || goal.unitTarget < 0) return 'As metas devem ser números não negativos.';
  return undefined;
};

export const buildCommercialPerformance = ({ goals, sales, products, filters = {}, referenceDate = new Date() }: { goals: CommercialGoal[]; sales: SaleRecord[]; products: Product[]; filters?: CommercialFilters; referenceDate?: Date }): CommercialPerformanceReport => {
  const from = iso(filters.from); const to = iso(filters.to);
  const visibleSales = sales.filter((sale) => {
    const date = iso(sale.date);
    return (!from || date >= from) && (!to || date <= to) && (!filters.channel || sale.channel === filters.channel) && (!filters.productCode || sale.productCode === filters.productCode);
  });
  const selectedGoals = goals.filter((goal) => (!from || goal.startDate >= from) && (!to || goal.endDate <= to) && (!filters.channel || goal.channel === filters.channel) && (!filters.productCode || goal.productCode === filters.productCode));
  const today = referenceDate.toISOString().slice(0, 10);
  const items = selectedGoals.map((goal) => {
    const matchingSales = sales.filter((sale) => sale.date >= goal.startDate && sale.date <= goal.endDate && (!goal.channel || sale.channel === goal.channel) && (!goal.productCode || sale.productCode === goal.productCode));
    const revenueActual = matchingSales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    const unitsActual = matchingSales.reduce((sum, sale) => sum + sale.quantityUnits, 0);
    const revenueAchievement = metricAchievement(revenueActual, goal.revenueTarget);
    const unitsAchievement = metricAchievement(unitsActual, goal.unitTarget);
    const configuredAchievements = [revenueAchievement, unitsAchievement].filter((value): value is number => value !== undefined);
    const achieved = configuredAchievements.length > 0 && configuredAchievements.every((value) => value >= 100);
    const closed = today > goal.endDate;
    const remainingDays = !closed ? daysInclusive(today < goal.startDate ? goal.startDate : today, goal.endDate) : undefined;
    const lowestAchievement = configuredAchievements.length ? Math.min(...configuredAchievements) : undefined;
    const status: CommercialGoalStatus = configuredAchievements.length === 0 ? 'no_target' : achieved ? 'achieved' : closed ? 'closed' : (lowestAchievement ?? 0) >= 70 ? 'in_progress' : 'below';
    const revenueDailyPace = !achieved && remainingDays && goal.revenueTarget > 0 ? Math.max(0, goal.revenueTarget - revenueActual) / remainingDays : undefined;
    const unitsDailyPace = !achieved && remainingDays && goal.unitTarget > 0 ? Math.max(0, goal.unitTarget - unitsActual) / remainingDays : undefined;
    const label = recorteLabel(goal, products);
    const alert = status === 'below' || status === 'closed'
      ? `${label}: realizado ${goal.revenueTarget > 0 ? `de R$ ${revenueActual.toFixed(2)} para meta de R$ ${goal.revenueTarget.toFixed(2)}` : `${unitsActual} un. para meta de ${goal.unitTarget} un.`}.`
      : undefined;
    return { goal, label, revenueActual, unitsActual, revenueAchievement, unitsAchievement, revenueDeviation: revenueActual - goal.revenueTarget, unitsDeviation: unitsActual - goal.unitTarget, remainingDays, revenueDailyPace, unitsDailyPace, status, alert };
  }).sort((a, b) => ({ below: 0, closed: 1, in_progress: 2, achieved: 3, no_target: 4 }[a.status] - ({ below: 0, closed: 1, in_progress: 2, achieved: 3, no_target: 4 }[b.status])));
  return { items, filteredSalesCount: visibleSales.length, hasSales: visibleSales.length > 0, hasGoals: items.length > 0, alerts: items.filter((item) => Boolean(item.alert)) };
};
