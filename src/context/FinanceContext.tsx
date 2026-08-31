import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, NolaMovement, FixedCost, SaleRecord, SimulationParams, ProductCode, LossReason, SectorType, SupplyItem, StockMovement, ProductIngredient, ProductSupplyRequirement, StockMovementType, CommercialGoal } from '../types/finance';
import { INITIAL_PRODUCTS, INITIAL_FIXED_COSTS, INITIAL_SALES, RAW_NOLA_MOVEMENTS, INITIAL_SUPPLIES, INITIAL_STOCK_MOVEMENTS, INITIAL_PRODUCT_INGREDIENTS, INITIAL_COMMERCIAL_GOALS } from '../data';
import { useAccess } from './AccessContext';
import { buildStockIntelligence, convertStockUnit, StockIntelligenceFilters, StockIntelligenceReport } from '../utils/stockIntelligence';
import { buildCommercialPerformance, CommercialFilters, CommercialPerformanceReport, goalScopeKey, validateCommercialGoal } from '../utils/commercialGoals';

export interface ProductCalculations {
  product: Product;
  totalLossCostNola: number;
  totalProducedUnitsNola: number;
  totalDiscardedUnitsNola: number;
  allocatedLossPerUnit: number;
  realVariableCost: number;
  // B2C
  netPriceB2C: number;
  mcB2C: number;
  mcPercentB2C: number;
  markupB2C: number;
  // B2B
  netPriceB2B: number;
  mcB2B: number;
  mcPercentB2B: number;
  markupB2B: number;
}

export interface ParetoReasonItem {
  reason: LossReason;
  totalCost: number;
  totalUnits: number;
  percentage: number;
  cumulativePercentage: number;
}

export type BreakEvenStatus = 'valid' | 'insufficient_data' | 'non_positive_mc' | 'mc_near_zero';

export const getBreakEvenStatus = (
  hasData: boolean,
  mcRate: number,
  averageUnitMC?: number,
): BreakEvenStatus => {
  if (!hasData) return 'insufficient_data';
  if (!Number.isFinite(mcRate) || mcRate <= 0 || (averageUnitMC !== undefined && averageUnitMC <= 0)) {
    return 'non_positive_mc';
  }

  // This is a numeric-stability guard, not a commercial margin threshold.
  // Values at floating-point precision around zero cannot produce a reliable,
  // interpretable break-even result, so the UI must show an attention state.
  if (mcRate <= Number.EPSILON || (averageUnitMC !== undefined && averageUnitMC <= Number.EPSILON)) {
    return 'mc_near_zero';
  }

  return 'valid';
};

export interface SectorLossItem {
  sector: SectorType;
  totalCost: number;
  totalUnits: number;
  percentage: number;
}

export interface WeekLossItem {
  week: string;
  weekNumber: number;
  totalCost: number;
  totalUnits: number;
  producedUnits: number;
}

export interface DRESummary {
  grossRevenue: number;
  taxes: number;
  netRevenue: number;
  variableCostsCPV: number;
  allocatedLosses: number;
  contributionMargin: number;
  contributionMarginPercent: number;
  fixedCostsTotal: number;
  operationalProfit: number;
  operationalProfitPercent: number;
}

interface FinanceContextType {
  // State
  products: Product[];
  fixedCosts: FixedCost[];
  sales: SaleRecord[];
  nolaMovements: NolaMovement[];
  targetMonthlyProfit: number;
  workingDaysMonth: number;
  simulationParams: SimulationParams;

  // Calculated Metrics
  productCalculations: Record<ProductCode, ProductCalculations>;
  totalFixedCosts: number;
  totalDisbursableFixedCosts: number;
  currentDRE: DRESummary;
  weightedMCPercent: number;
  averageUnitMC: number;
  averageUnitPrice: number;
  breakEvenStatus: BreakEvenStatus;

  // Break-Even Points
  pecReais: number;
  pecUnits: number;
  peeReais: number;
  peeUnits: number;
  pefReais: number;
  pefUnits: number;
  marginOfSafetyReais: number;
  marginOfSafetyPercent: number;
  dailyTargetPEC: number;
  dailyTargetPEE: number;

  // Analytics & NOLA
  totalNolaLossReais: number;
  totalNolaDiscardedUnits: number;
  paretoLossReasons: ParetoReasonItem[];
  sectorLosses: SectorLossItem[];
  weeklyLossTrends: WeekLossItem[];

  // Simulation Results
  simulatedDRE: DRESummary;
  simulatedPECReais: number;
  simulatedPEEReais: number;
  simulatedBreakEvenStatus: BreakEvenStatus;
  simulatedAnnualSavings: number;
  hasSimulationData: boolean;

