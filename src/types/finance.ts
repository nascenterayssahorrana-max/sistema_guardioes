export type ProductCode = 'GL001' | 'RI002' | 'NS003' | 'RC004' | 'LT005' | 'RG006';

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
