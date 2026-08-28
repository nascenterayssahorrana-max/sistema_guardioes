import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  StockCategory,
  StockProduct,
  StockMovement,
  StockSituation,
  StockSummaryMetrics,
  StockFinancialTransaction,
  StockPermissions,
  MovementType,
  StockReason,
} from '../types/stock';
import {
  INITIAL_STOCK_CATEGORIES,
  INITIAL_STOCK_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
} from '../data/stockSeed';

const KEYS = {
  CATEGORIES: 'guardioes_stock_categories_v1',
  PRODUCTS: 'guardioes_stock_products_v1',
  MOVEMENTS: 'guardioes_stock_movements_v1',
  TRANSACTIONS: 'guardioes_stock_transactions_v1',
};

const load = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const getSituation = (p: StockProduct): StockSituation => {
  if (p.currentStock <= 0) return 'ZERADO';
  if (p.currentStock <= p.minimumStock) return 'BAIXO';
  return 'NORMAL';
};

export interface EntryInput {
  productId: string;
  date: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  reason?: StockReason;
  postToFinance?: boolean;
  paymentType?: 'A_VISTA' | 'A_PRAZO';
  dueDate?: string;
}

export interface ExitInput {
  productId: string;
  date: string;
  quantity: number;
  reason: StockReason;
  notes?: string;
  linkedSaleId?: string;
}

export interface AdjustInput {
  productId: string;
  date: string;
  newQuantity: number;
  reason: StockReason;
  notes: string;
}

export type OpResult = { ok: boolean; message?: string };

interface StockContextType {
  categories: StockCategory[];
  products: StockProduct[];
  movements: StockMovement[];
  transactions: StockFinancialTransaction[];
  permissions: StockPermissions;
  metrics: StockSummaryMetrics;
  lowStockProducts: StockProduct[];
  zeroStockProducts: StockProduct[];
  valueByCategory: { name: string; value: number }[];
  monthlyFlow: { month: string; entradas: number; saidas: number }[];

  addCategory: (name: string) => void;
  updateCategory: (id: string, updates: Partial<StockCategory>) => void;
  toggleCategoryStatus: (id: string) => void;

  addProduct: (
    data: Omit<StockProduct, 'id' | 'categoryName' | 'currentStock' | 'totalValue' | 'createdAt' | 'updatedAt'>
  ) => OpResult;
  updateProduct: (id: string, updates: Partial<StockProduct>) => void;
  deactivateProduct: (id: string) => void;
  removeProduct: (id: string) => OpResult;
  productMovements: (productId: string) => StockMovement[];

  registerEntry: (input: EntryInput) => OpResult;
  registerExit: (input: ExitInput) => OpResult;
  registerAdjustment: (input: AdjustInput) => OpResult;
  resetStockData: () => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const CURRENT_USER = 'Rayssa (Admin)';

const ALL_PERMISSIONS: StockPermissions = {
  viewStock: true,
  createProduct: true,
  editProduct: true,
  registerEntry: true,
  registerExit: true,
  adjustStock: true,
  viewMovements: true,
  deactivateProduct: true,
};

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<StockCategory[]>(() =>
    load(KEYS.CATEGORIES, INITIAL_STOCK_CATEGORIES)
  );
  const [products, setProducts] = useState<StockProduct[]>(() =>
    load(KEYS.PRODUCTS, INITIAL_STOCK_PRODUCTS)
  );
  const [movements, setMovements] = useState<StockMovement[]>(() =>
    load(KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS)
  );
  const [transactions, setTransactions] = useState<StockFinancialTransaction[]>(() =>
    load(KEYS.TRANSACTIONS, [] as StockFinancialTransaction[])
  );