  supplies: SupplyItem[];
  stockMovements: StockMovement[];
  productIngredients: Record<ProductCode, ProductIngredient[]>;
  lowStockSupplies: SupplyItem[];
  zeroStockSupplies: SupplyItem[];
  addSupply: (supply: Omit<SupplyItem, 'id'>) => string;
  updateSupply: (id: string, updates: Partial<SupplyItem>) => void;
  registerStockMovement: (movement: Omit<StockMovement, 'id' | 'supplyName' | 'balanceAfter'>) => { ok: boolean; message?: string };
  setProductIngredients: (productCode: ProductCode, ingredients: ProductIngredient[]) => void;
  getProductAvailability: (productCode: ProductCode, quantity: number) => { configured: boolean; sufficient: boolean; requirements: ProductSupplyRequirement[] };
  getStockIntelligence: (filters?: StockIntelligenceFilters) => StockIntelligenceReport;
  commercialGoals: CommercialGoal[];
  getCommercialPerformance: (filters?: CommercialFilters) => CommercialPerformanceReport;
  saveCommercialGoal: (goal: Omit<CommercialGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => { ok: boolean; message?: string; id?: string };
  deleteCommercialGoal: (id: string) => boolean;

  // Actions
  updateProduct: (code: ProductCode, updates: Partial<Product>) => void;
  addProduct: (product: Omit<Product, 'code'>) => ProductCode;
  deleteProduct: (code: ProductCode) => { ok: boolean; message?: string };
  addSale: (sale: Omit<SaleRecord, 'id' | 'totalRevenue' | 'variableCostUnit' | 'allocatedLossUnit' | 'totalVariableCost' | 'contributionMarginTotal' | 'contributionMarginPercent' | 'financialSnapshotVersion' | 'taxRateApplied' | 'directCostUnit' | 'netRevenue'>) => boolean;
  deleteSale: (id: string) => void;
  addFixedCost: (cost: Omit<FixedCost, 'id'>) => void;
  updateFixedCost: (id: string, updates: Partial<FixedCost>) => void;
  deleteFixedCost: (id: string) => void;
  addNolaMovement: (movement: Omit<NolaMovement, 'id' | 'totalLossValue'>) => void;
  deleteNolaMovement: (id: string) => void;
  setTargetMonthlyProfit: (profit: number) => void;
  setWorkingDaysMonth: (days: number) => void;
  setSimulationParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  resetToDefaults: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'guardioes_lasanha_products_v2',
  FIXED_COSTS: 'guardioes_lasanha_fixed_costs_v2',
  SALES: 'guardioes_lasanha_sales_v2',
  NOLA: 'guardioes_lasanha_nola_v2',
  TARGET_PROFIT: 'guardioes_lasanha_target_profit_v2',
  SUPPLIES: 'guardioes_lasanha_supplies_v1',
  STOCK_MOVEMENTS: 'guardioes_lasanha_stock_movements_v1',
  PRODUCT_INGREDIENTS: 'guardioes_lasanha_product_ingredients_v1',
  COMMERCIAL_GOALS: 'guardioes_lasanha_commercial_goals_v1',
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { can } = useAccess();
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
    return saved ? JSON.parse(saved) : INITIAL_FIXED_COSTS;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [nolaMovements, setNolaMovements] = useState<NolaMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOLA);
    return saved ? JSON.parse(saved) : RAW_NOLA_MOVEMENTS;
  });
  const [supplies, setSupplies] = useState<SupplyItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIES);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIES;
  });
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });
  const [productIngredients, setProductIngredientsState] = useState<Record<ProductCode, ProductIngredient[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCT_INGREDIENTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_INGREDIENTS;
  });
  const [commercialGoals, setCommercialGoals] = useState<CommercialGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMERCIAL_GOALS);
    return saved ? JSON.parse(saved) : INITIAL_COMMERCIAL_GOALS;
  });

  const [targetMonthlyProfit, setTargetMonthlyProfit] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TARGET_PROFIT);
    return saved ? Number(saved) : 20000; // Meta de R$ 20k/mês
  });

  const [workingDaysMonth, setWorkingDaysMonth] = useState<number>(22);

  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    lossReductionPercent: 0,
    b2cPriceChangePercent: 0,
    b2bPriceChangePercent: 0,
    volumeChangePercent: 0,
    fixedCostChangePercent: 0,
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(fixedCosts));
  }, [fixedCosts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOLA, JSON.stringify(nolaMovements));
  }, [nolaMovements]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SUPPLIES, JSON.stringify(supplies)); }, [supplies]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements)); }, [stockMovements]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCT_INGREDIENTS, JSON.stringify(productIngredients)); }, [productIngredients]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMMERCIAL_GOALS, JSON.stringify(commercialGoals)); }, [commercialGoals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TARGET_PROFIT, String(targetMonthlyProfit));
  }, [targetMonthlyProfit]);

  // Product Calculations with allocated NOLA losses
  const productCalculations = useMemo<Record<ProductCode, ProductCalculations>>(() => {
    // 1. Group NOLA per product
    const stats: Record<ProductCode, { lossCost: number; producedUnits: number; discardedUnits: number }> = Object.fromEntries(
      products.map((product) => [product.code, { lossCost: 0, producedUnits: 0, discardedUnits: 0 }]),
    );

    nolaMovements.forEach((mov) => {
      const code = mov.productCode;
      if (!stats[code]) stats[code] = { lossCost: 0, producedUnits: 0, discardedUnits: 0 };
      stats[code].lossCost += mov.totalLossValue;
      stats[code].producedUnits += mov.producedUnits;
      stats[code].discardedUnits += mov.discardedUnits;
    });

    const result: Partial<Record<ProductCode, ProductCalculations>> = {};

    products.forEach((prod) => {
      const pStats = stats[prod.code] || { lossCost: 0, producedUnits: 0, discardedUnits: 0 };
      const allocatedLossPerUnit = pStats.producedUnits > 0 ? pStats.lossCost / pStats.producedUnits : 0;

      const directCostNoLoss = prod.baseCost + prod.packagingCost + prod.directLaborCost + prod.otherVariableCost;
      const realVariableCost = directCostNoLoss + allocatedLossPerUnit;

      const netPriceB2C = prod.priceB2C * (1 - prod.taxRateB2C / 100);
      const mcB2C = netPriceB2C - realVariableCost;
      const mcPercentB2C = prod.priceB2C > 0 ? (mcB2C / prod.priceB2C) * 100 : 0;
      const markupB2C = realVariableCost > 0 ? (prod.priceB2C / realVariableCost) : 1;

      const netPriceB2B = prod.priceB2B * (1 - prod.taxRateB2B / 100);
      const mcB2B = netPriceB2B - realVariableCost;
      const mcPercentB2B = prod.priceB2B > 0 ? (mcB2B / prod.priceB2B) * 100 : 0;
      const markupB2B = realVariableCost > 0 ? (prod.priceB2B / realVariableCost) : 1;

      result[prod.code] = {
        product: prod,
        totalLossCostNola: pStats.lossCost,
        totalProducedUnitsNola: pStats.producedUnits,
        totalDiscardedUnitsNola: pStats.discardedUnits,
        allocatedLossPerUnit,
        realVariableCost,
        netPriceB2C,
        mcB2C,
        mcPercentB2C,
        markupB2C,
        netPriceB2B,
        mcB2B,
        mcPercentB2B,
        markupB2B,
      };
    });

    return result as Record<ProductCode, ProductCalculations>;
  }, [products, nolaMovements]);

  // Total Fixed Costs
  const totalFixedCosts = useMemo(() => {
    return fixedCosts.reduce((acc, curr) => acc + curr.monthlyAmount, 0);
  }, [fixedCosts]);

  const totalDisbursableFixedCosts = useMemo(() => {
    return fixedCosts
      .filter((fc) => fc.isDisbursable)
      .reduce((acc, curr) => acc + curr.monthlyAmount, 0);
  }, [fixedCosts]);

  // Current Sales DRE
  const currentDRE = useMemo<DRESummary>(() => {
    let grossRevenue = 0;
    let taxes = 0;
    let variableCostsCPV = 0;
    let allocatedLosses = 0;

    sales.forEach((s) => {
      const prodCalc = productCalculations[s.productCode];
      grossRevenue += s.totalRevenue;
      const taxRate = s.taxRateApplied ?? (s.channel === 'B2C' ? prodCalc?.product.taxRateB2C : prodCalc?.product.taxRateB2B) ?? (s.channel === 'B2C' ? 7.5 : 5.5);
      taxes += s.totalRevenue * (taxRate / 100);

      const baseVarUnit = s.financialSnapshotVersion
        ? s.directCostUnit ?? s.variableCostUnit
        : (prodCalc ? (prodCalc.product.baseCost + prodCalc.product.packagingCost + prodCalc.product.directLaborCost + prodCalc.product.otherVariableCost) : s.variableCostUnit);
      const lossAllocUnit = s.financialSnapshotVersion ? s.allocatedLossUnit : (prodCalc ? prodCalc.allocatedLossPerUnit : s.allocatedLossUnit);
      const baseVar = baseVarUnit * s.quantityUnits;
      const lossAlloc = lossAllocUnit * s.quantityUnits;

      variableCostsCPV += baseVar;
      allocatedLosses += lossAlloc;
    });

    const netRevenue = grossRevenue - taxes;
    const totalVar = variableCostsCPV + allocatedLosses;
    const contributionMargin = netRevenue - totalVar;
    const contributionMarginPercent = grossRevenue > 0 ? (contributionMargin / grossRevenue) * 100 : 0;
    const operationalProfit = contributionMargin - totalFixedCosts;
    const operationalProfitPercent = grossRevenue > 0 ? (operationalProfit / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      taxes,
      netRevenue,
      variableCostsCPV,
      allocatedLosses,
      contributionMargin,
      contributionMarginPercent,
      fixedCostsTotal: totalFixedCosts,
      operationalProfit,
      operationalProfitPercent,
    };
  }, [sales, productCalculations, totalFixedCosts]);

  // Weighted MC % and Unit MC
  const { weightedMCPercent, averageUnitMC, averageUnitPrice } = useMemo(() => {
    if (sales.length > 0 && currentDRE.grossRevenue > 0) {
      const totalUnits = sales.reduce((acc, s) => acc + s.quantityUnits, 0);
      const avgPrice = currentDRE.grossRevenue / totalUnits;
      const avgMC = currentDRE.contributionMargin / totalUnits;
      const mcP = (currentDRE.contributionMargin / currentDRE.grossRevenue) * 100;
      return {
        // The real margin is preserved here. A minimum artificial MC would make
        // an unachievable break-even point look mathematically attainable.
        weightedMCPercent: mcP,
        averageUnitMC: avgMC,
        averageUnitPrice: avgPrice,
      };
    }

    // Fallback: average of all 6 products in mixed 40% B2C / 60% B2B
    let sumMC = 0;
    let sumPrice = 0;
    let count = 0;

    (Object.values(productCalculations) as ProductCalculations[]).forEach((pc) => {
      const mixedPrice = pc.product.priceB2C * 0.4 + pc.product.priceB2B * 0.6;
      const mixedMC = pc.mcB2C * 0.4 + pc.mcB2B * 0.6;
      sumPrice += mixedPrice;
      sumMC += mixedMC;
      count++;
    });

    const avgPrice = count > 0 ? sumPrice / count : 23.5;
    const avgMC = count > 0 ? sumMC / count : 8.5;
    const mcP = (avgMC / avgPrice) * 100;

    return {
      weightedMCPercent: mcP,
      averageUnitMC: avgMC,
      averageUnitPrice: avgPrice,
    };
  }, [sales, currentDRE, productCalculations]);

  const breakEvenStatus = useMemo<BreakEvenStatus>(
    () => getBreakEvenStatus(sales.length > 0 && currentDRE.grossRevenue > 0, weightedMCPercent / 100, averageUnitMC),
    [sales.length, currentDRE.grossRevenue, weightedMCPercent, averageUnitMC],
  );

  // Break-Even calculations
  const pecReais = useMemo(() => {
    const mcRate = weightedMCPercent / 100;
    return breakEvenStatus === 'valid' ? totalFixedCosts / mcRate : 0;
  }, [totalFixedCosts, weightedMCPercent, breakEvenStatus]);

  const pecUnits = useMemo(() => {
    return breakEvenStatus === 'valid' ? Math.ceil(totalFixedCosts / averageUnitMC) : 0;
  }, [totalFixedCosts, averageUnitMC, breakEvenStatus]);

  const peeReais = useMemo(() => {
    const mcRate = weightedMCPercent / 100;
    return breakEvenStatus === 'valid' ? (totalFixedCosts + targetMonthlyProfit) / mcRate : 0;
  }, [totalFixedCosts, targetMonthlyProfit, weightedMCPercent, breakEvenStatus]);

  const peeUnits = useMemo(() => {
    return breakEvenStatus === 'valid' ? Math.ceil((totalFixedCosts + targetMonthlyProfit) / averageUnitMC) : 0;
  }, [totalFixedCosts, targetMonthlyProfit, averageUnitMC, breakEvenStatus]);

  const pefReais = useMemo(() => {
    const mcRate = weightedMCPercent / 100;
    return breakEvenStatus === 'valid' ? totalDisbursableFixedCosts / mcRate : 0;
  }, [totalDisbursableFixedCosts, weightedMCPercent, breakEvenStatus]);

  const pefUnits = useMemo(() => {
    return breakEvenStatus === 'valid' ? Math.ceil(totalDisbursableFixedCosts / averageUnitMC) : 0;
  }, [totalDisbursableFixedCosts, averageUnitMC, breakEvenStatus]);

  const marginOfSafetyReais = useMemo(() => {
    return breakEvenStatus === 'valid' ? currentDRE.grossRevenue - pecReais : 0;
  }, [currentDRE.grossRevenue, pecReais, breakEvenStatus]);

  const marginOfSafetyPercent = useMemo(() => {
    return currentDRE.grossRevenue > 0 ? (marginOfSafetyReais / currentDRE.grossRevenue) * 100 : 0;
  }, [currentDRE.grossRevenue, marginOfSafetyReais]);

  const dailyTargetPEC = useMemo(() => {
    return workingDaysMonth > 0 ? pecReais / workingDaysMonth : 0;
  }, [pecReais, workingDaysMonth]);

  const dailyTargetPEE = useMemo(() => {
    return workingDaysMonth > 0 ? peeReais / workingDaysMonth : 0;
  }, [peeReais, workingDaysMonth]);

  // NOLA Pareto & Quality Analytics
  const { totalNolaLossReais, totalNolaDiscardedUnits, paretoLossReasons, sectorLosses, weeklyLossTrends } = useMemo(() => {
    let totalLoss = 0;
    let totalDiscarded = 0;
    const reasonMap: Record<string, { cost: number; units: number }> = {};
    const sectorMap: Record<string, { cost: number; units: number }> = {};
    const weekMap: Record<string, { weekNumber: number; cost: number; units: number; producedUnits: number }> = {};

    nolaMovements.forEach((m) => {
      totalLoss += m.totalLossValue;
      totalDiscarded += m.discardedUnits;

      // Reason
      if (!reasonMap[m.lossReason]) {
        reasonMap[m.lossReason] = { cost: 0, units: 0 };
      }
      reasonMap[m.lossReason].cost += m.totalLossValue;
      reasonMap[m.lossReason].units += m.discardedUnits;

      // Sector
      if (!sectorMap[m.sector]) {
        sectorMap[m.sector] = { cost: 0, units: 0 };
      }
      sectorMap[m.sector].cost += m.totalLossValue;
      sectorMap[m.sector].units += m.discardedUnits;

      // Week
      if (!weekMap[m.week]) {
        weekMap[m.week] = { weekNumber: m.weekNumber, cost: 0, units: 0, producedUnits: 0 };
      }
      weekMap[m.week].cost += m.totalLossValue;
      weekMap[m.week].units += m.discardedUnits;
      weekMap[m.week].producedUnits += m.producedUnits;
    });

    // Sort reasons by cost descending for Pareto
    const sortedReasons = Object.entries(reasonMap)
      .map(([reason, data]) => ({
        reason: reason as LossReason,
        totalCost: data.cost,
        totalUnits: data.units,
        percentage: totalLoss > 0 ? (data.cost / totalLoss) * 100 : 0,
        cumulativePercentage: 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    let runningSum = 0;
    sortedReasons.forEach((item) => {
      runningSum += item.percentage;
      item.cumulativePercentage = Math.min(runningSum, 100);
    });

    // Sectors
    const sortedSectors = Object.entries(sectorMap)
      .map(([sector, data]) => ({
        sector: sector as SectorType,
        totalCost: data.cost,
        totalUnits: data.units,
        percentage: totalLoss > 0 ? (data.cost / totalLoss) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Weekly
    const sortedWeeks = Object.entries(weekMap)
      .map(([week, data]) => ({
        week,
        weekNumber: data.weekNumber,
        totalCost: data.cost,
        totalUnits: data.units,
        producedUnits: data.producedUnits,
      }))
      .sort((a, b) => a.weekNumber - b.weekNumber);

    return {
      totalNolaLossReais: totalLoss,
      totalNolaDiscardedUnits: totalDiscarded,
      paretoLossReasons: sortedReasons,
      sectorLosses: sortedSectors,
      weeklyLossTrends: sortedWeeks,
    };
  }, [nolaMovements]);

  // Simulation Engine (What-If Analysis)
  const { simulatedDRE, simulatedPECReais, simulatedPEEReais, simulatedAnnualSavings, simulatedBreakEvenStatus } = useMemo(() => {
    const { lossReductionPercent, b2cPriceChangePercent, b2bPriceChangePercent, volumeChangePercent, fixedCostChangePercent } = simulationParams;

    if (sales.length === 0) {
      const emptyDRE: DRESummary = {
        grossRevenue: 0,
        taxes: 0,
        netRevenue: 0,
        variableCostsCPV: 0,
        allocatedLosses: 0,
        contributionMargin: 0,
        contributionMarginPercent: 0,
        fixedCostsTotal: totalFixedCosts,
        operationalProfit: -totalFixedCosts,
        operationalProfitPercent: 0,
      };

      return {
        simulatedDRE: emptyDRE,
        simulatedPECReais: 0,
        simulatedPEEReais: 0,
        simulatedBreakEvenStatus: 'insufficient_data' as BreakEvenStatus,
        simulatedAnnualSavings: 0,
      };
    }

    // Adjusted fixed costs
    const simFixedCost = totalFixedCosts * (1 + fixedCostChangePercent / 100);

    // Adjusted sales simulation
    let simGrossRevenue = 0;
    let simTaxes = 0;
    let simVarCPV = 0;
    let simAllocLoss = 0;

    sales.forEach((s) => {
      const volMult = 1 + volumeChangePercent / 100;
      const priceMult = s.channel === 'B2C' ? (1 + b2cPriceChangePercent / 100) : (1 + b2bPriceChangePercent / 100);
      const simPrice = s.unitPrice * priceMult;
      const simUnits = s.quantityUnits * volMult;
      const simRev = simPrice * simUnits;

      const prodCalc = productCalculations[s.productCode];
      const taxRate = s.taxRateApplied ?? (s.channel === 'B2C' ? prodCalc?.product.taxRateB2C : prodCalc?.product.taxRateB2B) ?? (s.channel === 'B2C' ? 7.5 : 5.5);

      simGrossRevenue += simRev;
      simTaxes += simRev * (taxRate / 100);

      const baseVarUnit = s.financialSnapshotVersion
        ? s.directCostUnit ?? s.variableCostUnit
        : (prodCalc ? (prodCalc.product.baseCost + prodCalc.product.packagingCost + prodCalc.product.directLaborCost + prodCalc.product.otherVariableCost) : s.variableCostUnit);
      const historicalLossUnit = s.financialSnapshotVersion ? s.allocatedLossUnit : (prodCalc ? prodCalc.allocatedLossPerUnit : s.allocatedLossUnit);
      const lossAllocUnit = historicalLossUnit * (1 - lossReductionPercent / 100);

      simVarCPV += baseVarUnit * simUnits;
      simAllocLoss += lossAllocUnit * simUnits;
    });

    const simNetRevenue = simGrossRevenue - simTaxes;
    const simTotalVar = simVarCPV + simAllocLoss;
    const simContributionMargin = simNetRevenue - simTotalVar;
    const simMCPercent = simGrossRevenue > 0 ? (simContributionMargin / simGrossRevenue) * 100 : weightedMCPercent;
    const simOperationalProfit = simContributionMargin - simFixedCost;
    const simOperationalProfitPercent = simGrossRevenue > 0 ? (simOperationalProfit / simGrossRevenue) * 100 : 0;

    const simMCRate = simMCPercent / 100;
    const simulatedBreakEvenStatus = getBreakEvenStatus(simGrossRevenue > 0, simMCRate);
    const simPEC = simulatedBreakEvenStatus === 'valid' ? simFixedCost / simMCRate : 0;
    const simPEE = simulatedBreakEvenStatus === 'valid' ? (simFixedCost + targetMonthlyProfit) / simMCRate : 0;

    // Annual savings based on 52 weeks projection (or loss reduction)
    // 27 weeks = totalNolaLossReais -> annual baseline = totalNolaLossReais * (52 / 27)
    const annualBaselineLoss = totalNolaLossReais * (52 / 27);
    const simulatedAnnualSavings = annualBaselineLoss * (lossReductionPercent / 100);

    return {
      simulatedDRE: {
        grossRevenue: simGrossRevenue,
        taxes: simTaxes,
        netRevenue: simNetRevenue,
        variableCostsCPV: simVarCPV,
        allocatedLosses: simAllocLoss,
        contributionMargin: simContributionMargin,
        contributionMarginPercent: simMCPercent,
        fixedCostsTotal: simFixedCost,
        operationalProfit: simOperationalProfit,
        operationalProfitPercent: simOperationalProfitPercent,
      },
      simulatedPECReais: simPEC,
      simulatedPEEReais: simPEE,
      simulatedBreakEvenStatus,
      simulatedAnnualSavings,
    };
  }, [simulationParams, totalFixedCosts, sales, productCalculations, weightedMCPercent, targetMonthlyProfit, totalNolaLossReais]);

  // Actions
  const updateProduct = (code: ProductCode, updates: Partial<Product>) => {
    if (!can('products.edit')) return;
    setProducts((prev) => prev.map((p) => (p.code === code ? { ...p, ...updates } : p)));
  };

  const addProduct = (product: Omit<Product, 'code'>): ProductCode => {
    if (!can('products.edit')) return '';
    const nextCode = `PRD${String(products.length + 1).padStart(3, '0')}`;
    setProducts((prev) => [...prev, { ...product, code: nextCode }]);
    return nextCode;
  };

  const deleteProduct = (code: ProductCode) => {
    if (!can('products.edit')) return { ok: false, message: 'Seu perfil não possui permissão para excluir produtos.' };
    if (!products.some((product) => product.code === code)) return { ok: false, message: 'Produto não encontrado.' };
    if (sales.some((sale) => sale.productCode === code)) return { ok: false, message: 'Este produto possui vendas registradas e não pode ser excluído.' };
    if (nolaMovements.some((movement) => movement.productCode === code)) return { ok: false, message: 'Este produto possui perdas registradas e não pode ser excluído.' };
    if (commercialGoals.some((goal) => goal.productCode === code)) return { ok: false, message: 'Este produto possui uma meta vinculada e não pode ser excluído.' };

    setProducts((prev) => prev.filter((product) => product.code !== code));
    setProductIngredientsState((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
    return { ok: true };
  };

  const addSale = (newSale: Omit<SaleRecord, 'id' | 'totalRevenue' | 'variableCostUnit' | 'allocatedLossUnit' | 'totalVariableCost' | 'contributionMarginTotal' | 'contributionMarginPercent' | 'financialSnapshotVersion' | 'taxRateApplied' | 'directCostUnit' | 'netRevenue'>) => {
    if (!can('sales.create')) return false;
    const prodCalc = productCalculations[newSale.productCode];
    if (!prodCalc?.product.active) return false;
    const totalRevenue = newSale.quantityUnits * newSale.unitPrice;
    const variableCostUnit = prodCalc.product.baseCost + prodCalc.product.packagingCost + prodCalc.product.directLaborCost + prodCalc.product.otherVariableCost;
    const allocatedLossUnit = prodCalc.allocatedLossPerUnit;
    const totalVariableCost = (variableCostUnit + allocatedLossUnit) * newSale.quantityUnits;
    const taxRate = newSale.channel === 'B2C' ? prodCalc.product.taxRateB2C : prodCalc.product.taxRateB2B;
    const netRevenue = totalRevenue * (1 - taxRate / 100);
    const contributionMarginTotal = netRevenue - totalVariableCost;
    const contributionMarginPercent = totalRevenue > 0 ? (contributionMarginTotal / totalRevenue) * 100 : 0;

    const record: SaleRecord = {
      id: `v-${Date.now()}`,
      ...newSale,
      totalRevenue,
      variableCostUnit,
      allocatedLossUnit,
      totalVariableCost,
      contributionMarginTotal,
      contributionMarginPercent,
      financialSnapshotVersion: 1,
      taxRateApplied: taxRate,
      directCostUnit: variableCostUnit,
      netRevenue,
    };

    setSales((prev) => [record, ...prev]);
    return true;
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  const addFixedCost = (cost: Omit<FixedCost, 'id'>) => {
    if (!can('fixedCosts.edit')) return;
    const record: FixedCost = {
      id: `fc-${Date.now()}`,
      ...cost,
    };
    setFixedCosts((prev) => [...prev, record]);
  };

  const updateFixedCost = (id: string, updates: Partial<FixedCost>) => {
    if (!can('fixedCosts.edit')) return;
    setFixedCosts((prev) => prev.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc)));
  };

  const deleteFixedCost = (id: string) => {
    if (!can('fixedCosts.edit')) return;
    setFixedCosts((prev) => prev.filter((fc) => fc.id !== id));
  };

  const addNolaMovement = (mov: Omit<NolaMovement, 'id' | 'totalLossValue'>) => {
    if (!can('losses.create')) return;
    const totalLossValue = mov.discardedUnits * mov.unitCost;
    const record: NolaMovement = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      ...mov,
      totalLossValue,
    };
    setNolaMovements((prev) => [record, ...prev]);
  };

  const deleteNolaMovement = (id: string) => {
    if (!can('losses.create')) return;
    setNolaMovements((prev) => prev.filter((m) => m.id !== id));
  };

  const addSupply = (supply: Omit<SupplyItem, 'id'>) => {
    if (!can('inventory.operate')) return '';
    const id = `ins-${Date.now()}`;
    setSupplies((prev) => [...prev, { ...supply, id }]);
    return id;
  };

  const updateSupply = (id: string, updates: Partial<SupplyItem>) => {
    if (!can('inventory.operate')) return;
    setSupplies((prev) => prev.map((supply) => supply.id === id ? { ...supply, ...updates } : supply));
  };

  const registerStockMovement = (movement: Omit<StockMovement, 'id' | 'supplyName' | 'balanceAfter'>) => {
    if (!can('inventory.operate')) return { ok: false, message: 'Seu perfil não possui permissão para movimentar estoque.' };
    const supply = supplies.find((item) => item.id === movement.supplyId);
    if (!supply) return { ok: false, message: 'Insumo não encontrado.' };
    if (!Number.isFinite(movement.quantity) || movement.quantity < 0) return { ok: false, message: 'Informe uma quantidade válida e não negativa.' };
    const newBalance = movement.type === 'entrada'
      ? supply.currentStock + movement.quantity
      : movement.type === 'saida'
        ? supply.currentStock - movement.quantity
        : movement.quantity;
    if (newBalance < 0) return { ok: false, message: `Estoque insuficiente. Disponível: ${supply.currentStock} ${supply.unit}.` };
    // For adjustments, quantity records the signed inventory difference; balanceAfter records the counted balance.
    const recordedQuantity = movement.type === 'ajuste' ? newBalance - supply.currentStock : movement.quantity;
    const record: StockMovement = {
      ...movement,
      id: `mov-est-${Date.now()}`,
      supplyName: supply.name,
      quantity: recordedQuantity,
      balanceAfter: newBalance,
    };
    setSupplies((prev) => prev.map((item) => item.id === supply.id ? { ...item, currentStock: newBalance, unitCost: movement.type === 'entrada' && movement.unitCost !== undefined ? movement.unitCost : item.unitCost } : item));
    setStockMovements((prev) => [record, ...prev]);
    return { ok: true };
  };

  const setProductIngredients = (productCode: ProductCode, ingredients: ProductIngredient[]) => {
    if (!can('inventory.operate')) return;
    setProductIngredientsState((prev) => ({ ...prev, [productCode]: ingredients.filter((item) => item.supplyId && item.quantityPerUnit > 0) }));
  };

  const getProductAvailability = (productCode: ProductCode, quantity: number) => {
    const ingredients = productIngredients[productCode] ?? [];
    if (ingredients.length === 0) return { configured: false, sufficient: true, requirements: [] };
    const requirements = ingredients.map((ingredient) => {
      const supply = supplies.find((item) => item.id === ingredient.supplyId);
      const converted = supply ? convertStockUnit(ingredient.quantityPerUnit, ingredient.unit ?? supply.unit, supply.unit) : undefined;
      const required = converted === undefined ? Number.POSITIVE_INFINITY : converted * Math.max(0, quantity);
      const available = supply?.currentStock ?? 0;
      return { supplyId: ingredient.supplyId, supplyName: supply?.name ?? 'Insumo removido', unit: supply?.unit ?? 'unidade', available, required, deficit: Math.max(0, required - available), sufficient: available >= required, compatible: converted !== undefined };
    });
    return { configured: true, sufficient: requirements.every((item) => item.sufficient), requirements };
  };

  const getStockIntelligence = (filters: StockIntelligenceFilters = {}) => buildStockIntelligence({ supplies, products, sales, productIngredients, filters });
  const getCommercialPerformance = (filters: CommercialFilters = {}) => buildCommercialPerformance({ goals: commercialGoals, sales, products, filters });

  const saveCommercialGoal = (goal: Omit<CommercialGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (!can('commercialGoals.manage')) return { ok: false, message: 'Seu perfil não possui permissão para configurar metas.' };
    const error = validateCommercialGoal(goal);
    if (error) return { ok: false, message: error };
    const duplicate = commercialGoals.some((item) => item.id !== goal.id && goalScopeKey(item) === goalScopeKey(goal));
    if (duplicate) return { ok: false, message: 'Já existe uma meta para este mesmo período e recorte. Edite a meta existente.' };
    const now = new Date().toISOString(); const id = goal.id ?? `meta-com-${Date.now()}`;
    setCommercialGoals((prev) => {
      const existing = prev.find((item) => item.id === id);
      const record: CommercialGoal = { ...goal, id, createdAt: existing?.createdAt ?? now, updatedAt: now };
      return existing ? prev.map((item) => item.id === id ? record : item) : [record, ...prev];
    });
    return { ok: true, id };
  };

  const deleteCommercialGoal = (id: string) => {
    if (!can('commercialGoals.manage') || !commercialGoals.some((item) => item.id === id)) return false;
    setCommercialGoals((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const zeroStockSupplies = useMemo(() => supplies.filter((item) => item.currentStock === 0), [supplies]);
  const lowStockSupplies = useMemo(() => supplies.filter((item) => item.currentStock > 0 && item.currentStock <= item.minimumStock), [supplies]);

  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setFixedCosts(INITIAL_FIXED_COSTS);
    setSales(INITIAL_SALES);
    setNolaMovements(RAW_NOLA_MOVEMENTS);
    setSupplies(INITIAL_SUPPLIES);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setProductIngredientsState(INITIAL_PRODUCT_INGREDIENTS);
    setCommercialGoals(INITIAL_COMMERCIAL_GOALS);
    setTargetMonthlyProfit(20000);
    setWorkingDaysMonth(22);
    setSimulationParams({
      lossReductionPercent: 0,
      b2cPriceChangePercent: 0,
      b2bPriceChangePercent: 0,
      volumeChangePercent: 0,
      fixedCostChangePercent: 0,
    });
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.FIXED_COSTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.NOLA);
    localStorage.removeItem(STORAGE_KEYS.TARGET_PROFIT);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCT_INGREDIENTS);
    localStorage.removeItem(STORAGE_KEYS.COMMERCIAL_GOALS);
  };

  const exportDataJSON = (): string => {
    const backup = {
      version: 2,
      exportDate: new Date().toISOString(),
      products,
      fixedCosts,
      sales,
      nolaMovements,
      targetMonthlyProfit,
      workingDaysMonth,
      supplies,
      stockMovements,
      productIngredients,
      commercialGoals,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products && parsed.fixedCosts && parsed.nolaMovements) {
        setProducts(parsed.products);
        setFixedCosts(parsed.fixedCosts);
        if (parsed.sales) setSales(parsed.sales);
        setNolaMovements(parsed.nolaMovements);
        if (parsed.targetMonthlyProfit) setTargetMonthlyProfit(parsed.targetMonthlyProfit);
        if (parsed.workingDaysMonth) setWorkingDaysMonth(parsed.workingDaysMonth);
        if (parsed.supplies) setSupplies(parsed.supplies);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.productIngredients) setProductIngredientsState(parsed.productIngredients);
        if (Array.isArray(parsed.commercialGoals)) setCommercialGoals(parsed.commercialGoals);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        products,
        fixedCosts,
        sales,
        nolaMovements,
        targetMonthlyProfit,
        workingDaysMonth,
        simulationParams,
        productCalculations,
        totalFixedCosts,
        totalDisbursableFixedCosts,
        currentDRE,
        weightedMCPercent,
        averageUnitMC,
        averageUnitPrice,
        breakEvenStatus,
        pecReais,
        pecUnits,
        peeReais,
        peeUnits,
        pefReais,
        pefUnits,
        marginOfSafetyReais,
        marginOfSafetyPercent,
        dailyTargetPEC,
        dailyTargetPEE,
        totalNolaLossReais,
        totalNolaDiscardedUnits,
        paretoLossReasons,
        sectorLosses,
        weeklyLossTrends,
        simulatedDRE,
        simulatedPECReais,
        simulatedPEEReais,
        simulatedBreakEvenStatus,
        simulatedAnnualSavings,
        hasSimulationData: sales.length > 0,
        supplies,
        stockMovements,
        productIngredients,
        lowStockSupplies,
        zeroStockSupplies,
        addSupply,
        updateSupply,
        registerStockMovement,
        setProductIngredients,
        getProductAvailability,
        getStockIntelligence,
        commercialGoals,
        getCommercialPerformance,
        saveCommercialGoal,
        deleteCommercialGoal,
        updateProduct,
        addProduct,
        deleteProduct,
        addSale,
        deleteSale,
        addFixedCost,
        updateFixedCost,
        deleteFixedCost,
        addNolaMovement,
        deleteNolaMovement,
        setTargetMonthlyProfit,
        setWorkingDaysMonth,
        setSimulationParams,
        resetToDefaults,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
