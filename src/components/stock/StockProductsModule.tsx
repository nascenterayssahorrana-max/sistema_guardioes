import React, { useMemo, useState } from 'react';
import { Plus, Search, Eye, Pencil, ArrowUpDown, History, Power, Layers } from 'lucide-react';
import { useStock, getSituation } from '../../context/StockContext';
import { StockProduct, StockSituation } from '../../types/stock';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Panel, SituationBadge, btnPrimary, btnGhost, inputClass, Alert } from './StockUI';
import { ProductFormModal, ProductDetailModal, EntryModal, ExitModal, AdjustModal, CategoriesModal } from './StockModals';

interface Props {
  initialSituationFilter?: StockSituation | 'TODOS';
  onSeeMovements: (productId: string) => void;
}

export const StockProductsModule: React.FC<Props> = ({ initialSituationFilter = 'TODOS', onSeeMovements }) => {
  const { products, categories, removeProduct } = useStock();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('TODOS');
  const [status, setStatus] = useState('TODOS');
  const [situation, setSituation] = useState<StockSituation | 'TODOS'>(initialSituationFilter);
  const [notice, setNotice] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockProduct | null>(null);
  const [detail, setDetail] = useState<StockProduct | null>(null);
  const [entryFor, setEntryFor] = useState<string | undefined>();
  const [exitFor, setExitFor] = useState<string | undefined>();
  const [adjustFor, setAdjustFor] = useState<string | undefined>();
  const [catsOpen, setCatsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
      if (categoryId !== 'TODOS' && p.categoryId !== categoryId) return false;
      if (status !== 'TODOS' && p.status !== status) return false;
      if (situation !== 'TODOS' && getSituation(p) !== situation) return false;
      return true;
    });
  }, [products, search, categoryId, status, situation]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Produtos</h2>
          <p className="text-sm text-slate-500">Cadastro, saldo e situação de cada item do estoque.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={btnGhost} onClick={() => setCatsOpen(true)}>
            <Layers className="w-4 h-4" /> Categorias
          </button>
          <button
            className={btnPrimary}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {notice && <Alert tone="info">{notice}</Alert>}

      <Panel title="Filtros" subtitle={`${filtered.length} produto(s) encontrado(s)`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Buscar por nome ou código"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="TODOS">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="TODOS">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
          <select className={inputClass} value={situation} onChange={(e) => setSituation(e.target.value as any)}>
            <option value="TODOS">Todas as situações</option>
            <option value="NORMAL">Normal</option>
            <option value="BAIXO">Estoque baixo</option>
            <option value="ZERADO">Sem estoque</option>
          </select>
        </div>
      </Panel>

      <Panel title="Lista de produtos">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Código</th>
                <th className="py-2 pr-3">Produto</th>
                <th className="py-2 pr-3">Categoria</th>
                <th className="py-2 pr-3">Un.</th>
                <th className="py-2 pr-3 text-right">Estoque</th>
                <th className="py-2 pr-3 text-right">Mínimo</th>
                <th className="py-2 pr-3 text-right">Custo</th>
                <th className="py-2 pr-3 text-right">Valor em estoque</th>
                <th className="py-2 pr-3">Situação</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                  <td className="py-2 pr-3 font-mono text-xs text-slate-500">{p.code}</td>
                  <td className="py-2 pr-3 font-medium text-slate-800">
                    <button className="hover:text-amber-600 cursor-pointer text-left" onClick={() => setDetail(p)}>
                      {p.name}
                    </button>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{p.categoryName}</td>
                  <td className="py-2 pr-3 text-slate-600">{p.unit}</td>
                  <td className="py-2 pr-3 text-right font-semibold">{formatNumber(p.currentStock)}</td>
                  <td className="py-2 pr-3 text-right text-slate-500">{formatNumber(p.minimumStock)}</td>
                  <td className="py-2 pr-3 text-right">{formatCurrency(p.unitCost)}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-emerald-600">
                    {formatCurrency(p.currentStock * p.unitCost)}
                  </td>
                  <td className="py-2 pr-3">
                    <SituationBadge situation={getSituation(p)} />
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        p.status === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="Visualizar" onClick={() => setDetail(p)} icon={Eye} />
                      <IconBtn
                        title="Editar"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                        icon={Pencil}
                      />
                      <IconBtn title="Movimentar estoque (ajuste)" onClick={() => setAdjustFor(p.id)} icon={ArrowUpDown} />
                      <IconBtn title="Ver histórico" onClick={() => onSeeMovements(p.id)} icon={History} />
                      <IconBtn
                        title="Inativar produto"
                        onClick={() => {
                          const res = removeProduct(p.id);
                          setNotice(res.message || 'Produto removido.');
                        }}
                        icon={Power}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-sm text-slate-500">
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <ProductFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} product={editing} />
      <ProductDetailModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        product={detail}
        onEdit={(p) => {
          setDetail(null);
          setEditing(p);
          setFormOpen(true);
        }}
        onEntry={(p) => {
          setDetail(null);
          setEntryFor(p.id);
        }}
        onExit={(p) => {
          setDetail(null);
          setExitFor(p.id);
        }}
        onSeeMovements={(p) => {
          setDetail(null);
          onSeeMovements(p.id);
        }}
      />
      <EntryModal isOpen={!!entryFor} onClose={() => setEntryFor(undefined)} productId={entryFor} />
      <ExitModal isOpen={!!exitFor} onClose={() => setExitFor(undefined)} productId={exitFor} />
      <AdjustModal isOpen={!!adjustFor} onClose={() => setAdjustFor(undefined)} productId={adjustFor} />
      <CategoriesModal isOpen={catsOpen} onClose={() => setCatsOpen(false)} />
    </div>
  );
};

const IconBtn: React.FC<{ title: string; onClick: () => void; icon: React.ElementType }> = ({
  title,
  onClick,
  icon: Icon,
}) => (
  <button
    title={title}
    onClick={onClick}
    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
  >
    <Icon className="w-4 h-4" />
  </button>
);
