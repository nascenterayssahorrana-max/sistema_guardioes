import { CommercialGoal, ProductIngredient, ProductCode, StockMovement, SupplyItem } from '../types/finance';

export const INITIAL_SUPPLIES: SupplyItem[] = [
  { id: 'sup-carne', name: 'Carne bovina moída', category: 'Proteínas', unit: 'kg', currentStock: 65, minimumStock: 80, unitCost: 28.9, active: true },
  { id: 'sup-massa', name: 'Massa fresca para lasanha', category: 'Massas', unit: 'kg', currentStock: 200, minimumStock: 90, unitCost: 12.5, active: true },
  { id: 'sup-queijo', name: 'Queijo muçarela', category: 'Laticínios', unit: 'kg', currentStock: 95, minimumStock: 50, unitCost: 36.4, active: true },
  { id: 'sup-molho', name: 'Molho de tomate artesanal', category: 'Molhos', unit: 'kg', currentStock: 250, minimumStock: 90, unitCost: 9.8, active: true },
  { id: 'sup-batata', name: 'Batata in natura', category: 'Hortifruti', unit: 'kg', currentStock: 185, minimumStock: 70, unitCost: 5.6, active: true },
  { id: 'sup-ricota', name: 'Ricota fresca', category: 'Laticínios', unit: 'kg', currentStock: 90, minimumStock: 35, unitCost: 24.8, active: true },
  { id: 'sup-espinafre', name: 'Espinafre selecionado', category: 'Hortifruti', unit: 'kg', currentStock: 36, minimumStock: 12, unitCost: 14.9, active: true },
  { id: 'sup-presunto', name: 'Presunto cozido', category: 'Frios', unit: 'kg', currentStock: 54, minimumStock: 20, unitCost: 29.5, active: true },
  { id: 'sup-embalagem', name: 'Embalagem individual', category: 'Embalagens', unit: 'unidade', currentStock: 2000, minimumStock: 700, unitCost: 2.1, active: true },
  { id: 'sup-caixa', name: 'Caixa para atacado', category: 'Embalagens', unit: 'caixa', currentStock: 180, minimumStock: 60, unitCost: 4.8, active: true },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'mov-est-01', supplyId: 'sup-carne', supplyName: 'Carne bovina moída', type: 'entrada', quantity: 180, balanceAfter: 180, unitCost: 28.5, date: '2026-08-20', reason: 'Compra programada', observation: 'Fornecedor frigorífico regional' },
  { id: 'mov-est-02', supplyId: 'sup-carne', supplyName: 'Carne bovina moída', type: 'saida', quantity: 115, balanceAfter: 65, date: '2026-08-28', reason: 'consumo na produção', observation: 'Produção de lasanhas' },
  { id: 'mov-est-03', supplyId: 'sup-massa', supplyName: 'Massa fresca para lasanha', type: 'entrada', quantity: 260, balanceAfter: 260, unitCost: 12.5, date: '2026-08-21', reason: 'Compra semanal', observation: 'Lote fresco refrigerado' },
  { id: 'mov-est-04', supplyId: 'sup-massa', supplyName: 'Massa fresca para lasanha', type: 'saida', quantity: 60, balanceAfter: 200, date: '2026-08-29', reason: 'consumo na produção', observation: 'Mix B2C e B2B' },
  { id: 'mov-est-05', supplyId: 'sup-queijo', supplyName: 'Queijo muçarela', type: 'entrada', quantity: 150, balanceAfter: 150, unitCost: 36.4, date: '2026-08-22', reason: 'Reposição', observation: 'Compra quinzenal' },
  { id: 'mov-est-06', supplyId: 'sup-queijo', supplyName: 'Queijo muçarela', type: 'saida', quantity: 55, balanceAfter: 95, date: '2026-08-29', reason: 'consumo na produção', observation: 'Preparos da semana' },
  { id: 'mov-est-07', supplyId: 'sup-molho', supplyName: 'Molho de tomate artesanal', type: 'entrada', quantity: 320, balanceAfter: 320, unitCost: 9.8, date: '2026-08-23', reason: 'Produção interna', observation: 'Cozinha central' },
  { id: 'mov-est-08', supplyId: 'sup-molho', supplyName: 'Molho de tomate artesanal', type: 'saida', quantity: 70, balanceAfter: 250, date: '2026-08-29', reason: 'consumo na produção', observation: 'Produção de massas' },
  { id: 'mov-est-09', supplyId: 'sup-batata', supplyName: 'Batata in natura', type: 'entrada', quantity: 240, balanceAfter: 240, unitCost: 5.6, date: '2026-08-24', reason: 'Compra programada', observation: 'Hortifruti local' },
  { id: 'mov-est-10', supplyId: 'sup-batata', supplyName: 'Batata in natura', type: 'saida', quantity: 55, balanceAfter: 185, date: '2026-08-29', reason: 'consumo na produção', observation: 'Linha de nhoques' },
  { id: 'mov-est-11', supplyId: 'sup-embalagem', supplyName: 'Embalagem individual', type: 'entrada', quantity: 2800, balanceAfter: 2800, unitCost: 2.1, date: '2026-08-19', reason: 'Compra mensal', observation: 'Embalagem térmica' },
  { id: 'mov-est-12', supplyId: 'sup-embalagem', supplyName: 'Embalagem individual', type: 'saida', quantity: 800, balanceAfter: 2000, date: '2026-08-29', reason: 'consumo na produção', observation: 'Expedição da semana' },
];

