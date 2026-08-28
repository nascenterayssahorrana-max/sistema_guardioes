import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  Building2,
  ShoppingCart,
  AlertTriangle,
  SlidersHorizontal,
  BookOpen,
  PlusCircle,
  RotateCcw,
  Download,
  Upload,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

export type TabType =
  | 'cockpit'
  | 'pricing'
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

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSaleModal,
  onOpenNolaModal,
  onOpenCostModal,
  onOpenBackupModal,
}) => {
  const { currentDRE, pecReais, weightedMCPercent, totalNolaLossReais, resetToDefaults } = useFinance();

  const navItems = [
    { id: 'cockpit' as TabType, label: 'Visão Geral (Cockpit)', icon: LayoutDashboard },
    { id: 'pricing' as TabType, label: 'Custos & Precificação', icon: Calculator },
    { id: 'breakeven' as TabType, label: 'Ponto de Equilíbrio (CVL)', icon: TrendingUp },
    { id: 'fixed-costs' as TabType, label: 'Custos Fixos & Metas', icon: Building2 },
    { id: 'sales' as TabType, label: 'Vendas & Canais', icon: ShoppingCart },
    { id: 'nola' as TabType, label: 'Perdas NOLA (80/20)', icon: AlertTriangle },
    { id: 'simulator' as TabType, label: 'Simulador "E Se...?"', icon: SlidersHorizontal },
    { id: 'guide' as TabType, label: 'Guia & Glossário', icon: BookOpen },
  ];

  const handleReset = () => {
    if (window.confirm('Deseja restaurar todos os dados para os padrões originais do PDF da consultoria?')) {
      resetToDefaults();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      {/* Top Ticker & Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Guardiões da Lasanha</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  ERP & Gestão Industrial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fábrica Artesanal de Massas • Análise CVL, Precificação B2C/B2B & Controle de Perdas NOLA
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="text-slate-400">Fat. Registrado:</span>
              <span className="font-semibold text-emerald-400">{formatCurrency(currentDRE.grossRevenue)}</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="text-slate-400">P.E. Contábil:</span>
              <span className="font-semibold text-sky-400">{formatCurrency(pecReais)}</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="text-slate-400">MC Média:</span>
              <span className="font-semibold text-amber-400">{formatPercent(weightedMCPercent)}</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="text-slate-400">Perdas NOLA:</span>
              <span className="font-semibold text-rose-400">{formatCurrency(totalNolaLossReais)}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={onOpenSaleModal}
                id="btn-quick-sale"
                title="Lançar Nova Venda"
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs transition-colors shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Venda</span>
              </button>
              <button
                onClick={onOpenNolaModal}
                id="btn-quick-nola"
                title="Lançar Apontamento de Perda NOLA"
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-medium text-xs transition-colors shadow-sm cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Perda</span>
              </button>
              <button
                onClick={onOpenBackupModal}
                id="btn-backup"
                title="Backup e Dados JSON"
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleReset}
                id="btn-reset-data"
                title="Restaurar dados padrão do PDF"
                className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
