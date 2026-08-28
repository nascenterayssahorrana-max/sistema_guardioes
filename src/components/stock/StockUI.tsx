import React from 'react';
import { StockSituation, StockProduct } from '../../types/stock';
import { getSituation } from '../../context/StockContext';
import { X } from 'lucide-react';

export const SITUATION_LABEL: Record<StockSituation, string> = {
  NORMAL: 'Estoque normal',
  BAIXO: 'Estoque baixo',
  ZERADO: 'Sem estoque',
};

export const SituationBadge: React.FC<{ situation: StockSituation; compact?: boolean }> = ({
  situation,
  compact,
}) => {
  const styles: Record<StockSituation, string> = {
    NORMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    BAIXO: 'bg-amber-50 text-amber-700 border-amber-200',
    ZERADO: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const dot: Record<StockSituation, string> = {
    NORMAL: 'bg-emerald-500',
    BAIXO: 'bg-amber-500',
    ZERADO: 'bg-rose-500',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${styles[situation]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot[situation]}`} />
      {compact ? situation.charAt(0) + situation.slice(1).toLowerCase() : SITUATION_LABEL[situation]}
    </span>
  );
};

export const ProductSituationBadge: React.FC<{ product: StockProduct }> = ({ product }) => (
  <SituationBadge situation={getSituation(product)} />
);

export const StatCard: React.FC<{
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'sky';
}> = ({ label, value, hint, icon: Icon, tone = 'slate' }) => {
  const tones = {
    slate: 'text-slate-700 bg-slate-100 border-slate-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    rose: 'text-rose-700 bg-rose-50 border-rose-200',
    sky: 'text-sky-700 bg-sky-50 border-sky-200',
  } as const;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export const Panel: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, actions, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
    <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ isOpen, onClose, title, subtitle, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div
        className={`bg-white w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} rounded-2xl shadow-2xl border border-slate-200 my-4`}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className = '',
}) => (
  <label className={`block ${className}`}>
    <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

export const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500';

export const btnPrimary =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50';
export const btnGhost =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer';
export const btnGreen =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer';
export const btnRose =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer';

export const Alert: React.FC<{ tone: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({
  tone,
  children,
}) => {
  const map = {
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info: 'bg-sky-50 border-sky-200 text-sky-700',
  } as const;
  return <div className={`text-xs font-medium border rounded-lg px-3 py-2 ${map[tone]}`}>{children}</div>;
};

export const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
