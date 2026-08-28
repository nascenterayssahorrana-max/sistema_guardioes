import React, { useState } from 'react';
import {
  Calculator,
  Percent,
  Layers,
  Edit3,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { Product, ProductCode } from '../types/finance';
import { formatCurrency, formatPercent, formatDecimal } from '../utils/formatters';

interface CostPricingModuleProps {
  onEditProduct: (product: Product) => void;
}

export const CostPricingModule: React.FC<CostPricingModuleProps> = ({ onEditProduct }) => {
  const { productCalculations, products } = useFinance();
  const [selectedProductCode, setSelectedProductCode] = useState<ProductCode>('GL001');

  const selectedCalc = productCalculations[selectedProductCode] || Object.values(productCalculations)[0];
  const prod = selectedCalc.product;

  // Direct costs sum
  const directCostsSum = prod.baseCost + prod.packagingCost + prod.directLaborCost + prod.otherVariableCost;

  // Chart data for comparing Margins across products
  const marginComparisonData = Object.values(productCalculations).map((pc) => ({
    name: pc.product.name.replace('Lasanha ', 'Las. ').replace('Rondelli ', 'Rond. ').replace('Nhoque ', 'Nh. ').replace('Ravioli ', 'Rav. '),
    mcB2C: Number(pc.mcPercentB2C.toFixed(1)),
    mcB2B: Number(pc.mcPercentB2B.toFixed(1)),
    realCost: pc.realVariableCost,
    lossCost: pc.allocatedLossPerUnit,
  }));

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4" />
              <span>Engenharia de Custos & Estratégia de Preço</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Custos Industriais e Formação de Preço (B2C & B2B)</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Neste módulo, o <strong>Custo de Perda NOLA</strong> é incorporado ao custo unitário variável real de cada massa.
              Analise a margem de contribuição (MC) e o markup para os dois canais de venda da Guardiões da Lasanha.
            </p>
          </div>
        </div>
      </div>

      {/* Product Selector Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {products.map((p) => {
          const isSelected = p.code === selectedProductCode;
          return (
            <button
              key={p.code}
              id={`select-prod-${p.code}`}
              onClick={() => setSelectedProductCode(p.code)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span className="font-mono opacity-70 mr-1.5 text-xs">{p.code}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Detailed Technical Sheet of Selected Product */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown (Left Col - 1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-amber-600">{prod.code}</span>
              <h2 className="text-lg font-bold text-slate-900">{prod.name}</h2>
              <span className="text-xs text-slate-500">{prod.weightGrams}g • {prod.category}</span>
            </div>
            <button
              onClick={() => onEditProduct(prod)}
              id="btn-edit-active-product"
              className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
              title="Editar Parâmetros de Custo e Preço"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
            "{prod.description}"
          </p>

          <div className="space-y-2 pt-2 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Composição do Custo Unitário</h3>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Insumos & Ingredientes (BOM):</span>
              <span className="font-medium text-slate-800">{formatCurrency(prod.baseCost)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Embalagem (Bandeja/Filme/Caixa):</span>
              <span className="font-medium text-slate-800">{formatCurrency(prod.packagingCost)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Mão de Obra Direta (MOD):</span>
              <span className="font-medium text-slate-800">{formatCurrency(prod.directLaborCost)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Outros Custos Variáveis:</span>
              <span className="font-medium text-slate-800">{formatCurrency(prod.otherVariableCost)}</span>
            </div>

            {/* Subtotal Direct Costs */}
            <div className="flex justify-between py-1.5 font-semibold text-slate-700 bg-slate-50 px-2 rounded">
              <span>Subtotal Custo Direto Padrão:</span>
              <span>{formatCurrency(directCostsSum)}</span>
            </div>

            {/* Allocated NOLA Loss Card */}
            <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Perda NOLA Alocada:</span>
                </span>
                <span className="font-bold text-amber-900 text-sm">
                  +{formatCurrency(selectedCalc.allocatedLossPerUnit)}/un
                </span>
              </div>
              <p className="text-[10px] text-amber-800">
                Rateio das perdas de fábrica (R$ {formatCurrency(selectedCalc.totalLossCostNola)} divididos por {selectedCalc.totalProducedUnitsNola || 'lotes'} unidades produzidas).
              </p>
            </div>

            {/* Total Real Variable Cost */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">CUSTO VARIÁVEL REAL TOTAL:</span>
                <span className="text-xs text-amber-400 font-semibold">(Direto + Perda NOLA)</span>
              </div>
              <span className="text-lg font-black text-amber-400">
                {formatCurrency(selectedCalc.realVariableCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Strategy: B2C vs B2B (Right Col - 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dual Channel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* B2C Card */}
            <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    B2C
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Canal Varejo / Consumidor Final</h3>
                    <span className="text-[11px] text-emerald-800 font-medium">E-commerce próprio, Loja de fábrica, Delivery</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Preço de Venda Bruto:</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(prod.priceB2C)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>(-) Imposto ({prod.taxRateB2C}%):</span>
                  <span className="text-rose-600">-{formatCurrency(prod.priceB2C * (prod.taxRateB2C / 100))}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-slate-700 pt-1 border-t border-slate-100">
                  <span>(=) Preço Líquido de Venda:</span>
                  <span>{formatCurrency(selectedCalc.netPriceB2C)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>(-) Custo Variável Real Total:</span>
                  <span className="text-rose-600">-{formatCurrency(selectedCalc.realVariableCost)}</span>
                </div>
              </div>

              {/* B2C Results */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                <div className="bg-white rounded-xl p-2.5 border border-emerald-300/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Margem Contribuição (R$)</span>
                  <span className="text-base font-extrabold text-emerald-700">{formatCurrency(selectedCalc.mcB2C)}</span>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-emerald-300/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Margem Contribuição (%)</span>
                  <span className="text-base font-extrabold text-emerald-700">{formatPercent(selectedCalc.mcPercentB2C)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between px-1">
                <span>Markup Multiplicador: <strong>{formatDecimal(selectedCalc.markupB2C, 2)}x</strong></span>
                <span>Margem saudável &gt; 40%</span>
              </div>
            </div>

            {/* B2B Card */}
            <div className="bg-gradient-to-br from-blue-50/70 to-blue-100/30 rounded-2xl p-5 border border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    B2B
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Canal Atacado / Foodservice</h3>
                    <span className="text-[11px] text-blue-800 font-medium">Restaurantes, Empórios, Rotisserias, Hotéis</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-3 border border-blue-200/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Preço de Venda Bruto:</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(prod.priceB2B)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>(-) Imposto ({prod.taxRateB2B}%):</span>
                  <span className="text-rose-600">-{formatCurrency(prod.priceB2B * (prod.taxRateB2B / 100))}</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-slate-700 pt-1 border-t border-slate-100">
                  <span>(=) Preço Líquido de Venda:</span>
                  <span>{formatCurrency(selectedCalc.netPriceB2B)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>(-) Custo Variável Real Total:</span>
                  <span className="text-rose-600">-{formatCurrency(selectedCalc.realVariableCost)}</span>
                </div>
              </div>

              {/* B2B Results */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                <div className="bg-white rounded-xl p-2.5 border border-blue-300/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Margem Contribuição (R$)</span>
                  <span className="text-base font-extrabold text-blue-700">{formatCurrency(selectedCalc.mcB2B)}</span>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-blue-300/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Margem Contribuição (%)</span>
                  <span className="text-base font-extrabold text-blue-700">{formatPercent(selectedCalc.mcPercentB2B)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between px-1">
                <span>Markup Multiplicador: <strong>{formatDecimal(selectedCalc.markupB2B, 2)}x</strong></span>
                <span>Margem de escala (&gt; 25%)</span>
              </div>
            </div>
          </div>

          {/* Educational Formula Note */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-amber-500" />
              <span>Como a Margem de Contribuição (MC) é calculada na Guardiões da Lasanha?</span>
            </div>
            <div className="space-y-1 font-mono text-[11px] bg-white p-3 rounded-xl border border-slate-200">
              <p>• <strong>Preço Líquido</strong> = Preço Bruto × (1 - Alíquota de Impostos)</p>
              <p>• <strong>MC (R$)</strong> = Preço Líquido - (Insumos + Embalagem + MOD + Outros Variáveis + <strong>Perda NOLA Rateada</strong>)</p>
              <p>• <strong>MC (%)</strong> = (Margem de Contribuição R$ / Preço Bruto) × 100</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart of Margins across the 6 items */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">Comparativo de Rentabilidade: Margem de Contribuição (%) por Canal</h2>
        <p className="text-xs text-slate-500 mb-4">
          Compare visualmente o retorno percentual de cada prato no canal B2C (verde) e no canal B2B (azul).
        </p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marginComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" domain={[0, 60]} />
              <Tooltip formatter={(val: number) => `${val}%`} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="mcB2C" name="Margem B2C (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mcB2B" name="Margem B2B (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
