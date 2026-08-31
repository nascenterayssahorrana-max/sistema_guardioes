import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  HelpCircle,
  Calculator,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Boxes,
} from 'lucide-react';
import { FINANCIAL_GLOSSARY, INDUSTRIAL_RECOMMENDATIONS } from '../data';
import { formatCurrency } from '../utils/formatters';

interface EducationalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalGuideModal: React.FC<EducationalGuideModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'concepts' | 'industrial'>('concepts');

  if (!isOpen) return null;

  const filteredGlossary = FINANCIAL_GLOSSARY.filter((item) => {
    return (
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-black text-white flex items-center justify-between border-b border-[#242424]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB800]/20 text-[#FFC52B] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Guia Didático & Manual de Gestão Financeira Industrial</h2>
              <p className="text-xs text-neutral-400">
                Fundamentos de Engenharia de Custos e Análise CVL aplicados à Guardiões da Lasanha
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Search Bar */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('concepts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'concepts'
                  ? 'bg-[#FFB800] text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-[#F5F5F5] border border-neutral-200'
              }`}
            >
              Conceitos & Fórmulas Financeiras
            </button>
            <button
              onClick={() => setActiveTab('industrial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'industrial'
                  ? 'bg-[#FFB800] text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-[#F5F5F5] border border-neutral-200'
              }`}
            >
              Recomendações Chão de Fábrica (5S / Refugo)
            </button>
          </div>

          {activeTab === 'concepts' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar conceito ou fórmula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs w-full sm:w-64"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-180px)]">
          {activeTab === 'concepts' ? (
            <div className="space-y-4">
              {filteredGlossary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-2 hover:border-[#FFD35A] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#111111] text-sm flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#FFB800]" />
                      <span>{item.term}</span>
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#F5F5F5] text-neutral-600 rounded">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">{item.definition}</p>

                  {item.formula && (
                    <div className="bg-black text-[#FFD35A] p-2.5 rounded-xl font-mono text-xs overflow-x-auto">
                      <strong>Fórmula:</strong> {item.formula}
                    </div>
                  )}

                  {item.practicalExample && (
                    <div className="bg-[#FFF8E6]/70 p-2.5 rounded-xl text-xs text-[#5E3B00] border border-[#FFE080]/60">
                      <strong>Aplicação Prática:</strong> {item.practicalExample}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#EAF9FD]/70 p-4 rounded-2xl border border-[#A7E5F2] text-xs text-[#043342] flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-[#087B9F] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Plano de Ação Industrial Baseado nas 27 Semanas</h4>
                  <p className="mt-1 text-[#06495E]">
                    O diagnóstico financeiro revelou que mais de <strong>R$ 17.200 por ano</strong> são descartados
                    devido a falhas evitáveis de congelamento, espessura desregulada de massa e quebra de cadeia de frio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INDUSTRIAL_RECOMMENDATIONS.map((rec) => (
                  <div key={rec.id} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111111]">{rec.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E3F3C4] text-[#426D12] rounded-full">
                        {rec.potentialImpact}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{rec.description}</p>
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Prazo: <strong>{rec.timeframe}</strong></span>
                      <span className="text-neutral-400 font-mono text-[10px]">{rec.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black hover:bg-[#181818] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
