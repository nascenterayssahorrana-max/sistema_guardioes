export type StockUnit =
  | 'Unidade'
  | 'Kg'
  | 'g'
  | 'L'
  | 'ml'
  | 'Caixa'
  | 'Pacote'
  | 'Metro';

export type StockStatus = 'Ativo' | 'Inativo';

export type StockSituation = 'NORMAL' | 'BAIXO' | 'ZERADO';

export interface StockCategory {
  id: string;
  name: string;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StockProduct {
  id: string;
  code: string; // SKU / Código único (ex: FAR001, GL001)
  name: string;
  categoryId: string;
  categoryName: string;
  unit: StockUnit | string;
  description: string;
  initialStock: number;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unitCost: number; // Custo unitário em R$
  totalValue: number; // currentStock * unitCost
  location?: string; // e.g. Prateleira A2, Câmara Fria 01
  supplier?: string;
  supplierProductCode?: string;
  status: StockStatus;
  linkedProductCode?: string; // Vínculo com GL001, RI002, etc. para baixa automática em vendas
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export type EntryReason =
  | 'Estoque inicial'
  | 'Compra'
  | 'Devolução de cliente'
  | 'Produção / Retorno'
  | 'Outros';

export type ExitReason =
  | 'Venda'
  | 'Consumo'
  | 'Produção'
  | 'Perda'
  | 'Avaria'
  | 'Uso interno'
  | 'Ajuste'
  | 'Outros';

export type StockReason = EntryReason | ExitReason | 'Ajuste de inventário' | 'Ajuste balanço';

export interface StockMovement {
  id: string;
  date: string; // YYYY-MM-DD
  productId: string;
  productCode: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  type: MovementType;
  reason: StockReason;
  quantity: number; // Quantidade movimentada (sempre positiva)
  unitCost: number;
  totalValue: number; // quantity * unitCost
  balanceAfter: number; // Saldo do produto imediatamente após a movimentação
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  user: string;
  financialTransactionId?: string; // ID da despesa gerada no financeiro (se houver)
  isFinancialLinked?: boolean;
  paymentType?: 'A_VISTA' | 'A_PRAZO';
  createdAt: string;
}

export interface StockSummaryMetrics {
  totalProductsCount: number;
  activeProductsCount: number;
  totalStockValue: number;
  lowStockCount: number;
  zeroStockCount: number;
  normalStockCount: number;
  totalMonthlyEntriesQty: number;
  totalMonthlyExitsQty: number;
  totalMonthlyEntriesValue: number;
  totalMonthlyExitsValue: number;
}

export interface StockFinancialTransaction {
  id: string;
  type: 'DESPESA' | 'RECEITA';
  category: string; // ex: Compra de estoque
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  supplier?: string;
  paymentType: 'A_VISTA' | 'A_PRAZO';
  status: 'PAGO' | 'A_PAGAR';
  dueDate?: string;
  movementId?: string;
  createdAt: string;
}

export interface StockPermissions {
  viewStock: boolean;
  createProduct: boolean;
  editProduct: boolean;
  registerEntry: boolean;
  registerExit: boolean;
  adjustStock: boolean;
  viewMovements: boolean;
  deactivateProduct: boolean;
}
