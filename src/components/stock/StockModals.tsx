import React, { useEffect, useState } from 'react';
import { useStock, getSituation } from '../../context/StockContext';
import { useFinance } from '../../context/FinanceContext';
import { StockProduct, StockUnit, ExitReason, EntryReason } from '../../types/stock';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  Modal,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
  btnGreen,
  btnRose,
  Alert,
  SituationBadge,
} from './StockUI';
import { Pencil, PlusCircle, MinusCircle, History, Layers, Power } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

export const UNITS: StockUnit[] = ['Unidade', 'Kg', 'g', 'L', 'ml', 'Caixa', 'Pacote', 'Metro'];
const ENTRY_REASONS: EntryReason[] = [
  'Compra',
  'Devolução de cliente',
  'Produção / Retorno',
  'Estoque inicial',
  'Outros',
];
const EXIT_REASONS: ExitReason[] = [
  'Venda',
  'Consumo',
  'Produção',
  'Perda',
  'Avaria',
  'Uso interno',
  'Ajuste',
  'Outros',
];

/* =========================== Nova / Editar Produto =========================== */
export const ProductFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product?: StockProduct | null;
}> = ({ isOpen, onClose, product }) => {
  const { categories, addProduct, updateProduct } = useStock();
  const activeCats = categories.filter((c) => c.status === 'Ativo');
  const [form, setForm] = useState({
    code: '',
    name: '',
    categoryId: activeCats[0]?.id || '',
    unit: 'Unidade' as string,
    description: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    initialStock: 0,
    minimumStock: 0,
    maximumStock: 0,
    unitCost: 0,
    location: '',
    supplier: '',
    supplierProductCode: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (product) {
      setForm({
        code: product.code,
        name: product.name,
        categoryId: product.categoryId,
        unit: product.unit,
        description: product.description || '',
        status: product.status,
        initialStock: product.initialStock,
        minimumStock: product.minimumStock,
        maximumStock: product.maximumStock || 0,
        unitCost: product.unitCost,
        location: product.location || '',
        supplier: product.supplier || '',
        supplierProductCode: product.supplierProductCode || '',
      });
    } else {
      setForm((f) => ({
        ...f,
        code: '',
        name: '',
        categoryId: activeCats[0]?.id || '',
        unit: 'Unidade',
        description: '',
        status: 'Ativo',
        initialStock: 0,
        minimumStock: 0,
        maximumStock: 0,
        unitCost: 0,
        location: '',
        supplier: '',
        supplierProductCode: '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const payload = {
      code: form.code,
      name: form.name,
      categoryId: form.categoryId,
      unit: form.unit,
      description: form.description,
      status: form.status,
      initialStock: Number(form.initialStock) || 0,
      minimumStock: Number(form.minimumStock) || 0,
      maximumStock: Number(form.maximumStock) || undefined,
      unitCost: Number(form.unitCost) || 0,
      location: form.location,
      supplier: form.supplier,
      supplierProductCode: form.supplierProductCode,
    };
    if (product) {
      if (!payload.name.trim()) return setError('Informe o nome do produto.');
      updateProduct(product.id, payload);
      onClose();
      return;
    }
    const res = addProduct(payload as any);
    if (!res.ok) return setError(res.message || 'Não foi possível salvar.');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      wide
      title={product ? 'Editar produto' : 'Novo produto'}
      subtitle="Informações básicas, controle de estoque e fornecedor"
    >
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
            Informações básicas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Código / SKU">
              <input
                className={inputClass}
                value={form.code}
                disabled={!!product}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="FAR001"
              />
            </Field>
            <Field label="Nome do produto" className="lg:col-span-2">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Farinha de trigo"
              />
            </Field>
            <Field label="Categoria">
              <select className={inputClass} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                {activeCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unidade de medida">
              <select className={inputClass} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </Field>
            <Field label="Descrição" className="sm:col-span-2 lg:col-span-3">
              <textarea
                className={inputClass}
                rows={2}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
            Controle de estoque
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field
              label="Estoque inicial"
              hint={product ? 'Somente movimentações alteram o saldo.' : 'Gera movimentação "Estoque inicial".'}
            >
              <input
                type="number"
                min={0}
                step="any"
                className={inputClass}
                value={form.initialStock}
                disabled={!!product}
                onChange={(e) => set('initialStock', e.target.value)}
              />
            </Field>
            <Field label="Estoque mínimo">
              <input
                type="number"
                min={0}
                step="any"
                className={inputClass}
                value={form.minimumStock}
                onChange={(e) => set('minimumStock', e.target.value)}
              />
            </Field>
            <Field label="Estoque máximo (opcional)">
              <input
                type="number"
                min={0}
                step="any"
                className={inputClass}
                value={form.maximumStock}
                onChange={(e) => set('maximumStock', e.target.value)}
              />
            </Field>
            <Field label="Custo unitário (R$)">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={form.unitCost}
                onChange={(e) => set('unitCost', e.target.value)}
              />
            </Field>
            <Field label="Localização (opcional)" className="sm:col-span-2">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Prateleira A2 / Câmara Fria 01"
              />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Fornecedor</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Fornecedor principal">
              <input
                className={inputClass}
                value={form.supplier}
                onChange={(e) => set('supplier', e.target.value)}
                list="stock-suppliers"
              />
            </Field>
            <Field label="Código no fornecedor (opcional)">
              <input
                className={inputClass}
                value={form.supplierProductCode}
                onChange={(e) => set('supplierProductCode', e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button onClick={handleSave} className={btnPrimary}>
            Salvar produto
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================== Entrada =========================== */
export const EntryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}> = ({ isOpen, onClose, productId }) => {
  const { products, registerEntry } = useStock();
  const active = products.filter((p) => p.status === 'Ativo');
  const [form, setForm] = useState({
    productId: productId || active[0]?.id || '',
    date: today(),
    quantity: 0,
    unitCost: 0,
    reason: 'Compra' as EntryReason,
    supplier: '',
    invoiceNumber: '',
    notes: '',
    postToFinance: true,
    paymentType: 'A_VISTA' as 'A_VISTA' | 'A_PRAZO',
    dueDate: today(),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const pid = productId || active[0]?.id || '';
    const p = products.find((x) => x.id === pid);
    setForm((f) => ({
      ...f,
      productId: pid,
      date: today(),
      quantity: 0,
      unitCost: p?.unitCost || 0,
      supplier: p?.supplier || '',
      invoiceNumber: '',
      notes: '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId]);

  const product = products.find((p) => p.id === form.productId);
  const total = (Number(form.quantity) || 0) * (Number(form.unitCost) || 0);

  const submit = () => {
    const res = registerEntry({
      productId: form.productId,
      date: form.date,
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
      reason: form.reason,
      supplier: form.supplier,
      invoiceNumber: form.invoiceNumber,
      notes: form.notes,
      postToFinance: form.postToFinance && form.reason === 'Compra',
      paymentType: form.paymentType,
      dueDate: form.dueDate,
    });
    if (!res.ok) return setError(res.message || 'Erro ao registrar entrada.');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova entrada de estoque" subtitle="Compra, devolução ou retorno de produção">
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Data">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Produto">
            <select
              className={inputClass}
              value={form.productId}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setForm({ ...form, productId: e.target.value, unitCost: p?.unitCost || 0, supplier: p?.supplier || '' });
              }}
            >
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Quantidade${product ? ` (${product.unit})` : ''}`}>
            <input type="number" min={0} step="any" className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </Field>
          <Field label="Custo unitário (R$)">
            <input type="number" min={0} step="0.01" className={inputClass} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} />
          </Field>
          <Field label="Motivo">
            <select className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as EntryReason })}>
              {ENTRY_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fornecedor">
            <input className={inputClass} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </Field>
          <Field label="Nota fiscal (opcional)">
            <input className={inputClass} value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
          </Field>
          <Field label="Observação">
            <input className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Total da entrada</span>
            <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>
          {product && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Saldo atual: {formatNumber(product.currentStock)} {product.unit}</span>
              <span>
                Novo saldo: {formatNumber(product.currentStock + (Number(form.quantity) || 0))} {product.unit}
              </span>
            </div>
          )}
          {form.reason === 'Compra' && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.postToFinance}
                  onChange={(e) => setForm({ ...form, postToFinance: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
                Lançar esta compra no financeiro (Despesa • Compra de estoque)
              </label>
              {form.postToFinance && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Forma de pagamento">
                    <select
                      className={inputClass}
                      value={form.paymentType}
                      onChange={(e) => setForm({ ...form, paymentType: e.target.value as any })}
                    >
                      <option value="A_VISTA">À vista</option>
                      <option value="A_PRAZO">A prazo (contas a pagar)</option>
                    </select>
                  </Field>
                  {form.paymentType === 'A_PRAZO' && (
                    <Field label="Vencimento">
                      <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                    </Field>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button onClick={submit} className={btnGreen}>
            <PlusCircle className="w-4 h-4" /> Confirmar entrada
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================== Saída =========================== */
export const ExitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}> = ({ isOpen, onClose, productId }) => {
  const { products, registerExit } = useStock();
  const { sales } = useFinance();
  const active = products.filter((p) => p.status === 'Ativo');
  const [form, setForm] = useState({
    productId: productId || active[0]?.id || '',
    date: today(),
    quantity: 0,
    reason: 'Consumo' as ExitReason,
    notes: '',
    linkedSaleId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm((f) => ({
      ...f,
      productId: productId || active[0]?.id || '',
      date: today(),
      quantity: 0,
      notes: '',
      linkedSaleId: '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId]);

  const product = products.find((p) => p.id === form.productId);
  const relatedSales = sales
    .filter((s) => !product?.linkedProductCode || s.productCode === product.linkedProductCode)
    .slice(0, 30);

  const submit = () => {
    const res = registerExit({
      productId: form.productId,
      date: form.date,
      quantity: Number(form.quantity),
      reason: form.reason,
      notes: form.notes,
      linkedSaleId: form.reason === 'Venda' ? form.linkedSaleId || undefined : undefined,
    });
    if (!res.ok) return setError(res.message || 'Erro ao registrar saída.');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova saída de estoque" subtitle="Venda, consumo, produção, perda ou uso interno">
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Data">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Produto">
            <select className={inputClass} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} ({formatNumber(p.currentStock)} {p.unit})
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Quantidade${product ? ` (${product.unit})` : ''}`} hint={product ? `Disponível: ${formatNumber(product.currentStock)}` : undefined}>
            <input type="number" min={0} step="any" className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </Field>
          <Field label="Motivo">
            <select className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as ExitReason })}>
              {EXIT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          {form.reason === 'Venda' && (
            <Field
              label="Vincular à venda registrada (opcional)"
              className="sm:col-span-2"
              hint="A receita já é registrada pelo módulo de vendas — a saída apenas dá baixa no estoque."
            >
              <select className={inputClass} value={form.linkedSaleId} onChange={(e) => setForm({ ...form, linkedSaleId: e.target.value })}>
                <option value="">Sem vínculo</option>
                {relatedSales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} • {s.productName} • {s.quantityUnits} un • {formatCurrency(s.totalRevenue)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Observação" className="sm:col-span-2">
            <input className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>

        {product && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
            <span>
              Saldo atual: {formatNumber(product.currentStock)} {product.unit}
            </span>
            <span>
              Novo saldo: {formatNumber(Math.max(0, product.currentStock - (Number(form.quantity) || 0)))} {product.unit}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button onClick={submit} className={btnRose}>
            <MinusCircle className="w-4 h-4" /> Confirmar saída
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================== Ajuste =========================== */
export const AdjustModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}> = ({ isOpen, onClose, productId }) => {
  const { products, registerAdjustment, permissions } = useStock();
  const active = products.filter((p) => p.status === 'Ativo');
  const [form, setForm] = useState({
    productId: productId || active[0]?.id || '',
    date: today(),
    newQuantity: 0,
    reason: 'Ajuste de inventário' as any,
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const pid = productId || active[0]?.id || '';
    const p = products.find((x) => x.id === pid);
    setForm((f) => ({ ...f, productId: pid, date: today(), newQuantity: p?.currentStock || 0, notes: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId]);

  const product = products.find((p) => p.id === form.productId);
  const diff = (Number(form.newQuantity) || 0) - (product?.currentStock || 0);

  if (!permissions.adjustStock) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Ajuste de estoque">
        <Alert tone="error">Você não possui permissão para realizar ajustes de estoque.</Alert>
      </Modal>
    );
  }

  const submit = () => {
    const res = registerAdjustment({
      productId: form.productId,
      date: form.date,
      newQuantity: Number(form.newQuantity),
      reason: form.reason,
      notes: form.notes,
    });
    if (!res.ok) return setError(res.message || 'Erro ao ajustar estoque.');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajuste de estoque" subtitle="Todo ajuste gera uma movimentação no histórico">
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Data">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Produto">
            <select
              className={inputClass}
              value={form.productId}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setForm({ ...form, productId: e.target.value, newQuantity: p?.currentStock || 0 });
              }}
            >
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nova quantidade (estoque físico)">
            <input type="number" min={0} step="any" className={inputClass} value={form.newQuantity} onChange={(e) => setForm({ ...form, newQuantity: Number(e.target.value) })} />
          </Field>
          <Field label="Motivo">
            <select className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              <option value="Ajuste de inventário">Ajuste de inventário</option>
              <option value="Ajuste balanço">Ajuste balanço</option>
              <option value="Perda">Perda</option>
              <option value="Avaria">Avaria</option>
              <option value="Outros">Outros</option>
            </select>
          </Field>
          <Field label="Observação (obrigatória)" className="sm:col-span-2">
            <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        {product && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
            <span>
              Saldo no sistema: {formatNumber(product.currentStock)} {product.unit}
            </span>
            <span className={diff === 0 ? '' : diff > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
              Diferença: {diff > 0 ? '+' : ''}
              {formatNumber(diff)} {product.unit}
            </span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button onClick={submit} className={btnPrimary}>
            Registrar ajuste
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================== Detalhes do produto =========================== */
export const ProductDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: StockProduct | null;
  onEdit: (p: StockProduct) => void;
  onEntry: (p: StockProduct) => void;
  onExit: (p: StockProduct) => void;
  onSeeMovements: (p: StockProduct) => void;
}> = ({ isOpen, onClose, product, onEdit, onEntry, onExit, onSeeMovements }) => {
  const { productMovements } = useStock();
  if (!product) return null;
  const history = productMovements(product.id).slice(0, 10);

  return (
    <Modal isOpen={isOpen} onClose={onClose} wide title={product.name} subtitle={`Código ${product.code}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            ['Categoria', product.categoryName],
            ['Unidade', product.unit],
            ['Fornecedor', product.supplier || '—'],
            ['Localização', product.location || '—'],
            ['Status', product.status],
            ['Cód. fornecedor', product.supplierProductCode || '—'],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[11px] uppercase font-semibold text-slate-500">{k}</p>
              <p className="text-slate-900 font-medium">{v as string}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[11px] uppercase font-semibold text-slate-500">Estoque atual</p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(product.currentStock)} {product.unit}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[11px] uppercase font-semibold text-slate-500">Estoque mínimo</p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(product.minimumStock)} {product.unit}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[11px] uppercase font-semibold text-slate-500">Custo unitário</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(product.unitCost)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[11px] uppercase font-semibold text-slate-500">Valor em estoque</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(product.currentStock * product.unitCost)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SituationBadge situation={getSituation(product)} />
          <span className="flex-1" />
          <button onClick={() => onEntry(product)} className={btnGreen}>
            <PlusCircle className="w-4 h-4" /> Entrada
          </button>
          <button onClick={() => onExit(product)} className={btnRose}>
            <MinusCircle className="w-4 h-4" /> Saída
          </button>
          <button onClick={() => onSeeMovements(product)} className={btnGhost}>
            <History className="w-4 h-4" /> Ver movimentações
          </button>
          <button onClick={() => onEdit(product)} className={btnGhost}>
            <Pencil className="w-4 h-4" /> Editar produto
          </button>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
            Últimas movimentações
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Motivo</th>
                    <th className="py-2 pr-3">Quantidade</th>
                    <th className="py-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3">{m.date.split('-').reverse().join('/')}</td>
                      <td className="py-2 pr-3">
                        {m.type === 'ENTRADA' ? '🟢 Entrada' : m.type === 'SAIDA' ? '🔴 Saída' : '🔵 Ajuste'}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">{m.reason}</td>
                      <td className="py-2 pr-3">
                        {m.type === 'SAIDA' ? '−' : '+'}
                        {formatNumber(m.quantity)} {product.unit}
                      </td>
                      <td className="py-2 font-medium">{formatNumber(m.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

/* =========================== Categorias =========================== */
export const CategoriesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, toggleCategoryStatus, products } = useStock();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Categorias de estoque" subtitle="Crie, edite e inative categorias">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input className={inputClass} placeholder="Nova categoria" value={name} onChange={(e) => setName(e.target.value)} />
          <button
            className={btnPrimary}
            onClick={() => {
              if (name.trim()) {
                addCategory(name);
                setName('');
              }
            }}
          >
            <Layers className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              {editingId === c.id ? (
                <>
                  <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <button
                    className={btnPrimary}
                    onClick={() => {
                      updateCategory(c.id, { name: editName.trim() || c.name });
                      setEditingId(null);
                    }}
                  >
                    Salvar
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-slate-800">{c.name}</span>
                  <span className="text-xs text-slate-400">
                    {products.filter((p) => p.categoryId === c.id).length} produtos
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      c.status === 'Ativo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {c.status}
                  </span>
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    onClick={() => toggleCategoryStatus(c.id)}
                    title="Ativar / Inativar"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