export const INITIAL_PRODUCT_INGREDIENTS: Record<ProductCode, ProductIngredient[]> = {
  GL001: [
    { supplyId: 'sup-carne', quantityPerUnit: 0.25, unit: 'kg' },
    { supplyId: 'sup-massa', quantityPerUnit: 0.2, unit: 'kg' },
    { supplyId: 'sup-queijo', quantityPerUnit: 0.15, unit: 'kg' },
    { supplyId: 'sup-molho', quantityPerUnit: 0.25, unit: 'kg' },
    { supplyId: 'sup-embalagem', quantityPerUnit: 1, unit: 'unidade' },
  ],
  RI002: [
    { supplyId: 'sup-massa', quantityPerUnit: 0.14, unit: 'kg' },
    { supplyId: 'sup-ricota', quantityPerUnit: 0.16, unit: 'kg' },
    { supplyId: 'sup-espinafre', quantityPerUnit: 0.05, unit: 'kg' },
    { supplyId: 'sup-queijo', quantityPerUnit: 0.08, unit: 'kg' },
    { supplyId: 'sup-embalagem', quantityPerUnit: 1, unit: 'unidade' },
  ],
  NS003: [
    { supplyId: 'sup-batata', quantityPerUnit: 0.4, unit: 'kg' },
    { supplyId: 'sup-carne', quantityPerUnit: 0.15, unit: 'kg' },
    { supplyId: 'sup-molho', quantityPerUnit: 0.15, unit: 'kg' },
    { supplyId: 'sup-embalagem', quantityPerUnit: 1, unit: 'unidade' },
  ],
  RC004: [
    { supplyId: 'sup-massa', quantityPerUnit: 0.17, unit: 'kg' },
    { supplyId: 'sup-queijo', quantityPerUnit: 0.2, unit: 'kg' },
    { supplyId: 'sup-molho', quantityPerUnit: 0.15, unit: 'kg' },
    { supplyId: 'sup-embalagem', quantityPerUnit: 1, unit: 'unidade' },
  ],
  LT005: [
    { supplyId: 'sup-carne', quantityPerUnit: 0.3, unit: 'kg' },
    { supplyId: 'sup-massa', quantityPerUnit: 0.22, unit: 'kg' },
    { supplyId: 'sup-queijo', quantityPerUnit: 0.25, unit: 'kg' },
    { supplyId: 'sup-molho', quantityPerUnit: 0.25, unit: 'kg' },
    { supplyId: 'sup-embalagem', quantityPerUnit: 1, unit: 'unidade' },
  ],
  RG006: [
    { supplyId: 'sup-massa', quantityPerUnit: 0.15, unit: 'kg' },
    { supplyId: 'sup-presunto', quantityPerUnit: 0.12, unit: 'kg' },
    { supplyId: 'sup-queijo', quantityPerUnit: 0.13, unit: 'kg' },
    { supplyId: 'sup-embalagem', quantityPerUnit: 1, unit: 'unidade' },
  ],
};

export const INITIAL_COMMERCIAL_GOALS: CommercialGoal[] = [
  { id: 'goal-aug-general', startDate: '2026-08-25', endDate: '2026-08-31', revenueTarget: 34000, unitTarget: 1650, createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-08-20T09:00:00.000Z' },
  { id: 'goal-aug-b2b', startDate: '2026-08-25', endDate: '2026-08-31', channel: 'B2B', revenueTarget: 26500, unitTarget: 1350, createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-08-20T09:00:00.000Z' },
  { id: 'goal-aug-b2c', startDate: '2026-08-25', endDate: '2026-08-31', channel: 'B2C', revenueTarget: 10500, unitTarget: 360, createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-08-20T09:00:00.000Z' },
  { id: 'goal-aug-lt', startDate: '2026-08-25', endDate: '2026-08-31', productCode: 'LT005', revenueTarget: 7600, unitTarget: 300, createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-08-20T09:00:00.000Z' },
];