  useEffect(() => localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements)), [movements]);
  useEffect(
    () => localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions)),
    [transactions]
  );

  /* ----------------------------- Métricas ----------------------------- */
  const metrics = useMemo<StockSummaryMetrics>(() => {
    const active = products.filter((p) => p.status === 'Ativo');
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const monthMovs = movements.filter((m) => (m.date || '').startsWith(monthPrefix));
    return {
      totalProductsCount: products.length,
      activeProductsCount: active.length,
      totalStockValue: active.reduce((s, p) => s + p.currentStock * p.unitCost, 0),
      lowStockCount: active.filter((p) => getSituation(p) === 'BAIXO').length,
      zeroStockCount: active.filter((p) => getSituation(p) === 'ZERADO').length,
      normalStockCount: active.filter((p) => getSituation(p) === 'NORMAL').length,
      totalMonthlyEntriesQty: monthMovs
        .filter((m) => m.type === 'ENTRADA')
        .reduce((s, m) => s + m.quantity, 0),
      totalMonthlyExitsQty: monthMovs
        .filter((m) => m.type === 'SAIDA')
        .reduce((s, m) => s + m.quantity, 0),
      totalMonthlyEntriesValue: monthMovs
        .filter((m) => m.type === 'ENTRADA')
        .reduce((s, m) => s + m.totalValue, 0),
      totalMonthlyExitsValue: monthMovs
        .filter((m) => m.type === 'SAIDA')
        .reduce((s, m) => s + m.totalValue, 0),
    };
  }, [products, movements]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.status === 'Ativo' && getSituation(p) === 'BAIXO'),
    [products]
  );
  const zeroStockProducts = useMemo(
    () => products.filter((p) => p.status === 'Ativo' && getSituation(p) === 'ZERADO'),
    [products]
  );

  const valueByCategory = useMemo(() => {
    const map = new Map<string, number>();
    products
      .filter((p) => p.status === 'Ativo')
      .forEach((p) => {
        map.set(p.categoryName, (map.get(p.categoryName) || 0) + p.currentStock * p.unitCost);
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  const monthlyFlow = useMemo(() => {
    const map = new Map<string, { entradas: number; saidas: number }>();
    movements.forEach((m) => {
      const key = (m.date || '').slice(0, 7);
      if (!key) return;
      const cur = map.get(key) || { entradas: 0, saidas: 0 };
      if (m.type === 'ENTRADA') cur.entradas += m.quantity;
      else if (m.type === 'SAIDA') cur.saidas += m.quantity;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, v]) => ({ month, ...v }));
  }, [movements]);

  /* ----------------------------- Helpers ----------------------------- */
  const nextId = (prefix: string, list: { id: string }[]) =>
    `${prefix}-${String(list.length + 1).padStart(4, '0')}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

  const commitMovement = (
    product: StockProduct,
    type: MovementType,
    reason: StockReason,
    quantity: number,
    unitCost: number,
    balanceAfter: number,
    extra: Partial<StockMovement> = {}
  ): StockMovement => {
    const mov: StockMovement = {
      id: nextId('MOV', movements),
      date: extra.date || new Date().toISOString().slice(0, 10),
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      type,
      reason,
      quantity: Math.abs(quantity),
      unitCost,
      totalValue: Math.abs(quantity) * unitCost,
      balanceAfter,
      user: CURRENT_USER,
      createdAt: new Date().toISOString(),
      ...extra,
    };
    setMovements((prev) => [mov, ...prev]);
    return mov;
  };

  const patchProduct = (id: string, updates: Partial<StockProduct>) =>
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updates, updatedAt: new Date().toISOString() };
        return { ...merged, totalValue: merged.currentStock * merged.unitCost };
      })
    );

  /* ----------------------------- Categorias ----------------------------- */
  const addCategory = (name: string) => {
    const now = new Date().toISOString();
    setCategories((prev) => [
      ...prev,
      { id: nextId('CAT', prev), name: name.trim(), status: 'Ativo', createdAt: now, updatedAt: now },
    ]);
  };

  const updateCategory = (id: string, updates: Partial<StockCategory>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    if (updates.name) {
      setProducts((prev) =>
        prev.map((p) => (p.categoryId === id ? { ...p, categoryName: updates.name! } : p))
      );
    }
  };

  const toggleCategoryStatus = (id: string) =>
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'Ativo' ? 'Inativo' : 'Ativo', updatedAt: new Date().toISOString() }
          : c
      )
    );

  /* ----------------------------- Produtos ----------------------------- */
  const addProduct: StockContextType['addProduct'] = (data) => {
    if (!data.code?.trim() || !data.name?.trim())
      return { ok: false, message: 'Código e nome são obrigatórios.' };
    if (products.some((p) => p.code.toLowerCase() === data.code.trim().toLowerCase()))
      return { ok: false, message: 'Já existe um produto com este código.' };

    const now = new Date().toISOString();
    const categoryName = categories.find((c) => c.id === data.categoryId)?.name || 'Outros';
    const initial = Math.max(0, Number(data.initialStock) || 0);
    const product: StockProduct = {
      ...data,
      id: nextId('PRD', products),
      code: data.code.trim(),
      name: data.name.trim(),
      categoryName,
      initialStock: initial,
      currentStock: initial,
      totalValue: initial * data.unitCost,
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [...prev, product]);

    if (initial > 0) {
      commitMovement(product, 'ENTRADA', 'Estoque inicial', initial, product.unitCost, initial, {
        supplier: product.supplier,
        notes: 'Movimentação gerada automaticamente no cadastro do produto.',
      });
    }
    return { ok: true };
  };

  const updateProduct = (id: string, updates: Partial<StockProduct>) => {
    const clean = { ...updates };
    delete (clean as any).currentStock; // saldo só muda via movimentação
    if (clean.categoryId) {
      clean.categoryName = categories.find((c) => c.id === clean.categoryId)?.name || 'Outros';
    }
    patchProduct(id, clean);
  };

  const deactivateProduct = (id: string) => patchProduct(id, { status: 'Inativo' });

  const removeProduct = (id: string): OpResult => {
    if (movements.some((m) => m.productId === id)) {
      deactivateProduct(id);
      return {
        ok: false,
        message: 'Produto possui movimentações e foi inativado em vez de excluído.',
      };
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return { ok: true };
  };

  const productMovements = (productId: string) =>
    movements
      .filter((m) => m.productId === productId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  /* ----------------------------- Entradas ----------------------------- */
  const registerEntry = (input: EntryInput): OpResult => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) return { ok: false, message: 'Selecione um produto válido.' };
    const qty = Number(input.quantity);
    if (!qty || qty <= 0) return { ok: false, message: 'Informe uma quantidade maior que zero.' };
    const unitCost = Number(input.unitCost) || product.unitCost;
    const balanceAfter = product.currentStock + qty;

    let transactionId: string | undefined;
    if (input.postToFinance) {
      const paymentType = input.paymentType || 'A_VISTA';
      const total = qty * unitCost;
      const alreadyLinked = transactions.some(
        (t) =>
          t.movementId &&
          t.date === input.date &&
          t.supplier === (input.supplier || product.supplier) &&
          Math.abs(t.amount - total) < 0.01
      );
      if (!alreadyLinked) {
        transactionId = nextId('FIN', transactions);
        const tx: StockFinancialTransaction = {
          id: transactionId,
          type: 'DESPESA',
          category: 'Compra de estoque',
          description: `Compra de ${qty} ${product.unit} — ${product.name}`,
          amount: total,
          date: input.date,
          supplier: input.supplier || product.supplier,
          paymentType,
          status: paymentType === 'A_VISTA' ? 'PAGO' : 'A_PAGAR',
          dueDate: paymentType === 'A_PRAZO' ? input.dueDate || input.date : undefined,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [tx, ...prev]);
      }
    }

    const mov = commitMovement(
      product,
      'ENTRADA',
      input.reason || 'Compra',
      qty,
      unitCost,
      balanceAfter,
      {
        date: input.date,
        supplier: input.supplier || product.supplier,
        invoiceNumber: input.invoiceNumber,
        notes: input.notes,
        financialTransactionId: transactionId,
        isFinancialLinked: !!transactionId,
        paymentType: input.paymentType,
      }
    );

    if (transactionId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? { ...t, movementId: mov.id } : t))
      );
    }

    patchProduct(product.id, { currentStock: balanceAfter, unitCost });
    return { ok: true, message: 'Entrada registrada com sucesso.' };
  };

  /* ----------------------------- Saídas ----------------------------- */
  const registerExit = (input: ExitInput): OpResult => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) return { ok: false, message: 'Selecione um produto válido.' };
    const qty = Number(input.quantity);
    if (!qty || qty <= 0) return { ok: false, message: 'Informe uma quantidade maior que zero.' };
    if (qty > product.currentStock) return { ok: false, message: 'Quantidade indisponível em estoque.' };

    const balanceAfter = product.currentStock - qty;
    commitMovement(product, 'SAIDA', input.reason, qty, product.unitCost, balanceAfter, {
      date: input.date,
      notes: input.linkedSaleId
        ? `${input.notes ? input.notes + ' — ' : ''}Vinculada à venda ${input.linkedSaleId}`
        : input.notes,
      financialTransactionId: input.linkedSaleId,
      isFinancialLinked: !!input.linkedSaleId,
    });
    patchProduct(product.id, { currentStock: balanceAfter });
    return { ok: true, message: 'Saída registrada com sucesso.' };
  };

  /* ----------------------------- Ajustes ----------------------------- */
  const registerAdjustment = (input: AdjustInput): OpResult => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) return { ok: false, message: 'Selecione um produto válido.' };
    const newQty = Number(input.newQuantity);
    if (isNaN(newQty) || newQty < 0) return { ok: false, message: 'Quantidade inválida (não pode ser negativa).' };
    if (!input.notes?.trim()) return { ok: false, message: 'A observação é obrigatória no ajuste.' };
    const diff = newQty - product.currentStock;
    if (diff === 0) return { ok: false, message: 'A nova quantidade é igual ao saldo atual.' };

    commitMovement(product, 'AJUSTE', input.reason || 'Ajuste de inventário', diff, product.unitCost, newQty, {
      date: input.date,
      notes: `${diff > 0 ? '+' : ''}${diff} — ${input.notes.trim()}`,
    });
    patchProduct(product.id, { currentStock: newQty });
    return { ok: true, message: 'Ajuste registrado no histórico.' };
  };

  const resetStockData = () => {
    setCategories(INITIAL_STOCK_CATEGORIES);
    setProducts(INITIAL_STOCK_PRODUCTS);
    setMovements(INITIAL_STOCK_MOVEMENTS);
    setTransactions([]);
  };

  return (
    <StockContext.Provider
      value={{
        categories,
        products,
        movements,
        transactions,
        permissions: ALL_PERMISSIONS,
        metrics,
        lowStockProducts,
        zeroStockProducts,
        valueByCategory,
        monthlyFlow,
        addCategory,
        updateCategory,
        toggleCategoryStatus,
        addProduct,
        updateProduct,
        deactivateProduct,
        removeProduct,
        productMovements,
        registerEntry,
        registerExit,
        registerAdjustment,
        resetStockData,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = (): StockContextType => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock deve ser usado dentro de StockProvider');
  return ctx;
};
