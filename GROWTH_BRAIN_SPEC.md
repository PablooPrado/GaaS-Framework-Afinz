# GROWTH BRAIN AFINZ — Especificação Técnica Completa

> **Documento de contexto para desenvolvimento com Gemini 3 / Antigravity**
> Versão: 3.1 | Janeiro 2026
> Autor: Pablo (Growth Analyst @ Afinz)

---

## 1. VISÃO DO PRODUTO

### 1.1 O que é o Growth Brain

O Growth Brain Afinz é o **"cérebro operacional"** da aquisição de cartões de crédito do banco. **Não é** apenas um calendário de disparos, nem apenas um painel de BI, nem apenas um "Excel bonito".

### 1.2 Problema que Resolvemos

O Operator Owner (estrategista de Growth) precisa responder diariamente:
- "O que está rodando hoje?" (Launch Planner - ✅)
- "Onde estão os gargalos?" (Funis e KPIs - ✅)
- "Qual combo Canal+Oferta+Segmento está queimando dinheiro?" (Analytics - ✅)
- "Como estamos vs. mês passado?" (Resultados - ✅)
- "O que eu deveria disparar agora para bater meta?" (Orientador - 🚧)

---

## 2. STATUS DE IMPLEMENTAÇÃO (RESUMO)

| Módulo | Status | Notas |
|--------|--------|-------|
| **Launch Planner** | ✅ Pronto | Calendário interativo com filtros e detalhes. |
| **Analytics (Resultados)** | ✅ Pronto | Dashboards, metas vs realizado. |
| **Jornada & Disparos** | ✅ Pronto | Gráficos temporais de evolução. |
| **Framework Explorer** | ✅ Pronto | Tabela completa editável. |
| **Diário de Bordo** | ✅ Pronto | Sistema de notas com tags e persistência. |
| **Orientador (IA)** | 🚧 Beta | Recomendações básicas implementadas. |

---

## 3. ARQUITETURA DE DADOS

### 3.1 Framework de Aquisição (Fonte da Verdade)
O sistema consome CSVs baseados no Framework de Aquisição:
- **40+ colunas** de dados
- Histórico completo de campanhas

### 3.2 Dimensões Principais
- **BU**: B2C, B2B2C, Plurix
- **Canal**: E-mail, SMS, WhatsApp, Push
- **Segmento**: CRM, Cartonistas, Abandonados, etc.
- **Parceiro**: Proprietaria, Serasa, etc.
- **Oferta**: Padrao, Vibe, Limite, etc.

---

## 4. FUNCIONALIDADES DETALHADAS

### 4.1 Launch Planner (Calendário)
- **Visualização**: Grid mensal com indicadores de BU.
- **Interatividade**: Hover cards com 6 KPIs.
- **Filtros**: Cruzamento de BU, Canal, Segmento, Parceiro.

### 4.2 Resultados (Analytics)
- **KPIs de Topo**: Gasto, Cartões, CAC Médio.
- **Comparativos**: Barras de performance por BU.
- **Distribuição**: Pizza interativa (Canais, Segmentos, Ofertass).
- **Metas**: Cadastro de metas mensais e visualização de progresso.

### 4.3 Diário de Bordo (Notes System)
- **Cards**: Notas vinculadas a datas específicas.
- **Tags**: Categorização por BU e Segmento.
- **Persistência**: Dados salvos localmente (`localStorage`).
- **Visualização**: Modo Kanban/Notas integrado ao calendário.

---

## 5. ESPECIFICAÇÃO TÉCNICA

### 5.1 Stack
- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS (Dark Mode default)
- **Estado**: Zustand + Context API
- **Charts**: Recharts
- **Dados**: Papaparse (CSV) + Zod (Validation)

### 5.2 Estrutura de Pastas
```
src/
├── components/       # UI Components
├── hooks/            # Business Logic & Data Access
├── types/            # TypeScript Interfaces
├── utils/            # Helper functions
├── store/            # Global State Management
└── ...
```

---

## 6. BACKLOG & ROADMAP

### Concluído (Fase 1 & 2)
- [x] Infraestrutura e Setup
- [x] Launch Planner completo
- [x] Filtros globais avançados
- [x] Dashboard de Resultados
- [x] Diário de Bordo (Notas)
- [x] Gráficos de Jornada

### Em Progresso (Fase 3 - Inteligência)
- [ ] Refinamento do algoritmo de pontuação do Orientador
- [ ] Exportação avançada de relatórios (PDF/PNG)
- [ ] Integração com backend (preparação)

### Futuro (Fase 4 - Enterprise)
- [ ] Autenticação corporativa (SSO)
- [ ] Banco de dados relacional
- [ ] Integração direta com API do Salesforce/Data Lake
- [ ] Multi-usuário com permissões

---

## 7. COMO CONTRIBUIR

1. Leia `README.md` para setup.
2. Siga o padrão de commits.
3. Use dark mode para desenvolvimento.
4. Mantenha os componentes funcionais (stateless quando possível).

---

**Documento Vivo - Atualize conforme o projeto evolui.**
