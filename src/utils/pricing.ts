/**
 * Calcula o preço bruto necessário para atingir a margem desejada, já
 * considerando os impostos do canal. Retorna `null` quando os parâmetros não
 * permitem um preço válido (impostos + margem iguais ou superiores a 100%).
 */
export const calculatePriceFromTargetMargin = (
  cost: number,
  targetMarginPercent: number,
  taxRatePercent: number,
): number | null => {
  if (![cost, targetMarginPercent, taxRatePercent].every(Number.isFinite)) return null;

  const remainingRevenue = 1 - targetMarginPercent / 100 - taxRatePercent / 100;
  if (cost < 0 || targetMarginPercent < 0 || taxRatePercent < 0 || remainingRevenue <= 0) return null;

  return cost / remainingRevenue;
};
