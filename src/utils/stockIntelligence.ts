import { Product, ProductCode, ProductIngredient, SaleRecord, StockUnit, SupplyItem } from '../types/finance';

export type StockRisk = 'critical' | 'attention' | 'normal' | 'unavailable';
export type StockIntelligenceReason = 'valid' | 'no_sales' | 'zero_consumption' | 'missing_recipe' | 'incomplete_recipe' | 'incompatible_unit' | 'invalid_period';

export interface StockIntelligenceFilters { from?: string; to?: string; supplyId?: string; productCode?: string; }
export interface StockRecipeIssue { productCode: ProductCode; productName: string; reason: 'missing_recipe' | 'incomplete_recipe'; message: string; }
export interface StockIntelligenceItem {
  supply: SupplyItem;
  estimatedConsumption?: number;
  averageDailyConsumption?: number;
  coverageDays?: number;
  risk: StockRisk;
  reason: StockIntelligenceReason;
  affectedProducts: string[];
  action: string;
  physicalStatus: 'zero' | 'low' | 'normal';
}
export interface StockIntelligenceReport {
  items: StockIntelligenceItem[];
  recipeIssues: StockRecipeIssue[];
  periodDays?: number;
  salesCount: number;
  invalidPeriod: boolean;
}

const unitFamilies: Record<StockUnit, 'mass' | 'volume' | 'count'> = { kg: 'mass', g: 'mass', L: 'volume', ml: 'volume', unidade: 'count', pacote: 'count', caixa: 'count' };
const factorsToBase: Record<StockUnit, number> = { kg: 1000, g: 1, L: 1000, ml: 1, unidade: 1, pacote: 1, caixa: 1 };

export const areUnitsCompatible = (from: StockUnit, to: StockUnit) => unitFamilies[from] === unitFamilies[to] && (unitFamilies[from] !== 'count' || from === to);
export const convertStockUnit = (quantity: number, from: StockUnit, to: StockUnit): number | undefined => {
  if (!Number.isFinite(quantity) || !areUnitsCompatible(from, to)) return undefined;
  return quantity * factorsToBase[from] / factorsToBase[to];
};

const toIso = (value?: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [day, month, year] = value.split('/');
  return day && month && year ? `${year}-${month}-${day}` : '';
};
const daysBetweenInclusive = (from: string, to: string) => {
  const [fy, fm, fd] = from.split('-').map(Number); const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000) + 1;
};
const actionFor = (risk: StockRisk, reason: StockIntelligenceReason) => {
  if (risk === 'critical') return 'Priorizar reposição do insumo.';
  if (risk === 'attention') return 'Monitorar consumo e programar reposição.';
  if (reason === 'no_sales') return 'Sem vendas no período; reavaliar quando houver consumo registrado.';
  if (reason === 'zero_consumption') return 'Consumo estimado zero no período; validar necessidade antes de repor.';
  if (reason === 'incompatible_unit') return 'Corrigir a unidade da ficha técnica; as unidades são incompatíveis.';
  if (reason === 'missing_recipe' || reason === 'incomplete_recipe') return 'Completar a ficha técnica para calcular o consumo.';
  if (reason === 'invalid_period') return 'Corrigir o período informado para calcular a cobertura.';
  return 'Cobertura disponível para acompanhamento operacional.';
};

