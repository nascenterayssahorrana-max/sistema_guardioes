import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Trash2,
  Edit3,
  PieChart as PieIcon,
  HelpCircle,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { FixedCost, FixedCostCategory } from '../types/finance';
import { formatCurrency, formatPercent } from '../utils/formatters';

const CATEGORY_COLORS: Record<string, string> = {
  'Infraestrutura': '#64748b',
  'Pessoal Fixo': '#3b82f6',
  'Energia & Utilidades': '#f59e0b',
  'Manutenção': '#10b981',
  'Tecnologia & Sistemas': '#8b5cf6',
  'Administrativo & Vendas': '#ec4899',
  INFRAESTRUTURA: '#64748b',
  PESSOAL_FIXO: '#3b82f6',
  ENERGIA_UTILIDADES: '#f59e0b',
  MANUTENCAO: '#10b981',
  TECNOLOGIA_SISTEMAS: '#8b5cf6',
  ADMINISTRATIVO_VENDAS: '#ec4899',
};

interface FixedExpensesModuleProps {
  onOpenAddCostModal: () => void;
  onEditCost: (cost: FixedCost) => void;
}

export const FixedExpensesModule: React.FC<FixedExpensesModuleProps> = ({
  onOpenAddCostModal,
  onEditCost,
}) => {
  const {
    fixedCosts,
    totalFixedCosts,
    totalDisbursableFixedCosts,
    targetMonthlyProfit,
    setTargetMonthlyProfit,
    deleteFixedCost,
    pecReais,
    peeReais,
  } = useFinance();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filtered costs
  const filteredCosts = selectedCategory === 'ALL'
    ? fixedCosts
    : fixedCosts.filter((fc) => fc.category === selectedCategory);

  // Group by category for Chart
  const categorySummary: Record<string, number> = {};
  fixedCosts.forEach((fc) => {
    categorySummary[fc.category] = (categorySummary[fc.category] || 0) + fc.monthlyAmount;
  });

  const chartData = Object.entries(categorySummary).map(([cat, amount]) => ({
    name: cat.replace('_', ' '),
    categoryKey: cat as FixedCostCategory,
    value: amount,
    color: CATEGORY_COLORS[cat as FixedCostCategory] || '#94a3b8',
  }));

  const totalNonDisbursable = totalFixedCosts - totalDisbursableFixedCosts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Estrutura de Custos Fixos & Despesas Operacionais</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Custos Fixos da Fábrica & Gestão de Metas</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Custos que ocorrem independentemente do volume de lasanhas produzidas no mês. O total de custos fixos
              define a "barra" que a <strong>Margem de Contribuição</strong> precisa superar para gerar lucro.
            </p>
          </div>

          <button
            onClick={onOpenAddCostModal}
            id="btn-add-fixed-cost"
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Custo Fixo</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Fixed Costs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custo Fixo Total Mensal</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalFixedCosts)}</div>
          <span className="text-xs text-slate-500 mt-1 block">Impacto direto no PEC ({formatCurrency(pecReais)})</span>
        </div>

        {/* Disbursable vs Non-Disbursable */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desembolsável (Caixa)</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(totalDisbursableFixedCosts)}</div>
          <span className="text-xs text-slate-500 mt-1 block">
            Depreciação (Não-caixa): {formatCurrency(totalNonDisbursable)}
          </span>
        </div>

        {/* Monthly Target Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Meta de Lucro Mensal (Sócios)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(targetMonthlyProfit)}</div>
          <span className="text-xs text-slate-500 mt-1 block">Necessita PEE de {formatCurrency(peeReais)}</span>
        </div>
      </div>

      {/* Chart and Table Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Distribuição por Categoria</h2>
          <p className="text-xs text-slate-500 mb-4">Composição percentual dos custos fixos</p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fixed Expenses Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Detalhamento dos Lançamentos Fixos</h2>
              <p className="text-xs text-slate-500">{fixedCosts.length} itens cadastrados</p>
            </div>

            {/* Filter by Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="INFRAESTRUTURA">Infraestrutura</option>
              <option value="PESSOAL_FIXO">Pessoal Fixo</option>
              <option value="ENERGIA_UTILIDADES">Energia & Utilidades</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="TECNOLOGIA_SISTEMAS">Tecnologia & Sistemas</option>
              <option value="ADMINISTRATIVO_VENDAS">Administrativo & Vendas</option>
            </select>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-slate-600 font-semibold">
                  <th className="py-2 px-3 text-left">Item / Descrição</th>
                  <th className="py-2 px-3 text-left">Categoria</th>
                  <th className="py-2 px-3 text-center">Tipo</th>
                  <th className="py-2 px-3 text-right">Valor Mensal</th>
                  <th className="py-2 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCosts.map((cost) => (
                  <tr key={cost.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{cost.name}</div>
                      <div className="text-[11px] text-slate-500">{cost.description}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[cost.category]}15`,
                          color: CATEGORY_COLORS[cost.category],
                        }}
                      >
                        {cost.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {cost.isDisbursable ? (
                        <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Desembolsável
                        </span>
                      ) : (
                        <span className="text-slate-600 font-semibold text-[10px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Não-caixa (Deprec.)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(cost.monthlyAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onEditCost(cost)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteFixedCost(cost.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
