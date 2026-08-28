import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar, TabType } from './components/Navbar';
import { CockpitDashboard } from './components/CockpitDashboard';
import { CostPricingModule } from './components/CostPricingModule';
import { BreakEvenCVLModule } from './components/BreakEvenCVLModule';
import { FixedExpensesModule } from './components/FixedExpensesModule';
import { SalesManagerModule } from './components/SalesManagerModule';
import { NolaLossesQualityModule } from './components/NolaLossesQualityModule';
import { WhatIfSimulatorModule } from './components/WhatIfSimulatorModule';
import { EducationalGuideModal } from './components/EducationalGuideModal';
import {
  AddSaleModal,
  AddNolaModal,
  FixedCostModal,
  EditProductModal,
  BackupModal,
} from './components/QuickActionModals';
import { Product, FixedCost } from './types/finance';
import { ChefHat, ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('cockpit');

  // Modal States
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isNolaModalOpen, setIsNolaModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const [selectedProductToEdit, setSelectedProductToEdit] = useState<Product | null>(null);
  const [selectedCostToEdit, setSelectedCostToEdit] = useState<FixedCost | null>(null);

  const handleEditProduct = (prod: Product) => {
    setSelectedProductToEdit(prod);
    setIsEditProductModalOpen(true);
  };

  const handleEditCost = (cost: FixedCost) => {
    setSelectedCostToEdit(cost);
    setIsCostModalOpen(true);
  };

  const handleOpenAddCostModal = () => {
    setSelectedCostToEdit(null);
    setIsCostModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'guide') {
            setIsGuideModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenSaleModal={() => setIsSaleModalOpen(true)}
        onOpenNolaModal={() => setIsNolaModalOpen(true)}
        onOpenCostModal={handleOpenAddCostModal}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'cockpit' && (
          <CockpitDashboard
            onNavigate={(tab) => {
              if (tab === 'guide') {
                setIsGuideModalOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenSaleModal={() => setIsSaleModalOpen(true)}
            onOpenNolaModal={() => setIsNolaModalOpen(true)}
            onOpenCostModal={handleOpenAddCostModal}
          />
        )}

        {activeTab === 'pricing' && <CostPricingModule onEditProduct={handleEditProduct} />}

        {activeTab === 'breakeven' && <BreakEvenCVLModule />}

        {activeTab === 'fixed-costs' && (
          <FixedExpensesModule
            onOpenAddCostModal={handleOpenAddCostModal}
            onEditCost={handleEditCost}
          />
        )}

        {activeTab === 'sales' && (
          <SalesManagerModule onOpenAddSaleModal={() => setIsSaleModalOpen(true)} />
        )}

        {activeTab === 'nola' && (
          <NolaLossesQualityModule onOpenAddNolaModal={() => setIsNolaModalOpen(true)} />
        )}

        {activeTab === 'simulator' && <WhatIfSimulatorModule />}
      </main>

      {/* Modals */}
      <AddSaleModal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} />
      <AddNolaModal isOpen={isNolaModalOpen} onClose={() => setIsNolaModalOpen(false)} />
      <FixedCostModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        costToEdit={selectedCostToEdit}
      />
      <EditProductModal
        isOpen={isEditProductModalOpen}
        onClose={() => setIsEditProductModalOpen(false)}
        product={selectedProductToEdit}
      />
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
      <EducationalGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Modern Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-300">
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">Guardiões da Lasanha</span>
            <span>— Sistema Financeiro & Gestão Industrial</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>180 Apontamentos NOLA Transcritos</span>
            <span>•</span>
            <span>Análise CVL Integrada</span>
            <span>•</span>
            <span>Custeio por Absorção & Margens B2C/B2B</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
