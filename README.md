# 📅 Calendário Estratégico — Dashboard de Disparos Salesforce

Dashboard visual intuitivo para visualizar e estrategizar campanhas de aquisição de cartão baseado em dados do Framework Growth.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# 1. Navegar pra pasta do projeto
cd calendar-estrategico

# 2. Instalar dependências
npm install

# 3. Rodar em desenvolvimento
npm run dev

# 4. Abrir no navegador
# Browser vai abrir automaticamente em http://localhost:5173
```

## 📊 Como Usar

### 1. Upload do Framework CSV

1. Na tela inicial, clique ou arraste o arquivo `Framework_Growth_Aquisição_Cartao12_11.csv`
2. O app vai validar e processar automaticamente
3. Verá mensagem de sucesso com total de atividades carregadas

### 2. Filtrar por BU

Na sidebar esquerda:
- ☑ B2C (azul)
- ☑ B2B2C (verde)
- ☑ Plurix (roxo)

Desmarque BUs que não quer visualizar. O calendário atualiza em tempo real.

### 3. Navegar Calendário

- **← Mês anterior** | **Próximo mês →** 
- Cada célula mostra o contador de disparos daquele dia
- Cor indica BU dominante

### 4. Visualizar Detalhes

**Mouse over** em um dia com atividades:
- Popup mostra todas as Activities disparadas
- Para cada Activity:
  - Activity Name (identificador técnico)
  - Canal, BU, Oferta
  - 6 KPIs: Entrega, Abertura, Proposta, Cartões, CAC, Custo

## 📊 Estrutura de Abas

| Aba | Função | Status |
|-----|--------|--------|
| **🚀 Launch Planner** | Calendário operacional + KPIs do período | ◐ Funcional |
| **📊 Resultados** | Comparativos, tabela de combinações, pizza interativa, metas | ◐ Funcional |
| **📈 Jornada & Disparos** | Gráfico temporal (Cartões, Aprovações, Pedidos) | ✅ Concluído |
| **📋 Framework** | Tabela completa editável (41 colunas) + export CSV | ✅ Concluído |
| **📔 Diário de Bordo** | Anotações + flags A/B + tracking de experimentos | ◐ Básico |
| **💡 Orientador** | Engine de recomendação (Fase 2) | ○ Planejado |

## 🏗️ Arquitetura

```
src/
├── components/
│   ├── App.tsx              # Componente principal
│   ├── Calendar.tsx         # Grid calendário (Launch Planner)
│   ├── DayCell.tsx          # Célula individual
│   ├── HoverCard.tsx        # Popup detalhes
│   ├── FilterSidebar.tsx    # Filtros globais
│   ├── CSVUpload.tsx        # Upload arquivo
│   └── ActivityRow.tsx      # Linha de atividade
├── hooks/
│   ├── useFrameworkData.ts  # Parse CSV + validação
│   └── useCalendarFilter.ts # Filtro por BU/Canal/etc
├── types/
│   └── framework.ts         # Tipos TypeScript
├── utils/
│   ├── formatters.ts        # Formato de dados
│   └── validators.ts        # Validadores
├── App.css                  # Estilos globais (Dark Mode)
└── main.tsx                 # Entry point
```

## 🛠️ Stack Técnico

| Tecnologia | Uso |
|------------|-----|
| React 18 | Framework UI |
| TypeScript | Tipagem |
| Vite | Build tool |
| Tailwind CSS | Estilização (Dark Mode First) |
| Zustand | Estado global |
| Recharts | Gráficos |
| Papaparse | Parser CSV |
| Zod | Validação de schemas |
| Lucide Icons | Ícones |
| Date-fns | Manipulação de datas |

## 📋 Colunas do Framework (41 total)

**Obrigatórias para funcionamento básico:**

```
✅ Activity name / Taxonomia   (identificador único)
✅ Data de Disparo              (agregação)
✅ Canal                        (filtro + contexto)
✅ BU                           (filtro + cores)
✅ Segmento                     (filtro + análise)
✅ Parceiro                     (filtro)
✅ Oferta                       (análise)
✅ Taxa de Entrega              (KPI)
✅ Taxa de Conversão            (KPI)
✅ Cartões Gerados              (KPI principal)
✅ Aprovados                    (KPI)
✅ Propostas                    (KPI)
✅ CAC                          (KPI financeiro)
✅ Custo Total Campanha         (KPI financeiro)
```

**Lista completa:** Ver seção 3.3 do [GROWTH_BRAIN_SPEC.md](./GROWTH_BRAIN_SPEC.md)

## 📝 Dicas de Uso

1. **Performance:** Se arquivo for muito grande (>1000 linhas), pode ficar lento. Considere filtrar period antes.

2. **Encoding:** Framework deve estar em **Latin-1 (CP1252)**. Se der erro, reconverta no Excel.

3. **Datas:** Aceita formatos: `DD/MM/YYYY` ou `YYYY-MM-DD`

4. **Valores Monetários:** Aceita `R$ 100,50` ou `100.50`

5. **Percentuais:** Aceita `95%`, `0.95`, ou `95`

## 🚀 Roadmap

### Fase 1: MVP (Em Andamento) ~60h

**Infraestrutura**
- [x] Setup inicial (Vite, Tailwind, TypeScript)
- [x] Parser CSV (Papaparse)
- [x] Filtros universais funcionando em TODAS as abas
- [x] DECISOES_ARQUITETURA.md

**Launch Planner**
- [x] Calendário mensal com navegação
- [x] Cores por BU (B2C=azul, B2B2C=verde, Plurix=roxo)
- [x] KPIs agregados na sidebar
- [x] Modal de detalhes do dia
- [ ] Atalhos para outras abas

**Resultados**
- [x] Tabela de TODAS combinações (Canal + Oferta + Segmento)
- [x] Colunas clicáveis para ordenar (CAC ↑↓, Conversão ↑↓, Cartões ↑↓)
- [x] Pizza Interativa (Dropdown Métrica × Dropdown Agrupamento)
- [x] Modal de Metas (cadastrar meta mensal)
- [x] Meta vs. Realizado (barras de progresso)
- [x] Comparativo de Canais

**Jornada & Disparos**
- [x] Gráfico temporal (Eixo X: tempo, Eixo Y: linhas)
- [x] 3 linhas: Cartões, Aprovações, Pedidos
- [x] Toggle diário/semanal
- [x] Legenda clicável (esconde/mostra linha)
- [x] Clique no ponto mostra campanhas do período

**Framework**
- [x] Tabela completa (41 colunas)
- [x] Busca/filtro por campanha
- [x] Ordenação por qualquer coluna
- [x] Edição inline de QUALQUER campo
- [x] Export CSV (com edições, reimportável)
- [x] Indicador de células editadas
- [x] Sistema de Versionamento (Salvar/Restaurar/Histórico)

**Diário de Bordo**
- [x] CRUD básico de anotações
- [x] Flag "É teste A/B?"
- [x] Vínculo com campanhas (texto livre)
- [x] Status do experimento (Hipótese → Rodando → Concluído → Aprendizado)
- [x] Campo Hipótese + Conclusão

### Fase 2: Orientador ~25h

- [ ] `types/recommendations.ts` — Interfaces TypeScript
- [ ] `useRecommendationEngine` hook — Lógica de scoring
- [ ] Agrupamento por combo (Canal + Oferta + Segmento)
- [ ] Cálculo de Score:
  - CAC (40%) — Menor = melhor
  - Conversão (40%) — Maior = melhor
  - Volume de testes (20%) — Mais = maior confiança
- [ ] `RecommendationCard.tsx` — Card por combinação
- [ ] `HistoricoModal.tsx` — Detalhes de execuções
- [ ] Nova aba "Orientador" integrada

### Fase 3: Persistência & Automação ~30h

- [ ] Modal criar novo disparo
- [x] Salvar alterações do Framework (Versionamento Local)
- [ ] Export avançado (relatórios formatados)
- [ ] Feedback loop (resultado atualiza recomendações)

### Fase 4: Deploy Corporativo ~50h

- [ ] Backend (FastAPI ou Node)
- [ ] Banco de dados (PostgreSQL)
- [ ] SSO / Autenticação corporativa
- [ ] Docker + CI/CD
- [ ] Permissões por usuário
- [ ] Auditoria (quem alterou o quê)

### Fase 5: IA & Multi-Agentes (Futuro)

- [ ] IA Service (camada backend)
- [ ] Integração Gemini API
- [ ] Chat para perguntas em linguagem natural
- [ ] Alertas automáticos (anomalias)
- [ ] File Search para Diário/docs
- [ ] Multi-agentes via ADK (Google Agent Development Kit)

## 🎨 Princípios de Design

1. **Fluidez Absoluta** — Filtros sem delay, gráficos sem flicker
2. **Dark Mode First** — Usado por horas seguidas
3. **Densidade Inteligente** — Dados essenciais visíveis, detalhes via hover/tooltip
4. **Resiliência Silenciosa** — Erros claros, nunca tela branca

## 🐛 Troubleshooting

### "Arquivo não carrega"
→ Verificar encoding (deve ser Latin-1)
→ Verificar se tem todas colunas obrigatórias

### "Calendário vazio"
→ Verificar se BUs estão selecionadas no filtro
→ Verificar se Data de Disparo está no format correto

### "Números aparecem como —"
→ Campo tem dados vazios ou formato inválido
→ Conferir no Framework se coluna tem valores

## 📞 Contato

**Owner:** Pabloooo (Growth Marketing)  
**Status:** MVP v1.0  
**Data:** Nov 2025

---

**Happy strategizing!** 🎯📊
