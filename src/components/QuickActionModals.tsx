import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  AlertTriangle,
  Building2,
  Edit3,
  Download,
  Upload,
  CheckCircle2,
  PlusCircle,
  HelpCircle,
  FileJson,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Product, ProductCode, SalesChannel, LossReason, SectorType, FixedCostCategory, FixedCost } from '../types/finance';
import { formatCurrency, formatPercent } from '../utils/formatters';

// ----------------------------------------------------
// 1. ADD SALE MODAL
// ----------------------------------------------------
interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose }) => {
  const { products, productCalculations, addSale } = useFinance();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [channel, setChannel] = useState<SalesChannel>('B2C');
  const [productCode, setProductCode] = useState<ProductCode>('GL001');
  const [quantityUnits, setQuantityUnits] = useState<number>(50);
  const [unitPrice, setUnitPrice] = useState<number>(28.9);

  // Auto-fill suggested price when product or channel changes
  useEffect(() => {
    const selectedProd = products.find((p) => p.code === productCode);
    if (selectedProd) {
      setUnitPrice(channel === 'B2C' ? selectedProd.priceB2C : selectedProd.priceB2B);
    }
  }, [productCode, channel, products]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.code === productCode);
  const currentCalc = productCalculations[productCode];
  const totalRevenue = quantityUnits * unitPrice;
  const taxRate = channel === 'B2C' ? (currentProduct?.taxRateB2C || 7.5) : (currentProduct?.taxRateB2B || 5.5);
  const netRevenue = totalRevenue * (1 - taxRate / 100);
  const realVarCostUnit = currentCalc?.realVariableCost || 13;
  const totalVarCost = realVarCostUnit * quantityUnits;
  const estimatedMC = netRevenue - totalVarCost;
  const estimatedMCPercent = totalRevenue > 0 ? (estimatedMC / totalRevenue) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor, informe o nome do cliente ou estabelecimento.');
      return;
    }
    if (quantityUnits <= 0 || unitPrice <= 0) {
      alert('A quantidade e o preço unitário devem ser maiores que zero.');
      return;
    }

    addSale({
      date,
      customerName: customerName.trim(),
      channel,
      productCode,
      productName: currentProduct?.name || 'Massa Artesanal',
      quantityUnits,
      unitPrice,
    });

    setCustomerName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-base font-bold">Lançar Nova Venda / Pedido</h2>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Canal de Venda:</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesChannel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
              >
                <option value="B2C">Varejo / Consumidor Final (B2C)</option>
                <option value="B2B">Atacado / Foodservice (B2B)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cliente / Estabelecimento:</label>
            <input
              type="text"
              placeholder="Ex: Cantina Bella Pasta, Supermercado Central..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Produto:</label>
            <select
              value={productCode}
              onChange={(e) => setProductCode(e.target.value as ProductCode)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
            >
              {products.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} - {p.name} ({p.weightGrams}g)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantidade (unidades):</label>
              <input
                type="number"
                min={1}
                value={quantityUnits}
                onChange={(e) => setQuantityUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preço Unitário (R$):</label>
              <input
                type="number"
                step="0.01"
                min={0.1}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-700"
                required
              />
            </div>
          </div>

          {/* Live Preview of Financial Impact */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
            <div className="flex justify-between items-center text-slate-700">
              <span>Receita Total Bruta:</span>
              <strong className="text-slate-900 text-sm">{formatCurrency(totalRevenue)}</strong>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Custo Variável Total (c/ perdas):</span>
              <span className="text-rose-600">-{formatCurrency(totalVarCost)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-emerald-200/60 font-bold text-emerald-900">
              <span>Margem de Contribuição Gerada:</span>
              <span className="text-sm">
                {formatCurrency(estimatedMC)} ({formatPercent(estimatedMCPercent)})
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
            >
              Confirmar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. ADD NOLA LOSS ENTRY MODAL
// ----------------------------------------------------
interface AddNolaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddNolaModal: React.FC<AddNolaModalProps> = ({ isOpen, onClose }) => {
  const { products, addNolaMovement } = useFinance();

  const [week, setWeek] = useState('S28');
  const [sector, setSector] = useState<SectorType>('COZINHA_CENTRAL');
  const [productCode, setProductCode] = useState<ProductCode>('GL001');
  const [producedUnits, setProducedUnits] = useState<number>(300);
  const [discardedUnits, setDiscardedUnits] = useState<number>(15);
  const [unitCost, setUnitCost] = useState<number>(13.5);
  const [lossReason, setLossReason] = useState<LossReason>('Falha de congelamento');
  const [origin, setOrigin] = useState('Câmara Fria - Túnel');

  useEffect(() => {
    const prod = products.find((p) => p.code === productCode);
    if (prod) {
      const baseCostDirect = prod.baseCost + prod.packagingCost + prod.directLaborCost + prod.otherVariableCost;
      setUnitCost(Number(baseCostDirect.toFixed(2)));
    }
  }, [productCode, products]);

  if (!isOpen) return null;

  const currentProd = products.find((p) => p.code === productCode);
  const totalLoss = discardedUnits * unitCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (discardedUnits <= 0) {
      alert('A quantidade descartada deve ser maior que zero.');
      return;
    }

    const weekNum = parseInt(week.replace('S', ''), 10) || 28;

    addNolaMovement({
      date: new Date().toLocaleDateString('pt-BR'),
      week,
      weekNumber: weekNum,
      sector,
      productCode,
      productName: currentProd?.name || 'Massa Artesanal',
      plannedBatches: Math.ceil(producedUnits / (currentProd?.unitsPerBatch || 300)),
      producedBatches: Math.ceil(producedUnits / (currentProd?.unitsPerBatch || 300)),
      producedUnits,
      discardedUnits,
      unitCost,
      lossReason,
      origin,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-rose-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-base font-bold">Lançar Apontamento de Perda NOLA</h2>
          </div>
          <button onClick={onClose} className="p-1 text-rose-200 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semana de Produção:</label>
              <input
                type="text"
                placeholder="Ex: S28"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Setor Fabril:</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
              >
                <option value="COZINHA_CENTRAL">Cozinha Central</option>
                <option value="PRODUCAO_MASSAS">Produção - Massas</option>
                <option value="PRODUCAO">Produção Geral</option>
                <option value="ESTOQUE_CENTRAL">Estoque Central</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Produto Afetado:</label>
            <select
              value={productCode}
              onChange={(e) => setProductCode(e.target.value as ProductCode)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
            >
              {products.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qtd Produzida:</label>
              <input
                type="number"
                min={1}
                value={producedUnits}
                onChange={(e) => setProducedUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qtd Descartada:</label>
              <input
                type="number"
                min={1}
                value={discardedUnits}
                onChange={(e) => setDiscardedUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-600"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custo Unit. (R$):</label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Motivo do Refugo / Causa-Raiz:</label>
            <select
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value as LossReason)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="Falha de congelamento">Falha de congelamento</option>
              <option value="Massa com espessura irregular">Massa com espessura irregular</option>
              <option value="Vazamento de recheio no cozimento">Vazamento de recheio no cozimento</option>
              <option value="Erro de selagem na embalagem">Erro de selagem na embalagem</option>
              <option value="Quebra durante manipulação/transporte interno">Quebra durante manipulação/transporte interno</option>
              <option value="Sobras de laminação não reaproveitadas">Sobras de laminação não reaproveitadas</option>
              <option value="Aparência fora do padrão">Aparência fora do padrão</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Origem / Posto de Trabalho:</label>
            <input
              type="text"
              placeholder="Ex: Laminadora 02, Mesa de montagem..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              required
            />
          </div>

          <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 flex items-center justify-between">
            <span className="font-bold text-rose-900">Prejuízo Total Calculado:</span>
            <span className="text-base font-black text-rose-700">{formatCurrency(totalLoss)}</span>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
            >
              Gravar Apontamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. ADD / EDIT FIXED COST MODAL
// ----------------------------------------------------
interface FixedCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  costToEdit?: FixedCost | null;
}

export const FixedCostModal: React.FC<FixedCostModalProps> = ({ isOpen, onClose, costToEdit }) => {
  const { addFixedCost, updateFixedCost } = useFinance();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FixedCostCategory>('INFRAESTRUTURA');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(2000);
  const [isDisbursable, setIsDisbursable] = useState(true);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (costToEdit) {
      setName(costToEdit.name);
      setCategory(costToEdit.category);
      setMonthlyAmount(costToEdit.monthlyAmount);
      setIsDisbursable(costToEdit.isDisbursable);
      setDescription(costToEdit.description);
    } else {
      setName('');
      setCategory('INFRAESTRUTURA');
      setMonthlyAmount(1500);
      setIsDisbursable(true);
      setDescription('');
    }
  }, [costToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome da despesa fixa.');
      return;
    }
    if (monthlyAmount <= 0) {
      alert('O valor mensal deve ser maior que zero.');
      return;
    }

    if (costToEdit) {
      updateFixedCost(costToEdit.id, {
        name: name.trim(),
        category,
        monthlyAmount,
        isDisbursable,
        description: description.trim(),
      });
    } else {
      addFixedCost({
        name: name.trim(),
        category,
        monthlyAmount,
        isDisbursable,
        description: description.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <h2 className="text-base font-bold">{costToEdit ? 'Editar Custo Fixo' : 'Novo Custo Fixo'}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-blue-200 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome do Item / Despesa:</label>
            <input
              type="text"
              placeholder="Ex: Aluguel do Galpão Fabril, Energia Elétrica..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FixedCostCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              >
                <option value="INFRAESTRUTURA">Infraestrutura</option>
                <option value="PESSOAL_FIXO">Pessoal Fixo</option>
                <option value="ENERGIA_UTILIDADES">Energia & Utilidades</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="TECNOLOGIA_SISTEMAS">Tecnologia & Sistemas</option>
                <option value="ADMINISTRATIVO_VENDAS">Administrativo & Vendas</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Valor Mensal (R$):</label>
              <input
                type="number"
                step="0.01"
                min={1}
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Impacto Financeiro (Caixa):</label>
            <div className="flex space-x-4 pt-1">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="disbursable"
                  checked={isDisbursable}
                  onChange={() => setIsDisbursable(true)}
                  className="accent-blue-600"
                />
                <span className="text-slate-800 font-medium">Desembolsável (Saída de Caixa)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="disbursable"
                  checked={!isDisbursable}
                  onChange={() => setIsDisbursable(false)}
                  className="accent-blue-600"
                />
                <span className="text-slate-800 font-medium">Não-Caixa (Depreciação)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Descrição / Detalhes:</label>
            <textarea
              placeholder="Ex: Contrato de locação com validade até 2028..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl h-16"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
            >
              {costToEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. EDIT PRODUCT MODAL
// ----------------------------------------------------
interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, product }) => {
  const { updateProduct } = useFinance();

  const [baseCost, setBaseCost] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [directLaborCost, setDirectLaborCost] = useState(0);
  const [otherVariableCost, setOtherVariableCost] = useState(0);
  const [priceB2C, setPriceB2C] = useState(0);
  const [priceB2B, setPriceB2B] = useState(0);

  useEffect(() => {
    if (product) {
      setBaseCost(product.baseCost);
      setPackagingCost(product.packagingCost);
      setDirectLaborCost(product.directLaborCost);
      setOtherVariableCost(product.otherVariableCost);
      setPriceB2C(product.priceB2C);
      setPriceB2B(product.priceB2B);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct(product.code, {
      baseCost,
      packagingCost,
      directLaborCost,
      otherVariableCost,
      priceB2C,
      priceB2B,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5" />
            <h2 className="text-base font-bold">Editar Custos & Preços: {product.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-amber-200 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600">
            Código: <strong>{product.code}</strong> • Categoria: {product.category} • Peso: {product.weightGrams}g
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Componentes de Custo (R$)</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Insumos & Ingredientes (BOM):</label>
                <input
                  type="number"
                  step="0.01"
                  value={baseCost}
                  onChange={(e) => setBaseCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Embalagem Primária/Sec.:</label>
                <input
                  type="number"
                  step="0.01"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mão de Obra Direta (MOD):</label>
                <input
                  type="number"
                  step="0.01"
                  value={directLaborCost}
                  onChange={(e) => setDirectLaborCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Outros Custos Variáveis:</label>
                <input
                  type="number"
                  step="0.01"
                  value={otherVariableCost}
                  onChange={(e) => setOtherVariableCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Preços de Venda (R$)</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-emerald-800 mb-1">Preço Varejo (B2C):</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceB2C}
                  onChange={(e) => setPriceB2C(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl font-bold text-emerald-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-blue-800 mb-1">Preço Atacado (B2B):</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceB2B}
                  onChange={(e) => setPriceB2B(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-xl font-bold text-blue-900"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
            >
              Salvar Ficha Técnica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. BACKUP & EXPORT/IMPORT MODAL
// ----------------------------------------------------
interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { exportDataJSON, importDataJSON } = useFinance();
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guardioes_lasanha_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('Dados importados e sincronizados com sucesso!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setImportStatus('Erro ao importar. Verifique o formato do arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJson className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Backup e Dados JSON</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Exporte todos os cadastros, vendas, custos fixos e os 180 apontamentos NOLA em formato JSON padronizado para segurança ou integração.
          </p>

          {importStatus && (
            <div
              className={`p-3 rounded-xl font-semibold ${
                importStatus.includes('sucesso')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {importStatus}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleDownloadJSON}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Backup Completo (.JSON)</span>
            </button>

            <div className="relative">
              <label className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Restaurar / Importar Arquivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
