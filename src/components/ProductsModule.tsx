import React, { useState } from 'react';
import { Edit3, PackagePlus, PlusCircle, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAccess } from '../context/AccessContext';
import { Product } from '../types/finance';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { calculatePriceFromTargetMargin } from '../utils/pricing';

type ProductForm = {
  name: string; family: string; category: string; weightGrams: number;
  baseCost: number; packagingCost: number; directLaborCost: number; otherVariableCost: number;
  taxRateB2C: number; taxRateB2B: number; targetMarginB2C: number; targetMarginB2B: number;
};

const emptyForm: ProductForm = {
  name: '', family: '', category: '', weightGrams: 0,
  baseCost: 0, packagingCost: 0, directLaborCost: 0, otherVariableCost: 0,
  taxRateB2C: 7.5, taxRateB2B: 5.5, targetMarginB2C: 0, targetMarginB2B: 0,
};

const labels: Record<keyof ProductForm, string> = {
  name: 'Nome do produto', family: 'Família', category: 'Categoria', weightGrams: 'Peso (g)',
  baseCost: 'Insumos', packagingCost: 'Embalagem', directLaborCost: 'Mão de obra direta', otherVariableCost: 'Outros custos variáveis',
  taxRateB2C: 'Impostos B2C (%)', taxRateB2B: 'Impostos B2B (%)', targetMarginB2C: 'Margem desejada B2C (%)', targetMarginB2B: 'Margem desejada B2B (%)',
};

