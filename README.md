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

### 2. Filtrar por BU e Atributos

Na sidebar esquerda (ou botão de filtros):
- **BU**: B2C, B2B2C, Plurix
- **Canal**: E-mail, SMS, WhatsApp, Push
- **Segmento**: CRM, Cartonistas, etc.
- **Parceiro**: Proprietária, Serasa, etc.

O calendário e gráficos atualizam em tempo real.

### 3. Navegar Calendário

- **← Mês anterior** | **Próximo mês →** 
- Cada célula mostra o contador de disparos daquele dia
- Cor indica BU dominante (Azul=B2C, Verde=B2B2C, Roxo=Plurix)

### 4. Visualizar Detalhes

**Mouse over** em um dia com atividades:
- Popup mostra todas as Activities disparadas
- Para cada Activity:
  - Activity Name (identificador técnico)
  - Canal, BU, Oferta
  - 6 KPIs: Entrega, Abertura, Proposta, Cartões, CAC, Custo

### 5. Diário de Bordo (Notas)

- Clique no botão **"Diário de Bordo"** abaixo do calendário
- O calendário muda para modo de notas
- Clique em qualquer dia para adicionar/editar notas
- Ícone 📝 indica presença de nota
- Notas podem ter tags (BU, Segmento, Parceiro) e são filtráveis

## 📊 Estrutura de Abas

| Aba | Função | Status |
|-----|--------|--------|
| **🚀 Launch Planner** | Calendário operacional + KPIs do período | ✅ Funcional |
| **📊 Resultados** | Comparativos, tabela de combinações, pizza interativa, metas | ✅ Funcional |
| **📈 Jornada & Disparos** | Gráfico temporal (Cartões, Aprovações, Pedidos) | ✅ Concluído |
| **📋 Framework** | Tabela completa editável (41 colunas) + export CSV | ✅ Concluído |
| **📔 Diário de Bordo** | Sistema completo de notas com tags e persistência | ✅ Concluído |
| **💡 Orientador** | Engine de recomendação (Fase 2) | ✅ Funcional |

## 🏗️ Arquitetura

```
src/
├── components/
│   ├── App.tsx              # Componente principal
│   ├── Calendar.tsx         # Grid calendário (Launch Planner)
│   ├── DayCell.tsx          # Célula individual (Atividades + Notas)
│   ├── HoverCard.tsx        # Popup detalhes
│   ├── FilterSidebar.tsx    # Filtros globais avançados
│   ├── CSVUpload.tsx        # Upload arquivo
│   ├── NoteEditorModal.tsx  # Editor de notas com tags
│   ├── Dashboard/           # Componentes de gráficos e KPIs
│   └── ...
├── hooks/
│   ├── useFrameworkData.ts  # Parse CSV + validação
│   ├── useCalendarFilter.ts # Filtro por BU/Canal/etc
│   ├── useNotesWithTags.ts  # Gerenciamento de notas (localStorage)
│   ├── useAdvancedFilters.ts # Lógica de filtragem complexa
│   └── ...
├── types/
│   ├── framework.ts         # Tipos TypeScript
│   └── notes.ts             # Tipos do sistema de notas
├── utils/
│   ├── formatters.ts        # Formato de dados
│   └── validators.ts        # Validadores
├── store/                   # Zustand Stores
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
| Recharts | Gráficos e Dashboards |
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

## 📝 Dicas de Uso

1. **Persistência:** Notas e Metas são salvas no `localStorage` do navegador. Limpar o cache apagará esses dados.
2. **Performance:** O app processa tudo localmente. Arquivos >5MB podem levar alguns segundos para carregar.
3. **Encoding:** Preferência por UTF-8, mas suporta Latin-1.

## 🚀 Status do Projeto

**Versão Atual:** 3.0 (Janeiro 2026)
**Status:** ✅ Produção / Estável

### Destaques Recentes
- **Refatoração UI:** Layout limpo e responsivo.
- **Diário de Bordo 2.0:** Sistema robusto de anotações integradas.
- **Filtros Avançados:** Filtragem cruzada por múltiplos critérios.
- **Gráficos de Performance:** Visualização clara de metas e tendências.

---

**Happy strategizing!** 🎯📊
