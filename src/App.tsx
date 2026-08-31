import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AccessProvider, useAccess } from './context/AccessContext';
import { Navbar, TabType } from './components/Navbar';
import { CockpitDashboard } from './components/CockpitDashboard';
import { CostPricingModule } from './components/CostPricingModule';
import { BreakEvenCVLModule } from './components/BreakEvenCVLModule';
import { FixedExpensesModule } from './components/FixedExpensesModule';
import { SalesManagerModule } from './components/SalesManagerModule';
import { NolaLossesQualityModule } from './components/NolaLossesQualityModule';
import { WhatIfSimulatorModule } from './components/WhatIfSimulatorModule';
import { DREModule } from './components/DREModule';
import { ProductsModule } from './components/ProductsModule';
import { InventoryModule } from './components/InventoryModule';
import { UsersModule } from './components/UsersModule';
import { ManagementAnalysisModule } from './components/ManagementAnalysisModule';
import { ManagementReportsModule } from './components/ManagementReportsModule';
import { EducationalGuideModal } from './components/EducationalGuideModal';
import {
  AddSaleModal,
  AddNolaModal,
  FixedCostModal,
  EditProductModal,
  BackupModal,
} from './components/QuickActionModals';
import { Product, FixedCost } from './types/finance';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { can } = useAccess();
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
    <div className="app-shell min-h-screen bg-[#F6F8F6] text-[#10211B] flex flex-col font-sans selection:bg-[#9DDD25] selection:text-[#10211B] lg:pl-72">
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
      <main className="app-content flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'cockpit' && (can('cockpit.view') ? (
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
        ) : <AccessDenied />)}

        {activeTab === 'pricing' && (can('costs.view') ? <CostPricingModule onEditProduct={handleEditProduct} /> : <AccessDenied />)}
        {activeTab === 'products' && (can('products.view') ? <ProductsModule onEditProduct={handleEditProduct} /> : <AccessDenied />)}
        {activeTab === 'inventory' && (can('inventory.view') ? <InventoryModule /> : <AccessDenied />)}
        {activeTab === 'users' && (can('users.manage') ? <UsersModule /> : <AccessDenied />)}
        {activeTab === 'analysis' && (can('cockpit.view') ? <ManagementAnalysisModule /> : <AccessDenied />)}
        {activeTab === 'reports' && (can('cockpit.view') ? <ManagementReportsModule /> : <AccessDenied />)}

        {activeTab === 'dre' && (can('dre.view') ? <DREModule /> : <AccessDenied />)}

        {activeTab === 'breakeven' && (can('cvl.view') ? <BreakEvenCVLModule /> : <AccessDenied />)}

        {activeTab === 'fixed-costs' && (can('fixedCosts.view') ? (
          <FixedExpensesModule
            onOpenAddCostModal={handleOpenAddCostModal}
            onEditCost={handleEditCost}
          />
        ) : <AccessDenied />)}

        {activeTab === 'sales' && (can('sales.view') ? (
          <SalesManagerModule onOpenAddSaleModal={() => setIsSaleModalOpen(true)} />
        ) : <AccessDenied />)}

        {activeTab === 'nola' && (can('losses.view') ? (
          <NolaLossesQualityModule onOpenAddNolaModal={() => setIsNolaModalOpen(true)} />
        ) : <AccessDenied />)}

        {activeTab === 'simulator' && (can('simulator.use') ? <WhatIfSimulatorModule /> : <AccessDenied />)}
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

    </div>
  );
};

const LoginScreen: React.FC = () => {
  const { login } = useAccess();
  const [email, setEmail] = useState('admin@guardioes.local');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) setMessage(result.message ?? 'Não foi possível entrar.');
  };

  return <main className="min-h-screen bg-[#F6F8F6] p-5 text-[#10211B] sm:grid sm:place-items-center">
    <section className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[#DCE5DD] bg-white shadow-[0_24px_70px_rgb(16_33_27_/_0.12)] md:grid-cols-[1.05fr_.95fr]">
      <div className="hidden min-h-[560px] flex-col justify-between bg-[#10211B] p-10 text-white md:flex">
        <div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFB800] text-[#10211B]"><ShieldCheck className="h-7 w-7" /></div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Guardiões da Lasanha</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">Acesse os dados operacionais, custos e decisões gerenciais da operação.</p>
        </div>
        <p className="text-xs text-white/50">Acesso controlado por perfil de usuário.</p>
      </div>
      <div className="p-7 sm:p-10">
        <div className="md:hidden"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFB800] text-[#10211B]"><ShieldCheck className="h-6 w-6" /></div><h1 className="mt-5 text-2xl font-bold">Guardiões da Lasanha</h1></div>
        <div className="mt-8 md:mt-16"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#087B9F]">Acesso ao sistema</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Entrar</h2><p className="mt-2 text-sm text-neutral-600">Informe seu e-mail e senha para continuar.</p></div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold">E-mail<div className="relative mt-1.5"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-neutral-300 py-3 pl-10 pr-3 outline-none focus:border-[#087B9F]" required /></div></label>
          <label className="block text-sm font-semibold">Senha<div className="relative mt-1.5"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-neutral-300 py-3 pl-10 pr-3 outline-none focus:border-[#087B9F]" required /></div></label>
          {message && <p role="alert" className="rounded-xl border border-[#FFB79B] bg-[#FFF0EA] px-3 py-2 text-sm text-[#962006]">{message}</p>}
          <button disabled={submitting} className="w-full rounded-xl bg-[#087B9F] px-4 py-3 font-bold text-white transition-colors hover:bg-[#0B9FC7] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Verificando...' : 'Entrar'}</button>
        </form>
        <p className="mt-7 rounded-xl bg-[#F4FAEA] p-3 text-xs leading-5 text-[#314E0D]">Primeiro acesso: use <strong>admin@guardioes.local</strong> com a senha <strong>guardioes2026</strong>. Depois, cadastre os demais usuários no módulo de permissões.</p>
      </div>
    </section>
  </main>;
};

const AccessGate: React.FC = () => {
  const { authReady, isAuthenticated } = useAccess();
  if (!authReady) return <main className="grid min-h-screen place-items-center bg-[#F6F8F6] text-sm font-medium text-neutral-600">Preparando acesso seguro...</main>;
  if (!isAuthenticated) return <LoginScreen />;
  return <FinanceProvider><MainAppContent /></FinanceProvider>;
};

export default function App() {
  return <AccessProvider><AccessGate /></AccessProvider>;
}
const AccessDenied=()=> <section className="rounded-2xl border border-[#FFEDB0] bg-[#FFF8E6] p-8 text-center"><h1 className="text-lg font-bold">Acesso não autorizado</h1><p className="mt-2 text-sm text-neutral-600">Seu perfil demonstrativo não possui permissão para visualizar este módulo.</p></section>;
