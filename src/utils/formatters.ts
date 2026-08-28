export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${(value || 0).toFixed(decimals).replace('.', ',')}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value || 0));
};

export const formatDecimal = (value: number, decimals: number = 2): string => {
  return (value || 0).toFixed(decimals).replace('.', ',');
};
