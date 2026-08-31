/**
 * Referência temporal da base demonstrativa inicial do MVP.
 * Os valores operacionais continuam sendo calculados pelo FinanceContext.
 */
export const DEMO_DATA_CONTEXT = {
  label: 'Base demonstrativa',
  sales: {
    periodLabel: '25–29/08/2026',
    description: 'Vendas registradas na base demonstrativa',
  },
  fixedCosts: {
    periodLabel: 'mensal',
    description: 'Custos fixos mensais cadastrados',
  },
  nolaLosses: {
    periodLabel: '27 semanas (S01–S27)',
    description: 'Perdas acumuladas na base operacional demonstrativa',
  },
  costPremise: 'O custo real inclui custos variáveis e o rateio das perdas da base demonstrativa.',
  breakEvenPremise: 'Estimativas baseadas no mix de vendas da base demonstrativa e nos custos fixos mensais cadastrados.',
  simulationPremise: 'As simulações utilizam o mix de vendas atual da base demonstrativa. Não representam previsão de demanda.',
} as const;