export const buildStockIntelligence = ({ supplies, products, sales, productIngredients, filters = {} }: { supplies: SupplyItem[]; products: Product[]; sales: SaleRecord[]; productIngredients: Record<ProductCode, ProductIngredient[]>; filters?: StockIntelligenceFilters }): StockIntelligenceReport => {
  const from = toIso(filters.from); const to = toIso(filters.to);
  const invalidPeriod = Boolean(from && to && from > to);
  const rangeSales = invalidPeriod ? [] : sales.filter((sale) => {
    const date = toIso(sale.date);
    return (!from || date >= from) && (!to || date <= to) && (!filters.productCode || sale.productCode === filters.productCode);
  });
  const effectiveFrom = from || rangeSales.map((sale) => toIso(sale.date)).sort()[0] || '';
  const effectiveTo = to || rangeSales.map((sale) => toIso(sale.date)).sort().at(-1) || '';
  const periodDays = effectiveFrom && effectiveTo ? daysBetweenInclusive(effectiveFrom, effectiveTo) : undefined;
  const soldProductCodes = [...new Set(rangeSales.map((sale) => sale.productCode))];
  const recipeIssues: StockRecipeIssue[] = soldProductCodes.flatMap<StockRecipeIssue>((code) => {
    const product = products.find((item) => item.code === code); const ingredients = productIngredients[code] ?? [];
    if (!ingredients.length) return product ? [{ productCode: code, productName: product.name, reason: 'missing_recipe' as const, message: 'Ficha técnica ausente para produto vendido.' }] : [];
    const missingSupplies = ingredients.some((ingredient) => !supplies.some((supply) => supply.id === ingredient.supplyId));
    return missingSupplies && product ? [{ productCode: code, productName: product.name, reason: 'incomplete_recipe' as const, message: 'Ficha técnica referencia insumo não encontrado.' }] : [];
  });
  const riskOrder: Record<StockRisk, number> = { critical: 0, attention: 1, normal: 2, unavailable: 3 };
  const items = supplies.filter((supply) => !filters.supplyId || supply.id === filters.supplyId).map((supply): StockIntelligenceItem => {
    const ingredients = Object.entries(productIngredients).flatMap(([productCode, entries]) => entries.filter((entry) => entry.supplyId === supply.id).map((entry) => ({ productCode, entry })));
    const affectedProducts = [...new Set(ingredients.map(({ productCode }) => products.find((product) => product.code === productCode)?.name).filter(Boolean) as string[])];
    const physicalStatus = supply.currentStock === 0 ? 'zero' : supply.currentStock <= supply.minimumStock ? 'low' : 'normal';
    if (invalidPeriod) return { supply, risk: 'unavailable', reason: 'invalid_period', affectedProducts, action: actionFor('unavailable', 'invalid_period'), physicalStatus };
    if (!rangeSales.length) return { supply, risk: 'unavailable', reason: 'no_sales', affectedProducts, action: actionFor('unavailable', 'no_sales'), physicalStatus };
    let incompatible = false; let estimatedConsumption = 0;
    for (const sale of rangeSales) {
      const ingredient = ingredients.find((item) => item.productCode === sale.productCode)?.entry;
      if (!ingredient) continue;
      const ingredientUnit = ingredient.unit ?? supply.unit;
      const quantityInSupplyUnit = convertStockUnit(ingredient.quantityPerUnit, ingredientUnit, supply.unit);
      if (quantityInSupplyUnit === undefined) { incompatible = true; continue; }
      estimatedConsumption += sale.quantityUnits * quantityInSupplyUnit;
    }
    if (incompatible) return { supply, risk: 'unavailable', reason: 'incompatible_unit', affectedProducts, action: actionFor('unavailable', 'incompatible_unit'), physicalStatus };
    if (!periodDays || estimatedConsumption === 0) return { supply, estimatedConsumption, risk: 'unavailable', reason: 'zero_consumption', affectedProducts, action: actionFor('unavailable', 'zero_consumption'), physicalStatus };
    const averageDailyConsumption = estimatedConsumption / periodDays;
    const coverageDays = supply.currentStock / averageDailyConsumption;
    const risk: StockRisk = coverageDays <= 2 ? 'critical' : coverageDays <= 5 ? 'attention' : 'normal';
    return { supply, estimatedConsumption, averageDailyConsumption, coverageDays, risk, reason: 'valid', affectedProducts, action: actionFor(risk, 'valid'), physicalStatus };
  }).sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || (a.coverageDays ?? Infinity) - (b.coverageDays ?? Infinity));
  return { items, recipeIssues, periodDays, salesCount: rangeSales.length, invalidPeriod };
};
