import { StockCategory, StockProduct, StockMovement } from '../types/stock';

const now = new Date().toISOString();

export const INITIAL_STOCK_CATEGORIES: StockCategory[] = [
  { id: 'CAT-01', name: 'Matéria-prima', status: 'Ativo', createdAt: now, updatedAt: now },
  { id: 'CAT-02', name: 'Produto acabado', status: 'Ativo', createdAt: now, updatedAt: now },
  { id: 'CAT-03', name: 'Embalagem', status: 'Ativo', createdAt: now, updatedAt: now },
  { id: 'CAT-04', name: 'Material de limpeza', status: 'Ativo', createdAt: now, updatedAt: now },
  { id: 'CAT-05', name: 'Material de escritório', status: 'Ativo', createdAt: now, updatedAt: now },
  { id: 'CAT-06', name: 'Outros', status: 'Ativo', createdAt: now, updatedAt: now },
];

interface SeedDef {
  code: string;
  name: string;
  categoryId: string;
  unit: string;
  initialStock: number;
  minimumStock: number;
  unitCost: number;
  location?: string;
  supplier?: string;
  linkedProductCode?: string;
  description?: string;
}

const SEEDS: SeedDef[] = [
  { code: 'FAR001', name: 'Farinha de trigo', categoryId: 'CAT-01', unit: 'Kg', initialStock: 50, minimumStock: 20, unitCost: 4.5, location: 'Prateleira A2', supplier: 'Moinho Estrela' },
  { code: 'QUE002', name: 'Queijo muçarela', categoryId: 'CAT-01', unit: 'Kg', initialStock: 18, minimumStock: 20, unitCost: 38.9, location: 'Câmara Fria 01', supplier: 'Laticínios Bom Leite' },
  { code: 'MOL003', name: 'Molho de tomate pomodoro', categoryId: 'CAT-01', unit: 'L', initialStock: 60, minimumStock: 25, unitCost: 9.2, location: 'Prateleira B1', supplier: 'Distribuidora Verde' },
  { code: 'CAR004', name: 'Carne moída bovina', categoryId: 'CAT-01', unit: 'Kg', initialStock: 0, minimumStock: 15, unitCost: 32.5, location: 'Câmara Fria 02', supplier: 'Frigorífico Central' },
  { code: 'EMB005', name: 'Bandeja alumínio 600g', categoryId: 'CAT-03', unit: 'Unidade', initialStock: 800, minimumStock: 300, unitCost: 1.35, location: 'Estoque Seco', supplier: 'EmbalaMais' },
  { code: 'EMB006', name: 'Filme plástico PVC', categoryId: 'CAT-03', unit: 'Metro', initialStock: 120, minimumStock: 150, unitCost: 0.85, location: 'Estoque Seco', supplier: 'EmbalaMais' },
  { code: 'GL001', name: 'Lasanha da Galáxia (acabado)', categoryId: 'CAT-02', unit: 'Unidade', initialStock: 96, minimumStock: 40, unitCost: 14.35, location: 'Freezer Expedição', linkedProductCode: 'GL001' },
  { code: 'LIM007', name: 'Detergente industrial', categoryId: 'CAT-04', unit: 'L', initialStock: 24, minimumStock: 10, unitCost: 12.4, location: 'Depósito Limpeza', supplier: 'CleanPro' },
];

export const INITIAL_STOCK_PRODUCTS: StockProduct[] = SEEDS.map((s, i) => ({
  id: `PRD-${String(i + 1).padStart(3, '0')}`,
  code: s.code,
  name: s.name,
  categoryId: s.categoryId,
  categoryName: INITIAL_STOCK_CATEGORIES.find((c) => c.id === s.categoryId)?.name || 'Outros',
  unit: s.unit,
  description: s.description || '',
  initialStock: s.initialStock,
  currentStock: s.initialStock,
  minimumStock: s.minimumStock,
  unitCost: s.unitCost,
  totalValue: s.initialStock * s.unitCost,
  location: s.location,
  supplier: s.supplier,
  status: 'Ativo',
  linkedProductCode: s.linkedProductCode,
  createdAt: now,
  updatedAt: now,
}));

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = INITIAL_STOCK_PRODUCTS.filter(
  (p) => p.initialStock > 0
).map((p, i) => ({
  id: `MOV-S${String(i + 1).padStart(4, '0')}`,
  date: now.slice(0, 10),
  productId: p.id,
  productCode: p.code,
  productName: p.name,
  categoryId: p.categoryId,
  categoryName: p.categoryName,
  type: 'ENTRADA',
  reason: 'Estoque inicial',
  quantity: p.initialStock,
  unitCost: p.unitCost,
  totalValue: p.initialStock * p.unitCost,
  balanceAfter: p.initialStock,
  supplier: p.supplier,
  notes: 'Carga inicial do módulo de estoque',
  user: 'Sistema',
  createdAt: now,
}));
