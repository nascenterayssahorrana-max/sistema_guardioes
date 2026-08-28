import React from 'react';
import {
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  ArrowRight,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useStock, getSituation } from '../../context/StockContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { StatCard, Panel, SituationBadge, btnPrimary, btnGreen, btnRose } from './StockUI';

const COLORS = ['#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', '#64748b'];

interface Props {
  onNavigateProducts: () => void;
  onOpenEntry: () => void;
  onOpenExit: () => void;
}

export const StockDashboard: React.FC<Props> = ({ onNavigateProducts, onOpenEntry, onOpenExit }) => {
  const { metrics, lowStockProducts, zeroStockProducts, valueByCategory, monthlyFlow } = useStock();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard de Estoque</h2>
          <p className="text-sm text-slate-500">
            Visão geral do estoque: saldo, valor e alertas de reposição.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onOpenEntry} className={btnGreen}>
            <PlusCircle className="w-4 h-4" /> Entrada
          </button>
          <button onClick={onOpenExit} className={btnRose}>
            <MinusCircle className="w-4 h-4" /> Saída
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de produtos"
          value={formatNumber(metrics.totalProductsCount)}
          hint={`${metrics.activeProductsCount} ativos`}
          icon={Package}
          tone="sky"
        />
        <StatCard
          label="Valor total em estoque"
          value={formatCurrency(metrics.totalStockValue)}
          hint="Saldo atual × custo unitário"
          icon={DollarSign}
          tone="emerald"
        />
        <StatCard
          label="Estoque baixo"
          value={formatNumber(metrics.lowStockCount)}
          hint="No mínimo ou abaixo"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Produtos zerados"
          value={formatNumber(metrics.zeroStockCount)}
          hint="Sem estoque disponível"
          icon={XCircle}
          tone="rose"
        />
      </div>

      {(lowStockProducts.length > 0 || zeroStockProducts.length > 0) && (
        <div className="space-y-2">
          {zeroStockProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2"
            >
              <XCircle className="w-4 h-4" /> {p.name} está sem estoque.
            </div>
          ))}
          {lowStockProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2"
            >
              <AlertTriangle className="w-4 h-4" /> {p.name} está abaixo do estoque mínimo.
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Entradas x Saídas" subtitle="Quantidade movimentada por mês">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatNumber(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Valor do estoque por categoria" subtitle="Onde está concentrado o capital">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={valueByCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {valueByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        title="⚠️ Produtos com estoque baixo"
        subtitle="Itens que precisam de reposição"
        actions={
          <button onClick={onNavigateProducts} className={btnPrimary}>
            Ver produtos com estoque baixo <ArrowRight className="w-4 h-4" />
          </button>
        }
      >
        {[...zeroStockProducts, ...lowStockProducts].length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum produto abaixo do mínimo. Estoque saudável.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Produto</th>
                  <th className="py-2 pr-3">Estoque atual</th>
                  <th className="py-2 pr-3">Estoque mínimo</th>
                  <th className="py-2">Situação</th>
                </tr>
              </thead>
              <tbody>
                {[...zeroStockProducts, ...lowStockProducts].map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-slate-100 ${
                      getSituation(p) === 'ZERADO' ? 'bg-rose-50/60' : 'bg-amber-50/50'
                    }`}
                  >
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {p.name} <span className="text-slate-400 text-xs">({p.code})</span>
                    </td>
                    <td className="py-2 pr-3">
                      {formatNumber(p.currentStock)} {p.unit}
                    </td>
                    <td className="py-2 pr-3">
                      {formatNumber(p.minimumStock)} {p.unit}
                    </td>
                    <td className="py-2">
                      <SituationBadge situation={getSituation(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
