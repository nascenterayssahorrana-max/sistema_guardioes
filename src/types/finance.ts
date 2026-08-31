export type ProductCode = string;

export interface Product {
  code: ProductCode;
  name: string;
  family: string;
  defaultSector: string;
  unitsPerBatch: number;
  active: boolean;
  baseCost: number; // Insumos / ingredientes base
  packagingCost: number; // Embalagem / bandejas
  directLaborCost: number; // Mão de obra direta
  otherVariableCost: number; // Outros custos variáveis
  taxRateB2C: number; // Impostos B2C (%)
  taxRateB2B: number; // Impostos B2B (%)
  priceB2C: number; // Preço de venda ao consumidor final (R$)
  priceB2B: number; // Preço de venda no atacado / restaurantes (R$)
  description: string;
  weightGrams: number;
  category?: string;
  targetMarginB2C?: number; // Parâmetro desejado que calcula o preço B2C; não altera vendas já realizadas.
  targetMarginB2B?: number; // Parâmetro desejado que calcula o preço B2B; não altera vendas já realizadas.
}

export type SectorType =
  | 'Cozinha Central'
  | 'Produção - Massas'
  | 'Produção'
  | 'Estoque Central'
  | 'COZINHA_CENTRAL'
  | 'PRODUCAO_MASSAS'
  | 'PRODUCAO'
  | 'ESTOQUE_CENTRAL';

export type LossReason =
  | 'Avaria no congelamento'
  | 'Validade / sobra'
  | 'Quebra na montagem'
  | 'Embalagem danificada'
  | 'Ajuste inventário'
  | 'Peso fora do padrão'
  | 'Falha de selagem'
  | 'Recheio fora do padrão'
  | 'Falha de congelamento'
  | 'Massa com espessura irregular'
  | 'Vazamento de recheio no cozimento'
  | 'Erro de selagem na embalagem'
  | 'Quebra durante manipulação/transporte interno'
  | 'Sobras de laminação não reaproveitadas'
  | 'Aparência fora do padrão'
  | 'Outros';

export type MovementOrigin =
  | 'NOLA - Mov. Estoque'
  | 'Ajuste manual'
  | 'NOLA - Perdas'
  | 'NOLA - Produção'
  | string;

export interface NolaMovement {
  id: string; // e.g. MOV-10155
  date?: string; // DD/MM/YYYY
  week: string; // e.g. S01, S26
  weekNumber: number; // 1 to 27
  sector: SectorType;
  productCode: ProductCode;
  productName: string;
  plannedBatches?: number;
  producedBatches?: number;
  producedUnits: number;
  discardedUnits: number;
  lossReason: LossReason;
  unitCost: number;
  origin: MovementOrigin;
  observation?: string;
  totalLossValue: number; // discardedUnits * unitCost
}

export type FixedCostCategory =
  | 'Infraestrutura'
  | 'Pessoal Fixo'
  | 'Energia & Utilidades'
  | 'Manutenção'
  | 'Tecnologia & Sistemas'
  | 'Administrativo & Vendas'
  | 'INFRAESTRUTURA'
  | 'PESSOAL_FIXO'
  | 'ENERGIA_UTILIDADES'
  | 'MANUTENCAO'
  | 'TECNOLOGIA_SISTEMAS'
  | 'ADMINISTRATIVO_VENDAS';

export interface FixedCost {
  id: string;
  name: string;
  category: FixedCostCategory;
  monthlyAmount: number;
  isDisbursable: boolean; // Se exige desembolso financeiro no caixa (vs depreciação)
  description?: string;
}

export type SalesChannel = 'B2C' | 'B2B';

/** Meta gerencial independente dos lançamentos e snapshots de venda. */
export interface CommercialGoal {
  id: string;
  startDate: string;
  endDate: string;
  channel?: SalesChannel;
  productCode?: ProductCode;
  revenueTarget: number;
  unitTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  week?: string;
  productCode: ProductCode;
  productName: string;
  channel: SalesChannel;
  quantityUnits: number;
  unitPrice: number;
  totalRevenue: number;
  variableCostUnit: number;
  allocatedLossUnit: number;
  totalVariableCost: number;
  contributionMarginTotal: number;
  contributionMarginPercent: number;
  /** Financial snapshot used for sales recorded after the stability phase. */
  financialSnapshotVersion?: 1;
  taxRateApplied?: number;
  directCostUnit?: number;
  netRevenue?: number;
  customerName?: string;
  clientName?: string;
}

export interface SimulationParams {
  lossReductionPercent: number; // 0 to 100%
  b2cPriceChangePercent: number; // -30% to +50%
  b2bPriceChangePercent: number; // -30% to +50%
  volumeChangePercent: number; // -50% to +100%
  fixedCostChangePercent: number; // -30% to +50%
}

export type StockUnit = 'kg' | 'g' | 'L' | 'ml' | 'unidade' | 'pacote' | 'caixa';
export type StockMovementType = 'entrada' | 'saida' | 'ajuste';
export type StockExitReason = 'consumo na produção' | 'perda' | 'ajuste' | 'outro';

export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  unit: StockUnit;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  active: boolean;
}

export interface StockMovement {
  id: string;
  supplyId: string;
  supplyName: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  unitCost?: number;
  date: string;
  reason: string;
  observation?: string;
}

export interface ProductIngredient {
  supplyId: string;
  quantityPerUnit: number;
  /** Unidade da ficha técnica. Registros legados usam a unidade do insumo. */
  unit?: StockUnit;
}

export interface ProductSupplyRequirement {
  supplyId: string;
  supplyName: string;
  unit: StockUnit;
  available: number;
  required: number;
  deficit: number;
  sufficient: boolean;
  compatible?: boolean;
}
