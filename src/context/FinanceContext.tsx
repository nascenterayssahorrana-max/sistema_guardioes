import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, NolaMovement, FixedCost, SaleRecord, SimulationParams, ProductCode, LossReason, SectorType } from '../types/finance';
import { INITIAL_PRODUCTS, INITIAL_FIXED_COSTS, INITIAL_SALES, RAW_NOLA_MOVEMENTS } from '../data';

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
  simulatedAnnualSavings: number;

  // Actions
  updateProduct: (code: ProductCode, updates: Partial<Product>) => void;
  addSale: (sale: Omit<SaleRecord, 'id' | 'totalRevenue' | 'variableCostUnit' | 'allocatedLossUnit' | 'totalVariableCost' | 'contributionMarginTotal' | 'contributionMarginPercent'>) => void;
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
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TARGET_PROFIT, String(targetMonthlyProfit));
  }, [targetMonthlyProfit]);

  // Product Calculations with allocated NOLA losses
  const productCalculations = useMemo<Record<ProductCode, ProductCalculations>>(() => {
    // 1. Group NOLA per product
    const stats: Record<ProductCode, { lossCost: number; producedUnits: number; discardedUnits: number }> = {
      GL001: { lossCost: 0, producedUnits: 0, discardedUnits: 0 },
      RI002: { lossCost: 0, producedUnits: 0, discardedUnits: 0 },
      NS003: { lossCost: 0, producedUnits: 0, discardedUnits: 0 },
      RC004: { lossCost: 0, producedUnits: 0, discardedUnits: 0 },
      LT005: { lossCost: 0, producedUnits: 0, discardedUnits: 0 },
      RG006: { lossCost: 0, producedUnits: 0, discardedUnits: 0 },
    };

    nolaMovements.forEach((mov) => {
      const code = mov.productCode;
      if (stats[code]) {
        stats[code].lossCost += mov.totalLossValue;
        stats[code].producedUnits += mov.producedUnits;
        stats[code].discardedUnits += mov.discardedUnits;
      }
    });

    const result: Partial<Record<ProductCode, ProductCalculations>> = {};

    products.forEach((prod) => {
      const pStats = stats[prod.code] || { lossCost: 0, producedUnits: 0, discardedUnits: 0 };
      const effectiveProduced = pStats.producedUnits > 0 ? pStats.producedUnits : (prod.unitsPerBatch * 100);
      const allocatedLossPerUnit = pStats.lossCost / effectiveProduced;

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
      const taxRate = s.channel === 'B2C' ? (prodCalc?.product.taxRateB2C || 7.5) : (prodCalc?.product.taxRateB2B || 5.5);
      taxes += s.totalRevenue * (taxRate / 100);

      const baseVar = (prodCalc ? (prodCalc.product.baseCost + prodCalc.product.packagingCost + prodCalc.product.directLaborCost + prodCalc.product.otherVariableCost) : s.variableCostUnit) * s.quantityUnits;
      const lossAlloc = (prodCalc ? prodCalc.allocatedLossPerUnit : s.allocatedLossUnit) * s.quantityUnits;

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
        weightedMCPercent: Math.max(mcP, 1),
        averageUnitMC: Math.max(avgMC, 1),
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

  // Break-Even calculations
  const pecReais = useMemo(() => {
    const mcRate = weightedMCPercent / 100;
    return mcRate > 0 ? totalFixedCosts / mcRate : 0;
  }, [totalFixedCosts, weightedMCPercent]);

  const pecUnits = useMemo(() => {
    return averageUnitMC > 0 ? Math.ceil(totalFixedCosts / averageUnitMC) : 0;
  }, [totalFixedCosts, averageUnitMC]);

  const peeReais = useMemo(() => {
    const mcRate = weightedMCPercent / 100;
    return mcRate > 0 ? (totalFixedCosts + targetMonthlyProfit) / mcRate : 0;
  }, [totalFixedCosts, targetMonthlyProfit, weightedMCPercent]);

  const peeUnits = useMemo(() => {
    return averageUnitMC > 0 ? Math.ceil((totalFixedCosts + targetMonthlyProfit) / averageUnitMC) : 0;
  }, [totalFixedCosts, targetMonthlyProfit, averageUnitMC]);

  const pefReais = useMemo(() => {
    const mcRate = weightedMCPercent / 100;
    return mcRate > 0 ? totalDisbursableFixedCosts / mcRate : 0;
  }, [totalDisbursableFixedCosts, weightedMCPercent]);

  const pefUnits = useMemo(() => {
    return averageUnitMC > 0 ? Math.ceil(totalDisbursableFixedCosts / averageUnitMC) : 0;
  }, [totalDisbursableFixedCosts, averageUnitMC]);

  const marginOfSafetyReais = useMemo(() => {
    return currentDRE.grossRevenue - pecReais;
  }, [currentDRE.grossRevenue, pecReais]);

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
  const { simulatedDRE, simulatedPECReais, simulatedPEEReais, simulatedAnnualSavings } = useMemo(() => {
    const { lossReductionPercent, b2cPriceChangePercent, b2bPriceChangePercent, volumeChangePercent, fixedCostChangePercent } = simulationParams;

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
      const taxRate = s.channel === 'B2C' ? (prodCalc?.product.taxRateB2C || 7.5) : (prodCalc?.product.taxRateB2B || 5.5);

      simGrossRevenue += simRev;
      simTaxes += simRev * (taxRate / 100);

      const baseVarUnit = prodCalc ? (prodCalc.product.baseCost + prodCalc.product.packagingCost + prodCalc.product.directLaborCost + prodCalc.product.otherVariableCost) : s.variableCostUnit;
      const lossAllocUnit = (prodCalc ? prodCalc.allocatedLossPerUnit : s.allocatedLossUnit) * (1 - lossReductionPercent / 100);

      simVarCPV += baseVarUnit * simUnits;
      simAllocLoss += lossAllocUnit * simUnits;
    });

    // Fallback if no sales
    if (sales.length === 0) {
      simGrossRevenue = 100000 * (1 + volumeChangePercent / 100);
      simTaxes = simGrossRevenue * 0.065;
      simVarCPV = simGrossRevenue * 0.55;
      simAllocLoss = simGrossRevenue * 0.03 * (1 - lossReductionPercent / 100);
    }

    const simNetRevenue = simGrossRevenue - simTaxes;
    const simTotalVar = simVarCPV + simAllocLoss;
    const simContributionMargin = simNetRevenue - simTotalVar;
    const simMCPercent = simGrossRevenue > 0 ? (simContributionMargin / simGrossRevenue) * 100 : weightedMCPercent;
    const simOperationalProfit = simContributionMargin - simFixedCost;
    const simOperationalProfitPercent = simGrossRevenue > 0 ? (simOperationalProfit / simGrossRevenue) * 100 : 0;

    const mcRate = Math.max(simMCPercent / 100, 0.01);
    const simPEC = simFixedCost / mcRate;
    const simPEE = (simFixedCost + targetMonthlyProfit) / mcRate;

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
      simulatedAnnualSavings,
    };
  }, [simulationParams, totalFixedCosts, sales, productCalculations, weightedMCPercent, targetMonthlyProfit, totalNolaLossReais]);

  // Actions
  const updateProduct = (code: ProductCode, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.code === code ? { ...p, ...updates } : p)));
  };

  const addSale = (newSale: Omit<SaleRecord, 'id' | 'totalRevenue' | 'variableCostUnit' | 'allocatedLossUnit' | 'totalVariableCost' | 'contributionMarginTotal' | 'contributionMarginPercent'>) => {
    const prodCalc = productCalculations[newSale.productCode];
    const totalRevenue = newSale.quantityUnits * newSale.unitPrice;
    const variableCostUnit = prodCalc ? (prodCalc.product.baseCost + prodCalc.product.packagingCost + prodCalc.product.directLaborCost + prodCalc.product.otherVariableCost) : 12.0;
    const allocatedLossUnit = prodCalc ? prodCalc.allocatedLossPerUnit : 0.3;
    const totalVariableCost = (variableCostUnit + allocatedLossUnit) * newSale.quantityUnits;
    const taxRate = newSale.channel === 'B2C' ? (prodCalc?.product.taxRateB2C || 7.5) : (prodCalc?.product.taxRateB2B || 5.5);
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
    };

    setSales((prev) => [record, ...prev]);
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  const addFixedCost = (cost: Omit<FixedCost, 'id'>) => {
    const record: FixedCost = {
      id: `fc-${Date.now()}`,
      ...cost,
    };
    setFixedCosts((prev) => [...prev, record]);
  };

  const updateFixedCost = (id: string, updates: Partial<FixedCost>) => {
    setFixedCosts((prev) => prev.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc)));
  };

  const deleteFixedCost = (id: string) => {
    setFixedCosts((prev) => prev.filter((fc) => fc.id !== id));
  };

  const addNolaMovement = (mov: Omit<NolaMovement, 'id' | 'totalLossValue'>) => {
    const totalLossValue = mov.discardedUnits * mov.unitCost;
    const record: NolaMovement = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      ...mov,
      totalLossValue,
    };
    setNolaMovements((prev) => [record, ...prev]);
  };

  const deleteNolaMovement = (id: string) => {
    setNolaMovements((prev) => prev.filter((m) => m.id !== id));
  };

  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setFixedCosts(INITIAL_FIXED_COSTS);
    setSales(INITIAL_SALES);
    setNolaMovements(RAW_NOLA_MOVEMENTS);
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
        simulatedAnnualSavings,
        updateProduct,
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
