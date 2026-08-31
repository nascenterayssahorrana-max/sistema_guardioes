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
import { calculatePriceFromTargetMargin } from '../utils/pricing';

// ----------------------------------------------------
// 1. ADD SALE MODAL
// ----------------------------------------------------
interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose }) => {
  const { products, productCalculations, addSale, getProductAvailability } = useFinance();
  const sellableProducts = products.filter((product) => product.active);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [channel, setChannel] = useState<SalesChannel>('B2C');
  const [productCode, setProductCode] = useState<ProductCode>('GL001');
  const [quantityUnits, setQuantityUnits] = useState<number>(50);
  const [unitPrice, setUnitPrice] = useState<number>(28.9);

  // Auto-fill suggested price when product or channel changes
  useEffect(() => {
    const selectedProd = sellableProducts.find((p) => p.code === productCode) ?? sellableProducts[0];
    if (selectedProd) {
      if (selectedProd.code !== productCode) setProductCode(selectedProd.code);
      setUnitPrice(channel === 'B2C' ? selectedProd.priceB2C : selectedProd.priceB2B);
    }
  }, [productCode, channel, sellableProducts]);

  if (!isOpen) return null;

  const currentProduct = sellableProducts.find((p) => p.code === productCode);
  const currentCalc = productCalculations[productCode];
  const totalRevenue = quantityUnits * unitPrice;
  const taxRate = channel === 'B2C' ? (currentProduct?.taxRateB2C ?? 7.5) : (currentProduct?.taxRateB2B ?? 5.5);
  const netRevenue = totalRevenue * (1 - taxRate / 100);
  const realVarCostUnit = currentCalc?.realVariableCost ?? 0;
  const totalVarCost = realVarCostUnit * quantityUnits;
  const estimatedMC = netRevenue - totalVarCost;
  const estimatedMCPercent = totalRevenue > 0 ? (estimatedMC / totalRevenue) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor, informe o nome do cliente ou estabelecimento.');
      return;
    }
    if (!currentProduct) {
      alert('Selecione um produto ativo para registrar a venda.');
      return;
    }
    if (quantityUnits <= 0 || unitPrice <= 0) {
      alert('A quantidade e o preço unitário devem ser maiores que zero.');
      return;
    }
    const availability = getProductAvailability(productCode, quantityUnits);
    if (availability.configured && !availability.sufficient) {
      const shortages = availability.requirements.filter((item) => !item.sufficient).map((item) => `${item.supplyName}: déficit de ${item.deficit} ${item.unit}`).join('; ');
      alert(`Estoque insuficiente para este produto. ${shortages}`);
      return;
    }

    const registered = addSale({
      date,
      customerName: customerName.trim(),
      channel,
      productCode,
      productName: currentProduct?.name || 'Massa Artesanal',
      quantityUnits,
      unitPrice,
    });
    if (!registered) {
      alert('Este produto está inativo e não pode receber novas vendas.');
      return;
    }

    setCustomerName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="p-5 bg-[#5F9C1C] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-base font-bold">Lançar Nova Venda / Pedido</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar janela" className="p-1 text-[#CAE79A] hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Data:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Canal de Venda:</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesChannel)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-neutral-800"
              >
                <option value="B2C">Varejo / Consumidor Final (B2C)</option>
                <option value="B2B">Atacado / Foodservice (B2B)</option>
              </select>
            </div>
          </div>

          {sellableProducts.length === 0 ? (
            <div className="rounded-xl border border-[#FFEDB0] bg-[#FFF8E6] p-4 text-sm text-[#5E3B00]">Não há produtos ativos disponíveis para uma nova venda.</div>
          ) : <>
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Cliente / Estabelecimento:</label>
            <input
              type="text"
              placeholder="Ex: Cantina Bella Pasta, Supermercado Central..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Produto:</label>
            <select
              value={productCode}
              onChange={(e) => setProductCode(e.target.value as ProductCode)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-semibold text-neutral-800"
            >
              {sellableProducts.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} - {p.name} ({p.weightGrams}g)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Quantidade (unidades):</label>
              <input
                type="number"
                min={1}
                value={quantityUnits}
                onChange={(e) => setQuantityUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Preço Unitário (R$):</label>
              <input
                type="number"
                step="0.01"
                min={0.1}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-[#5F9C1C]"
                required
              />
            </div>
          </div>

          {/* Live Preview of Financial Impact */}
          <div className="bg-[#F4FAEA]/70 p-3.5 rounded-2xl border border-[#CAE79A] space-y-1">
            <div className="flex justify-between items-center text-neutral-700">
              <span>Receita Total Bruta:</span>
              <strong className="text-[#111111] text-sm">{formatCurrency(totalRevenue)}</strong>
            </div>
            <div className="flex justify-between items-center text-[11px] text-neutral-500">
              <span>Custo Variável Total (c/ perdas):</span>
              <span className="text-[#C92F0A]">-{formatCurrency(totalVarCost)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#CAE79A]/60 font-bold text-[#314E0D]">
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
              className="px-4 py-2 bg-[#F5F5F5] hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sellableProducts.length === 0}
              className="px-5 py-2 bg-[#75B82A] hover:bg-[#8CCB35] text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar Venda
            </button>
          </div>
          </>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="p-5 bg-[#962006] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-base font-bold">Lançar Apontamento de Perda</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar janela" className="p-1 text-[#FFB79B] hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Semana de Produção:</label>
              <input
                type="text"
                placeholder="Ex: S28"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Setor Fabril:</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorType)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-neutral-800"
              >
                <option value="COZINHA_CENTRAL">Cozinha Central</option>
                <option value="PRODUCAO_MASSAS">Produção - Massas</option>
                <option value="PRODUCAO">Produção Geral</option>
                <option value="ESTOQUE_CENTRAL">Estoque Central</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Produto Afetado:</label>
            <select
              value={productCode}
              onChange={(e) => setProductCode(e.target.value as ProductCode)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-semibold text-neutral-800"
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
              <label className="block font-semibold text-neutral-700 mb-1">Qtd Produzida:</label>
              <input
                type="number"
                min={1}
                value={producedUnits}
                onChange={(e) => setProducedUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Qtd Descartada:</label>
              <input
                type="number"
                min={1}
                value={discardedUnits}
                onChange={(e) => setDiscardedUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-[#C92F0A]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Custo Unit. (R$):</label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Motivo do Refugo / Causa-Raiz:</label>
            <select
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value as LossReason)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-semibold"
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
            <label className="block font-semibold text-neutral-700 mb-1">Origem / Posto de Trabalho:</label>
            <input
              type="text"
              placeholder="Ex: Laminadora 02, Mesa de montagem..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl"
              required
            />
          </div>

          <div className="bg-[#FFF0EA] p-3.5 rounded-2xl border border-[#FFB79B] flex items-center justify-between">
            <span className="font-bold text-[#691603]">Prejuízo Total Calculado:</span>
            <span className="text-base font-black text-[#C92F0A]">{formatCurrency(totalLoss)}</span>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F5F5F5] hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C92F0A] hover:bg-[#E33B0C] text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="p-5 bg-[#08627F] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <h2 className="text-base font-bold">{costToEdit ? 'Editar Custo Fixo' : 'Novo Custo Fixo'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar janela" className="p-1 text-[#A7E5F2] hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Nome do Item / Despesa:</label>
            <input
              type="text"
              placeholder="Ex: Aluguel do Galpão Fabril, Energia Elétrica..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FixedCostCategory)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-semibold"
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
              <label className="block font-semibold text-neutral-700 mb-1">Valor Mensal (R$):</label>
              <input
                type="number"
                step="0.01"
                min={1}
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-[#111111]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Impacto Financeiro (Caixa):</label>
            <div className="flex space-x-4 pt-1">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="disbursable"
                  checked={isDisbursable}
                  onChange={() => setIsDisbursable(true)}
                  className="accent-[#087B9F]"
                />
                <span className="text-neutral-800 font-medium">Desembolsável (Saída de Caixa)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="disbursable"
                  checked={!isDisbursable}
                  onChange={() => setIsDisbursable(false)}
                  className="accent-[#087B9F]"
                />
                <span className="text-neutral-800 font-medium">Não-Caixa (Depreciação)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Descrição / Detalhes:</label>
            <textarea
              placeholder="Ex: Contrato de locação com validade até 2028..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl h-16"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F5F5F5] hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#087B9F] hover:bg-[#0B9FC7] text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
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
  const { updateProduct, productCalculations } = useFinance();

  const [baseCost, setBaseCost] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [directLaborCost, setDirectLaborCost] = useState(0);
  const [otherVariableCost, setOtherVariableCost] = useState(0);
  const [taxRateB2C, setTaxRateB2C] = useState(0);
  const [taxRateB2B, setTaxRateB2B] = useState(0);
  const [targetMarginB2C, setTargetMarginB2C] = useState(0);
  const [targetMarginB2B, setTargetMarginB2B] = useState(0);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (product) {
      setBaseCost(product.baseCost);
      setPackagingCost(product.packagingCost);
      setDirectLaborCost(product.directLaborCost);
      setOtherVariableCost(product.otherVariableCost);
      setTaxRateB2C(product.taxRateB2C);
      setTaxRateB2B(product.taxRateB2B);
      setTargetMarginB2C(product.targetMarginB2C ?? 0);
      setTargetMarginB2B(product.targetMarginB2B ?? 0);
      setActive(product.active);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const directCost = baseCost + packagingCost + directLaborCost + otherVariableCost;
  const allocatedLossPerUnit = productCalculations[product.code]?.allocatedLossPerUnit ?? 0;
  const pricingCost = directCost + allocatedLossPerUnit;
  const calculatedPriceB2C = calculatePriceFromTargetMargin(pricingCost, targetMarginB2C, taxRateB2C);
  const calculatedPriceB2B = calculatePriceFromTargetMargin(pricingCost, targetMarginB2B, taxRateB2B);
  const hasValidPricing = calculatedPriceB2C !== null && calculatedPriceB2B !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedPriceB2C === null || calculatedPriceB2B === null) return;
    updateProduct(product.code, {
      baseCost,
      packagingCost,
      directLaborCost,
      otherVariableCost,
      priceB2C: calculatedPriceB2C,
      priceB2B: calculatedPriceB2B,
      taxRateB2C,
      taxRateB2B,
      targetMarginB2C,
      targetMarginB2B,
      active,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="p-5 bg-[#D99000] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5" />
            <h2 className="text-base font-bold">Editar Custos & Preços: {product.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar janela" className="p-1 text-[#FFE080] hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 font-mono text-[11px] text-neutral-600">
            Código: <strong>{product.code}</strong> • Categoria: {product.category} • Peso: {product.weightGrams}g
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">Componentes de Custo (R$)</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-600 mb-1">Insumos & Ingredientes (BOM):</label>
                <input
                  type="number"
                  step="0.01"
                  value={baseCost}
                  onChange={(e) => setBaseCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 mb-1">Embalagem Primária/Sec.:</label>
                <input
                  type="number"
                  step="0.01"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 mb-1">Mão de Obra Direta (MOD):</label>
                <input
                  type="number"
                  step="0.01"
                  value={directLaborCost}
                  onChange={(e) => setDirectLaborCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 mb-1">Outros Custos Variáveis:</label>
                <input
                  type="number"
                  step="0.01"
                  value={otherVariableCost}
                  onChange={(e) => setOtherVariableCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h3 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">Preços de Venda Calculados (R$)</h3>
            <p className="text-[10px] text-neutral-500">Atualizados automaticamente ao mudar custo, imposto ou margem desejada.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#426D12] mb-1">Preço Varejo (B2C):</label>
                <input
                  type="text"
                  value={calculatedPriceB2C === null ? 'Revise os parâmetros' : formatCurrency(calculatedPriceB2C)}
                  readOnly
                  aria-label="Preço Varejo B2C calculado automaticamente"
                  className="w-full px-3 py-2 bg-[#F4FAEA]/50 border border-[#B6DE68] rounded-xl font-bold text-[#314E0D] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#06495E] mb-1">Preço Atacado (B2B):</label>
                <input
                  type="text"
                  value={calculatedPriceB2B === null ? 'Revise os parâmetros' : formatCurrency(calculatedPriceB2B)}
                  readOnly
                  aria-label="Preço Atacado B2B calculado automaticamente"
                  className="w-full px-3 py-2 bg-[#EAF9FD]/50 border border-[#63D3E9] rounded-xl font-bold text-[#043342] cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h3 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">Impostos por canal (%)</h3>
            <p className="text-[10px] text-neutral-500">A taxa de 0% é válida e será preservada em novas vendas.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-semibold text-[#426D12]">B2C<input type="number" min="0" max="100" step="0.1" value={taxRateB2C} onChange={(event) => setTaxRateB2C(Number(event.target.value))} className="mt-1 w-full px-3 py-2 bg-[#F4FAEA]/50 border border-[#B6DE68] rounded-xl font-bold" /></label>
              <label className="block font-semibold text-[#06495E]">B2B<input type="number" min="0" max="100" step="0.1" value={taxRateB2B} onChange={(event) => setTaxRateB2B(Number(event.target.value))} className="mt-1 w-full px-3 py-2 bg-[#EAF9FD]/50 border border-[#63D3E9] rounded-xl font-bold" /></label>
            </div>
            {!hasValidPricing && <p className="text-[10px] font-medium text-[#C92F0A]">A margem desejada somada aos impostos deve ser menor que 100%.</p>}
          </div>

          <label className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
            <span><strong>Status do produto</strong><span className="mt-0.5 block text-[10px] text-neutral-500">Produtos inativos permanecem no histórico, mas não podem receber novas vendas.</span></span>
            <span className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> {active ? 'Ativo' : 'Inativo'}</span>
          </label>

          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h3 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">Margem desejada para precificação (%)</h3>
            <p className="text-[10px] text-neutral-500">Define o preço calculado do canal. Não altera a margem de contribuição das vendas já registradas.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-semibold text-[#426D12]">B2C<input type="number" min="0" max="99" step="0.1" value={targetMarginB2C} onChange={(e) => setTargetMarginB2C(Number(e.target.value))} className="mt-1 w-full px-3 py-2 bg-[#F4FAEA]/50 border border-[#B6DE68] rounded-xl font-bold" /></label>
              <label className="block font-semibold text-[#06495E]">B2B<input type="number" min="0" max="99" step="0.1" value={targetMarginB2B} onChange={(e) => setTargetMarginB2B(Number(e.target.value))} className="mt-1 w-full px-3 py-2 bg-[#EAF9FD]/50 border border-[#63D3E9] rounded-xl font-bold" /></label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F5F5F5] hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hasValidPricing}
              className="px-5 py-2 bg-[#D99000] hover:bg-[#FFB800] text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar custos e preços
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="p-5 bg-black text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJson className="w-5 h-5 text-[#FFC52B]" />
            <h2 className="text-base font-bold">Backup e Dados JSON</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar janela" className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          <p className="text-neutral-600 leading-relaxed">
            Exporte todos os cadastros, vendas, custos fixos e os 180 apontamentos de perdas em formato JSON padronizado para segurança ou integração.
          </p>

          {importStatus && (
            <div
              className={`p-3 rounded-xl font-semibold ${
                importStatus.includes('sucesso')
                  ? 'bg-[#F4FAEA] text-[#426D12] border border-[#CAE79A]'
                  : 'bg-[#FFF0EA] text-[#962006] border border-[#FFB79B]'
              }`}
            >
              {importStatus}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleDownloadJSON}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-[#FFB800] hover:bg-[#D99000] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Backup Completo (.JSON)</span>
            </button>

            <div className="relative">
              <label className="w-full flex items-center justify-center space-x-2 py-3 bg-[#F5F5F5] hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl border border-neutral-300 transition-colors cursor-pointer">
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

        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-xl font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