export const ProductsModule: React.FC<{ onEditProduct: (product: Product) => void }> = ({ onEditProduct }) => {
  const { can } = useAccess();
  const { products, sales, nolaMovements, commercialGoals, addProduct, deleteProduct } = useFinance();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deletionFeedback, setDeletionFeedback] = useState<string | null>(null);
  const directCost = form.baseCost + form.packagingCost + form.directLaborCost + form.otherVariableCost;
  const calculatedB2C = calculatePriceFromTargetMargin(directCost, form.targetMarginB2C, form.taxRateB2C);
  const calculatedB2B = calculatePriceFromTargetMargin(directCost, form.targetMarginB2B, form.taxRateB2B);
  const validParameters = calculatedB2C !== null && calculatedB2B !== null;
  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validParameters) return;
    addProduct({ ...form, defaultSector: 'Produção', unitsPerBatch: 1, active: true, priceB2C: calculatedB2C!, priceB2B: calculatedB2B!, description: '' });
    setForm(emptyForm);
    setIsCreateOpen(false);
  };

  const requestDeletion = (product: Product) => {
    if (!window.confirm(`Excluir "${product.name}"? Esta ação também remove a ficha técnica vinculada, se houver.`)) return;
    const result = deleteProduct(product.code);
    setDeletionFeedback(result.ok ? `Produto "${product.name}" excluído com sucesso.` : result.message ?? 'Não foi possível excluir o produto.');
  };

  return <div className="space-y-6">
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#087B9F]"><PackagePlus className="h-4 w-4" /> Cadastro e parâmetros</div>
        <h1 className="text-xl font-bold text-[#111111]">Produtos</h1>
        <p className="mt-1 text-sm text-neutral-500">Cadastre produtos e defina a margem desejada para calcular os preços por canal.</p>
      </div>{can('products.edit') && <button onClick={() => setIsCreateOpen(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#75B82A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#669E22]"><PlusCircle className="h-4 w-4" /> Novo produto</button>}</div>
    </section>

    {deletionFeedback && <p role="status" className="rounded-xl border border-[#BEEBF5] bg-[#EAF9FD] px-4 py-3 text-sm font-medium text-[#043342]">{deletionFeedback}</p>}
    <section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs"><table className="min-w-[1020px] w-full text-xs">
      <thead className="bg-neutral-50 text-left text-neutral-600"><tr><th className="p-3">Produto</th><th className="p-3 text-right">Custo direto</th><th className="p-3 text-right">Preço B2C calculado</th><th className="p-3 text-right">Preço B2B calculado</th><th className="p-3 text-right">Margem desejada</th><th className="p-3 text-right">Status</th><th className="p-3 text-right">Ações</th></tr></thead>
      <tbody className="divide-y divide-neutral-100">{products.map((product) => {
        const cost = product.baseCost + product.packagingCost + product.directLaborCost + product.otherVariableCost;
        const hasSales = sales.some((sale) => sale.productCode === product.code);
        const hasLosses = nolaMovements.some((movement) => movement.productCode === product.code);
        const hasGoals = commercialGoals.some((goal) => goal.productCode === product.code);
        const canDelete = !hasSales && !hasLosses && !hasGoals;
        const deletionReason = hasSales ? 'Produtos com vendas registradas não podem ser excluídos.' : hasLosses ? 'Produtos com perdas registradas não podem ser excluídos.' : hasGoals ? 'Produtos com metas vinculadas não podem ser excluídos.' : 'Excluir produto';
        return <tr key={product.code}><td className="p-3 font-semibold">{product.name}<span className="ml-2 font-mono text-neutral-400">{product.code}</span><span className="block text-[10px] font-normal text-neutral-500">{product.category || product.family}</span></td><td className="p-3 text-right">{formatCurrency(cost)}</td><td className="p-3 text-right font-semibold">{formatCurrency(product.priceB2C)}</td><td className="p-3 text-right font-semibold">{formatCurrency(product.priceB2B)}</td><td className="p-3 text-right">B2C {formatPercent(product.targetMarginB2C ?? 0)} · B2B {formatPercent(product.targetMarginB2B ?? 0)}</td><td className="p-3 text-right"><span className={product.active ? (hasSales ? 'text-[#426D12]' : 'text-neutral-500') : 'text-[#C92F0A]'}>{product.active ? (hasSales ? 'Ativo · com vendas' : 'Ativo · sem vendas') : 'Inativo'}</span></td><td className="p-3 text-right">{can('products.edit') && <span className="inline-flex gap-2"><button onClick={() => onEditProduct(product)} aria-label={`Editar ${product.name}`} className="rounded-lg border border-neutral-200 p-2 text-[#D99000] hover:bg-[#FFF7DD]"><Edit3 className="h-4 w-4" /></button><button onClick={() => requestDeletion(product)} disabled={!canDelete} title={deletionReason} aria-label={`Excluir ${product.name}`} className="rounded-lg border border-neutral-200 p-2 text-[#C92F0A] hover:bg-[#FFF0EA] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="h-4 w-4" /></button></span>}</td></tr>;
      })}</tbody>
    </table></section>

    {isCreateOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={submit} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#A7E5F2] bg-[#EAF9FD] px-6 py-4"><div><h2 className="text-lg font-bold">Cadastrar produto</h2><p className="mt-1 text-xs text-neutral-500">A margem desejada é um parâmetro de decisão; não altera a margem de contribuição realizada.</p></div><button type="button" onClick={() => setIsCreateOpen(false)} aria-label="Fechar janela" className="rounded-lg p-1 text-[#087B9F] hover:bg-white"><X className="h-5 w-5" /></button></div>
      <div className="min-h-0 overflow-y-auto px-6 py-5"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(['name', 'family', 'category'] as const).map((key) => <label key={key} className="text-xs font-semibold text-neutral-700">{labels[key]}<input required value={form[key]} onChange={(e) => update(key, e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 p-2" /></label>)}
        {(['weightGrams', 'baseCost', 'packagingCost', 'directLaborCost', 'otherVariableCost', 'taxRateB2C', 'taxRateB2B', 'targetMarginB2C', 'targetMarginB2B'] as const).map((key) => <label key={key} className="text-xs font-semibold text-neutral-700">{labels[key]}<input required type="number" min="0" max={key.includes('Margin') ? '90' : undefined} step="0.01" value={form[key]} onChange={(e) => update(key, Number(e.target.value))} className="mt-1 w-full rounded-xl border border-neutral-300 p-2" /></label>)}
      </div>
      <div className="mt-4 rounded-xl border border-[#BEEBF5] bg-[#EAF9FD] p-3 text-xs text-[#043342]"><p>Custo direto inicial: <strong>{formatCurrency(directCost)}</strong></p><p className="mt-1">Preço calculado B2C: <strong>{calculatedB2C !== null ? formatCurrency(calculatedB2C) : 'Revise margem e impostos'}</strong></p><p>Preço calculado B2B: <strong>{calculatedB2B !== null ? formatCurrency(calculatedB2B) : 'Revise margem e impostos'}</strong></p><p className="mt-2 text-[10px] text-[#087B9F]">Os preços são calculados automaticamente com base no custo, impostos e margem desejada.</p></div>
      {!validParameters && <p className="mt-3 text-xs font-medium text-[#C92F0A]">A margem desejada somada aos impostos deve ser menor que 100%.</p>}
      </div><div className="flex shrink-0 justify-end gap-2 border-t border-[#A7E5F2] bg-[#F9FEFF] px-6 py-4"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-xl bg-neutral-100 px-4 py-2 text-sm">Cancelar</button><button disabled={!validParameters} className="rounded-xl bg-[#D99000] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Cadastrar</button></div>
    </form></div>}
  </div>;
};
