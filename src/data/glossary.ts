export interface GlossaryItem {
  term: string;
  category: string;
  definition: string;
  formula?: string;
  practicalExample?: string;
  badge?: string;
}

export const FINANCIAL_GLOSSARY: GlossaryItem[] = [
  {
    term: 'Margem de Contribuição (MC)',
    category: 'Conceito Fundamental',
    definition: 'É a quantia que sobra do preço de venda após a dedução dos impostos e de todos os custos variáveis reais, incluindo o refugo de produção. Essa sobra é o que efetivamente "contribui" para pagar os custos fixos da fábrica e formar o lucro líquido.',
    formula: 'Margem de Contribuição (R$) = Preço Líquido - (Insumos + Embalagem + MOD + Outros Variáveis + Perda Rateada)',
    practicalExample: 'Se a Lasanha da Galáxia é vendida no B2C a R$ 28,90 com impostos de 7,5% (R$ 2,17) e custo variável real de R$ 14,35 (incluindo R$ 0,38 de perdas), sua MC unitária é de R$ 12,38 (42,8% da receita bruta).',
  },
  {
    term: 'Ponto de Equilíbrio Contábil (PEC)',
    category: 'Segurança Operacional',
    definition: 'Representa o volume mínimo de faturamento ou de unidades vendidas em que a soma das Margens de Contribuição geradas empata exatamente com o total dos Custos Fixos. Nesse ponto, o lucro operacional contábil é rigorosamente zero.',
    formula: 'PEC (R$) = Custos Fixos Totais ÷ Margem de Contribuição Ponderada (%) | PEC (unidades) = Custos Fixos ÷ MC Média Unitária',
    practicalExample: 'Com custos fixos de R$ 37.700/mês e uma Margem de Contribuição média de 38,5%, a fábrica precisa faturar R$ 97.922/mês (~4.167 unidades) apenas para pagar as contas sem prejuízo.',
  },
  {
    term: 'Ponto de Equilíbrio Econômico (PEE)',
    category: 'Gestão de Metas & Retorno',
    definition: 'Incorpora a meta de lucro desejada pelos sócios ou o custo de oportunidade do capital investido. Demonstra quanto a fábrica precisa vender para, além de zerar todas as contas fixas, colocar no bolso o retorno mínimo exigido.',
    formula: 'PEE (R$) = (Custos Fixos + Meta de Lucro Mensal) ÷ Margem de Contribuição Ponderada (%)',
    practicalExample: 'Para atingir a meta de R$ 20.000 de lucro mensal: (R$ 37.700 + R$ 20.000) ÷ 0,385 = R$ 149.870 de faturamento mensal exigido.',
  },
  {
    term: 'Ponto de Equilíbrio Financeiro (PEF)',
    category: 'Proteção do Caixa',
    definition: 'Focado na solvência imediata do caixa da empresa. Exclui das despesas fixas os itens contábeis que não demandam saída de dinheiro vivo no mês (como a depreciação do túnel de congelamento e ultracongeladores).',
    formula: 'PEF (R$) = Custos Fixos Desembolsáveis ÷ Margem de Contribuição Ponderada (%)',
    practicalExample: 'Com R$ 1.200 de depreciação mensal não-desembolsável: (R$ 37.700 - R$ 1.200) ÷ 0,385 = R$ 94.805 de faturamento mínimo para não ter rombo no caixa.',
  },
  {
    term: 'Margem de Segurança (MS)',
    category: 'Gestão de Risco',
    definition: 'Indica a distância percentual ou em reais entre o faturamento atual da empresa e o Ponto de Equilíbrio Contábil (PEC). Mostra quanto as vendas podem cair sem que a fábrica entre na zona de prejuízo.',
    formula: 'Margem de Segurança (R$) = Faturamento Atual - PEC (R$) | MS (%) = (MS R$ ÷ Faturamento Atual) × 100',
    practicalExample: 'Se a fábrica fatura R$ 125.000 e o PEC é de R$ 97.922, a MS é de R$ 27.078 (21,7% de folga antes do prejuízo).',
  },
  {
    term: 'Alocação de Perdas ao CPV',
    category: 'Engenharia de Custos',
    definition: 'No modelo de custeio industrial da consultoria, o prejuízo financeiro causado pelo refugo do chão de fábrica não é varrido para debaixo do tapete: ele é rateado e adicionado diretamente ao custo unitário de cada massa produzida.',
    formula: 'Perda Unitária = Custo Total de Descarte do Produto (R$) ÷ Unidades Produzidas do Período',
    practicalExample: 'A Lasanha Titã descartou R$ 1.840 em 27 semanas sobre 4.400 unidades produzidas, adicionando R$ 0,42 ao custo real de cada embalagem.',
  },
  {
    term: 'Mix de Canais: B2C (Varejo) vs B2B (Atacado)',
    category: 'Estratégia Comercial',
    definition: 'O canal B2C (consumidor final, loja própria, delivery) opera com alta margem de contribuição (~48% a 52%), enquanto o canal B2B (foodservice, restaurantes, empórios) opera com margens menores (~28% a 32%), porém com alto volume previsível para cobrir custos fixos.',
    formula: 'Markup Multiplicador = Preço de Venda Bruto ÷ Custo Variável Real',
    practicalExample: 'A fábrica equilibra o fluxo: o B2B sustenta a infraestrutura fixa e o B2C alavanca a rentabilidade líquida.',
  },
];

export interface IndustrialRecommendation {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  potentialImpact: string;
}

export const INDUSTRIAL_RECOMMENDATIONS: IndustrialRecommendation[] = [
  {
    id: 'REC-01',
    title: 'Padronização dos Termostatos do Túnel de Congelamento',
    description: 'Instalar sensores IoT com alarme sonoro na câmara de congelamento rápido para impedir oscilações térmicas. A falha de congelamento é o vilão #1, respondendo por R$ 1.818 em perdas.',
    timeframe: 'Imediato (15 dias)',
    potentialImpact: 'Economia de R$ 1.400/mês',
  },
  {
    id: 'REC-02',
    title: 'Gabarito e Calibração dos Cilindros de Laminação',
    description: 'Implementar checklist de abertura de cilindros na produção de massas para eliminar variações de espessura que causam quebra e descarte no corte de lasanhas e rondellis.',
    timeframe: 'Curto Prazo (30 dias)',
    potentialImpact: 'Redução de 40% nas perdas de montagem',
  },
  {
    id: 'REC-03',
    title: 'Metodologia 5S no Estoque Central & Controle FEFO/PEPS',
    description: 'Organizar a câmara de estocagem fria com separação cromática por lote e validade (Primeiro que Vence, Primeiro que Sai - FEFO) para zerar os descartes por vencimento.',
    timeframe: 'Curto Prazo (20 dias)',
    potentialImpact: 'Recuperação de R$ 1.639 nas 27 semanas',
  },
  {
    id: 'REC-04',
    title: 'Painel Visual de Apontamento no Chão de Fábrica',
    description: 'Disponibilizar o registro instantâneo de refugo ao final de cada batelada para que a equipe de produção visualize o custo em reais do desperdício gerado.',
    timeframe: 'Médio Prazo (45 dias)',
    potentialImpact: 'Engajamento e redução de 50% no refugo anual',
  },
];

export const GLOSSARY_ITEMS = FINANCIAL_GLOSSARY;
