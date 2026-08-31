import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Calculator,
  ChefHat,
  Download,
  FileText,
  PackagePlus,
  Boxes,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  RotateCcw,
  ShoppingCart,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Permission, useAccess } from '../context/AccessContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

export type TabType =
  | 'cockpit'
  | 'pricing'
  | 'products'
  | 'inventory'
  | 'users'
  | 'analysis'
  | 'reports'
  | 'dre'
  | 'breakeven'
  | 'fixed-costs'
  | 'sales'
  | 'nola'
  | 'simulator'
  | 'guide';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSaleModal: () => void;
  onOpenNolaModal: () => void;
  onOpenCostModal: () => void;
  onOpenBackupModal: () => void;
}

const navItems: { id: TabType; label: string; icon: React.ElementType; permission?: Permission }[] = [
  { id: 'cockpit', label: 'Visão geral', icon: LayoutDashboard, permission:'cockpit.view' },
  { id: 'pricing', label: 'Custos e precificação', icon: Calculator, permission:'costs.view' },
  { id: 'products', label: 'Produtos', icon: PackagePlus, permission:'products.view' },
  { id: 'inventory', label: 'Estoque', icon: Boxes, permission:'inventory.view' },
  { id: 'users', label: 'Usuários e permissões', icon: Building2, permission:'users.manage' },
  { id: 'analysis', label: 'Análise gerencial', icon: TrendingUp, permission:'cockpit.view' },
  { id: 'reports', label: 'Relatórios gerenciais', icon: FileText, permission:'cockpit.view' },
  { id: 'dre', label: 'DRE gerencial', icon: FileText, permission:'dre.view' },
  { id: 'breakeven', label: 'Ponto de equilíbrio', icon: TrendingUp, permission:'cvl.view' },
  { id: 'fixed-costs', label: 'Custos fixos e metas', icon: Building2, permission:'fixedCosts.view' },
  { id: 'sales', label: 'Vendas e canais', icon: ShoppingCart, permission:'sales.view' },
  { id: 'nola', label: 'Perdas', icon: AlertTriangle, permission:'losses.view' },
  { id: 'simulator', label: 'Simulador “E se?”', icon: SlidersHorizontal, permission:'simulator.use' },
  { id: 'guide', label: 'Guia e glossário', icon: BookOpen },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSaleModal,
  onOpenNolaModal,
  onOpenBackupModal,
}) => {
  const { user, logout, can } = useAccess();
  const { currentDRE, pecReais, weightedMCPercent, totalNolaLossReais, resetToDefaults } = useFinance();

  const reset = () => {
    if (window.confirm('Deseja restaurar os dados originais do sistema?')) resetToDefaults();
  };

  return (
    <>
      <aside className="app-sidebar fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-[#18352A] bg-[#10211B] text-white lg:flex">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/15 text-[#FFC52B]">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold leading-tight">Guardiões da Lasanha</h1>
            </div>
          </div>
          <span className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Custos e rentabilidade
          </span>
          <div className="mt-3 rounded-lg border border-white/15 bg-white/5 p-3 text-xs"><p className="text-white/55">Usuário conectado</p><p className="mt-1 font-bold text-white">{user?.name}</p><p className="truncate text-[10px] text-white/55">{user?.email}</p><button onClick={logout} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FFC52B] hover:text-white"><LogOut className="h-3.5 w-3.5" /> Sair</button></div>
        </div>

        <div className="border-b border-white/10 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Resumo do período</p>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Faturamento" value={formatCurrency(currentDRE.grossRevenue)} color="text-[#9AD83B]" />
            <Metric label="MC média" value={formatPercent(weightedMCPercent)} color="text-[#FFC52B]" />
            <Metric label="PEC" value={formatCurrency(pecReais)} color="text-[#25B9DE]" />
            <Metric label="Perdas" value={formatCurrency(totalNolaLossReais)} color="text-[#F66A3A]" />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegação principal">
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Módulos</p>
          {navItems.filter(({permission})=>!permission||can(permission)).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border border-[#B6EB66] bg-[#9DDD25] text-[#10211B]'
                  : 'border border-transparent text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onOpenSaleModal} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#75B82A] px-2 py-2 text-xs font-bold text-white hover:bg-[#669E22]">
              <PlusCircle className="h-4 w-4" /> Venda
            </button>
            <button onClick={onOpenNolaModal} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#F0440C] px-2 py-2 text-xs font-bold text-white hover:bg-[#C92F0A]">
              <AlertTriangle className="h-4 w-4" /> Perda
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onOpenBackupModal} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/20 px-2 py-2 text-xs text-white/80 hover:bg-white/10">
              <Download className="h-4 w-4" /> Dados
            </button>
            <button onClick={reset} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/20 px-2 py-2 text-xs text-white/80 hover:bg-white/10">
              <RotateCcw className="h-4 w-4" /> Restaurar
            </button>
          </div>
        </div>
      </aside>

      <header className="app-mobile-header sticky top-0 z-50 border-b border-[#18352A] bg-[#10211B] px-4 py-3 text-white lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-[#FFC52B]" />
            <div>
              <p className="text-sm font-bold leading-tight">Guardiões da Lasanha</p>
              <p className="text-[10px] text-neutral-400">Custos e rentabilidade</p>
            </div>
          </div>
          <button onClick={onOpenSaleModal} className="inline-flex items-center gap-1 rounded-lg bg-[#75B82A] px-3 py-2 text-xs font-bold">
            <PlusCircle className="h-4 w-4" /> Venda
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.filter(({ permission }) => !permission || can(permission)).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${activeTab === id ? 'bg-[#9DDD25] text-[#10211B]' : 'bg-white/10 text-white/80'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <button onClick={logout} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC52B]"><LogOut className="h-3.5 w-3.5" /> Sair</button>
      </header>
    </>
  );
};

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
      <p className="truncate text-[9px] uppercase tracking-wide text-white/55">{label}</p>
      <p className={`mt-1 truncate text-xs font-bold ${color}`} title={value}>{value}</p>
    </div>
  );
}
