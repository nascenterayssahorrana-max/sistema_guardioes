import React, { useState } from 'react';
import {
  ShoppingCart,
  PlusCircle,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  TrendingUp,
  Percent,
  Calendar,
  Building,
  User,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { SaleRecord, SalesChannel, ProductCode } from '../types/finance';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

interface SalesManagerModuleProps {
  onOpenAddSaleModal: () => void;
}

export const SalesManagerModule: React.FC<SalesManagerModuleProps> = ({ onOpenAddSaleModal }) => {
  const { sales, deleteSale, productCalculations, currentDRE } = useFinance();

  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    const custName = s.customerName || s.clientName || '';
    const matchesChannel = channelFilter === 'ALL' || s.channel === channelFilter;
    const matchesProduct = productFilter === 'ALL' || s.productCode === productFilter;
    const matchesSearch =
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.productCode.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesChannel && matchesProduct && matchesSearch;
  });

  // Sales by product chart data
  const productSalesMap: Record<string, { b2cRev: number; b2bRev: number; units: number }> = {};
  sales.forEach((s) => {
    if (!productSalesMap[s.productName]) {
      productSalesMap[s.productName] = { b2cRev: 0, b2bRev: 0, units: 0 };
    }
    if (s.channel === 'B2C') {
      productSalesMap[s.productName].b2cRev += s.totalRevenue;
    } else {
      productSalesMap[s.productName].b2bRev += s.totalRevenue;
    }
    productSalesMap[s.productName].units += s.quantityUnits;
  });

  const chartData = Object.entries(productSalesMap).map(([name, data]) => ({
    name: name.replace('Lasanha ', 'Las. ').replace('Rondelli ', 'Rond. ').replace('Nhoque ', 'Nh. ').replace('Ravioli ', 'Rav. '),
    b2c: data.b2cRev,
    b2b: data.b2bRev,
    total: data.b2cRev + data.b2bRev,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span>Registro de Pedidos & Faturamento por Canal</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Vendas & Mix de Canais (B2C & B2B)</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Cada pedido registrado abate os custos variáveis reais (incluindo o rateio de perdas NOLA) e gera{' '}
              <strong>Margem de Contribuição Líquida</strong> para alimentar o demonstrativo de resultados.
            </p>
          </div>

          <button
            onClick={onOpenAddSaleModal}
            id="btn-add-sale-main"
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lançar Nova Venda</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receita Bruta Total</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(currentDRE.grossRevenue)}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">{sales.length} vendas registradas</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margem de Contribuição Total</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(currentDRE.contributionMargin)}</div>
          <span className="text-xs text-slate-500 mt-1 block">{formatPercent(currentDRE.contributionMarginPercent)} da receita</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Volume de Massas Vendidas</span>
          <div className="text-2xl font-black text-sky-600 mt-1">
            {formatNumber(sales.reduce((acc, s) => acc + s.quantityUnits, 0))} un.
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Média ponderada por pedido</span>
        </div>
      </div>

      {/* Chart: Sales by Product & Channel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">Faturamento por Produto e Canal</h2>
        <p className="text-xs text-slate-500 mb-4">Composição de receita entre varejo direto e atacado</p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="b2c" name="Varejo B2C (R$)" stackId="a" fill="#10b981" />
              <Bar dataKey="b2b" name="Atacado B2B (R$)" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Table & Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Histórico de Vendas</h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
              {filteredSales.length} registros
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 sm:w-60"
              />
            </div>

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Todos os Canais</option>
              <option value="B2C">Varejo (B2C)</option>
              <option value="B2B">Atacado (B2B)</option>
            </select>

            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Todos os Produtos</option>
              <option value="GL001">Lasanha Bolonhesa (GL001)</option>
              <option value="RI002">Rondelli 4 Queijos (RI002)</option>
              <option value="NS003">Nhoque Batata (NS003)</option>
              <option value="RC004">Ravioli Carne (RC004)</option>
              <option value="LT005">Lasanha Titã (LT005)</option>
              <option value="RG006">Ravioli Gorgonzola (RG006)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-slate-600 font-semibold">
                <th className="py-2.5 px-3 text-left">Data</th>
                <th className="py-2.5 px-3 text-left">Cliente</th>
                <th className="py-2.5 px-3 text-center">Canal</th>
                <th className="py-2.5 px-3 text-left">Produto</th>
                <th className="py-2.5 px-3 text-right">Qtd (un)</th>
                <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                <th className="py-2.5 px-3 text-right font-bold">Total Receita</th>
                <th className="py-2.5 px-3 text-right text-amber-900 bg-amber-50/50">Margem Contrib.</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{sale.date}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{sale.customerName || sale.clientName || 'Cliente Direto'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sale.channel === 'B2C'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sale.channel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800">{sale.productName}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1">({sale.productCode})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                    {formatNumber(sale.quantityUnits)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(sale.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(sale.totalRevenue)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-700 bg-amber-50/30">
                    <div>{formatCurrency(sale.contributionMarginTotal)}</div>
                    <div className="text-[10px] font-normal text-amber-800">
                      {formatPercent(sale.contributionMarginPercent)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => deleteSale(sale.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Excluir Venda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
