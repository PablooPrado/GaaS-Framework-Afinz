# GROWTH BRAIN AFINZ — Especificação Técnica Completa

> **Documento de contexto para desenvolvimento com Gemini 3 / Antigravity**  
> Versão: 3.0 | Novembro 2025  
> Autor: Pablo (Growth Analyst @ Afinz)

---

## 1. VISÃO DO PRODUTO

### 1.1 O que é o Growth Brain

O Growth Brain Afinz é o **"cérebro operacional"** da aquisição de cartões de crédito do banco. **Não é** apenas um calendário de disparos, nem apenas um painel de BI, nem apenas um "Excel bonito".

É um sistema integrado que conecta:

| Pilar | Descrição |
|-------|-----------|
| **Planejamento** | O que será disparado e quando |
| **Execução** | O que de fato rodou |
| **Resultado** | O que funcionou, o que não funcionou |
| **Base** | A estrutura de dados do Framework (fonte da verdade) |
| **Aprendizado** | Hipóteses, experimentos, conclusões |

### 1.2 Problema que Resolvemos

O Operator Owner (estrategista de Growth) precisa responder diariamente:

- "O que está rodando hoje?"
- "Onde estão os gargalos?"
- "Qual combo Canal+Oferta+Segmento está queimando dinheiro?"
- "Como estamos vs. mês passado?"
- "O que eu deveria disparar agora para bater meta?"

**Dor atual:**
- Trabalho manual intenso em planilhas Excel
- Consolidação manual de dados (SOMASES, filtros, cruzamentos)
- Dificuldade de enxergar conflitos e saturação da base
- Falta de lugar único que junte planejamento + resultado + aprendizado

**Ganho desejado:**
- Responder perguntas-chave em segundos
- Focar em análise e estratégia, não em "caçar número"
- Confiança operacional ("não esqueci disparo importante")

### 1.3 Personas

**1. Operator Owner / Estrategista de Growth (Prioridade)**
- Planeja campanhas mensais/semanais
- Aloca budget por canal, parceiro, segmento
- Monitora CAC, volume de cartões, qualidade da base
- Frequência de uso: diária (manhã)

**2. Operador Tático / Execução (Futuro)**
- Sobe criativos, jornadas, públicos no stack
- Garante que campanhas subam no dia certo
- Precisa saber "o que tem pra hoje"

**3. Diretores (Futuro)**
- Visão consolidada em reuniões semanais/mensais
- Pode precisar de views diferentes

---

## 2. PRINCÍPIOS DE DESIGN (The Vibe)

Estes princípios devem ser respeitados em qualquer feature nova:

### 2.1 Fluidez Absoluta
- Filtros aplicam sem delay perceptível
- Gráficos e tabelas atualizam sem "flicker"
- Mudanças de aba são suaves (transições leves)
- Sensação de app nativo, não site pesado

### 2.2 Estética Premium (Dark Mode First)
- App usado por horas seguidas
- Dark mode como padrão
- Tipografia limpa (Inter/Geist ou equivalente)
- Paleta com cores de estado claras:
  - Verde/azul → saudável
  - Amarelo/laranja → atenção
  - Vermelho → problema
- Menos é mais: poucos elementos visuais, bem organizados

### 2.3 Densidade Inteligente de Informação
- Dados essenciais sempre visíveis
- Detalhes acessíveis por hover, tooltip, expand/collapse
- Exemplo: tabela mostra KPIs principais, tooltip mostra breakdown

### 2.4 Resiliência Silenciosa
- CSV com coluna faltando → mensagem clara e específica
- Linha inválida → destacada com ícone + explicação
- Nunca: tela branca, erro genérico, crash

---

## 3. ESTRUTURA DE DADOS

### 3.1 Framework de Aquisição (Fonte da Verdade)

O sistema consome a aba **"Base Geral Campanhas"** do Excel:

- **416+ campanhas** (e crescendo)
- **41 colunas** de dados
- **7 meses de histórico** (mai/25 a nov/25)

### 3.2 Dimensões Principais

| Dimensão | Valores | Qtd |
|----------|---------|-----|
| **BU** | B2C, B2B2C, Plurix | 3 |
| **Canal** | E-mail, SMS, WhatsApp, Push | 4 |
| **Segmento** | CRM, Cartonistas, Abandonados, Leads_Parceiros, Base_Proprietaria, Instabilidade, Aprovados_nao_convertidos, Negados | 8 |
| **Parceiro** | Proprietaria, Serasa, Bom_Pra_Credito, Dia, Alvorada | 5 |
| **Oferta** | Padrao, Vibe, Limite | 3 |
| **Safra** | mai/25 a nov/25 | 7 |
| **Disparado?** | Sim, Não | 2 |

### 3.3 Lista Completa de Colunas (41)

```
01. Disparado?
02. Jornada
03. Activity name / Taxonomia
04. Canal
05. Data de Disparo
06. Data Fim
07. Safra
08. BU
09. Parceiro
10. SIGLA
11. Segmento
12. SIGLA.1
13. Subgrupos
14. Base Total
15. Base Acionável
16. % Otimização de base
17. Etapa de aquisição
18. Ordem de disparo
19. Perfil de Crédito
20. Produto
21. Oferta
22. Promocional
23. SIGLA.2
24. Oferta 2
25. Promocional 2
26. Custo Unitário Oferta
27. Custo Total da Oferta
28. Custo unitário do canal
29. Custo total canal
30. Taxa de Entrega
31. Taxa de Abertura
32. Taxa de Clique
33. Taxa de Proposta
34. Taxa de Aprovação
35. Taxa de Finalização
36. Taxa de Conversão
37. Custo Total Campanha
38. CAC
39. Cartões Gerados
40. Aprovados
41. Propostas
```

### 3.4 Métricas-Chave

| Métrica | Range Típico | Significado |
|---------|--------------|-------------|
| **Base Acionável** | 0 - 301.829 | Contatos disponíveis |
| **Taxa de Entrega** | média 84% | % mensagens que chegaram |
| **Taxa de Conversão** | média 1%, max 38% | % que virou cartão |
| **CAC** | R$0,46 - R$538,56, média R$14,34 | Custo por cartão |
| **Cartões Gerados** | varia | Resultado final |
| **Aprovados** | varia | Cartões aprovados |
| **Propostas** | varia | Pedidos realizados |

---

## 4. ARQUITETURA DE ABAS

### 4.1 Visão Geral por Fase

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FASE 1 - MVP (5 abas)                         │
├─────────────────┬─────────────────┬─────────────────────────────────────┤
│ 🚀 Launch       │ 📊 Resultados   │ 📈 Jornada & Disparos               │
│    Planner      │                 │                                     │
├─────────────────┴─────────────────┴─────────────────────────────────────┤
│        📋 Framework              │        📔 Diário de Bordo            │
└──────────────────────────────────┴──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        FASE 2 - ORIENTADOR (+1 aba)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                    💡 Orientador de Recomendações                       │
│         (Engine que sugere: "O que devo disparar agora?")               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Filtros Globais (Sidebar)

Devem funcionar em **TODAS as abas**:

- BU (multi-select)
- Canal (multi-select)
- Segmento (multi-select)
- Parceiro (multi-select)
- Oferta (multi-select)
- Período (date range)
- Disparado? (Sim/Não/Todos)

**Status atual:** Filtros só funcionam em 1 aba. Precisa corrigir para funcionar em todas.

---

## 5. ESPECIFICAÇÃO POR ABA - FASE 1 (MVP)

### 5.1 Launch Planner

**Status:** ◐ Parcialmente funcional

**Objetivo:** Visão central de "o que aconteceu / o que vai acontecer" por dia.

**Elementos:**

| Componente | Descrição | Status |
|------------|-----------|--------|
| Calendário mensal | Grid 7x6, navegação mês anterior/próximo | ✓ Funciona |
| Cor por BU | B2C=azul, B2B2C=verde, Plurix=roxo | ✓ Funciona |
| Hover preview | Mostra resumo da célula | ◐ Verificar |
| Modal de dia | Clique abre detalhes das campanhas | ◐ Verificar |
| KPIs agregados | Sidebar direita com métricas do período | ✓ Funciona |
| Funil de conversão | Barra horizontal visual | ✓ Funciona |
| Export CSV | Botões de exportação | ✓ Funciona |

**Interações:**
- Filtros atualizam calendário em tempo real
- Clicar em dia → abre modal com campanhas
- Atalhos para: Resultados, Jornada, Diário de Bordo

---

### 5.2 Resultados

**Status:** ↻ Precisa redesenhar

**Objetivo:** Análise profunda de desempenho por combinações, canais e metas.

#### 5.2.1 Tabela de Combinações

**IMPORTANTE:** Mostrar TODAS as combinações, não apenas top 5.

| Característica | Especificação |
|----------------|---------------|
| Cada linha | Canal + Oferta + Segmento (+ Parceiro/BU opcional) |
| Colunas | Envios, Pedidos, Aprovações, Cartões, Custo, CAC |
| Ordenação | Clicar no header → alterna crescente/decrescente |
| Highlight | Linhas com CAC crítico ficam em vermelho |
| Paginação | Se necessário para performance |

#### 5.2.2 Meta vs. Realizado

**Metas definidas via Modal dentro desta aba.**

Estrutura de dados:
```json
{
  "mes": "2025-11",
  "cartoes_meta": 3000,
  "aprovacoes_meta": 1500,
  "cac_max": 12.00
}
```

Exibição:
- Barra de progresso: % de meta de cartões atingida
- Barra de progresso: % de meta de aprovações atingida
- Indicador: CAC médio vs. limite (verde se OK, vermelho se acima)

#### 5.2.3 Comparativo de Canais

- Gráfico de barras comparando canais por métrica
- Dropdown para escolher métrica (Cartões, Pedidos, CAC, etc.)
- Legenda interativa para esconder/mostrar canais

#### 5.2.4 Pizza Interativa

**Dois dropdowns:**

| Dropdown 1: Métrica | Dropdown 2: Agrupar por |
|---------------------|-------------------------|
| Custo | Canal |
| Cartões | BU |
| Pedidos | Parceiro |
| Aprovações | Oferta |
| CAC | Segmento |

A pizza redesenha dinamicamente com base na combinação escolhida.

---

### 5.3 Jornada & Disparos

**Status:** ↻ Precisa redesenhar (atualmente mostra 0% e NaN)

**Objetivo:** Visão de causa/efeito entre disparos e resultados ao longo do tempo.

#### 5.3.1 Gráfico Temporal Principal

| Eixo | Especificação |
|------|---------------|
| **Eixo X** | Tempo (toggle: diário / semanal) |
| **Eixo Y** | Múltiplas linhas: Cartões, Aprovações, Pedidos |

**IMPORTANTE:** As métricas são Cartões, Aprovações, Pedidos. NÃO usar "Conversão" como linha separada.

**Interações:**
- Toggle para alternar vista diária ↔ semanal
- Legenda clicável: clicar em "Cartões" esconde/mostra a linha
- Mesmo comportamento para Aprovações e Pedidos

#### 5.3.2 Conexão com Disparos

Ao clicar em um ponto do gráfico (dia ou semana):
- Mostrar painel/modal com:
  - Lista de campanhas que rodaram no período
  - KPIs agregados daquele período
  - Atalho para ver no Resultados
  - Atalho para notas do Diário de Bordo

---

### 5.4 Framework

**Status:** ○ Nova aba a construir

**Objetivo:** Explorador editável da base completa (fonte da verdade).

**IMPORTANTE:** O nome da aba é "Framework", não "Explorador".

#### 5.4.1 Tabela Completa

- Exibir todas as 41 colunas
- Rolagem horizontal e vertical
- Filtros por coluna (texto, datas, valores)
- Ordenação por qualquer coluna (clicar header)

#### 5.4.2 Edição Inline

- Usuário pode editar **QUALQUER campo** de qualquer linha
- Destacar visualmente células/linhas alteradas
- Manter alterações no estado enquanto sessão ativa

#### 5.4.3 Busca

- Campo de busca para encontrar campanha específica
- Busca por qualquer coluna (nome, jornada, canal, etc.)

#### 5.4.4 Export CSV

- Botão "Exportar CSV" gera arquivo:
  - Com mesmas colunas e ordem do CSV de entrada
  - Inclui edições feitas
  - Formatado para ser reimportado no sistema

---

### 5.5 Diário de Bordo

**Status:** ◐ Básico funciona, precisa evoluir

**Objetivo:** Registro de contexto, hipóteses, experimentos e aprendizados.

#### 5.5.1 Estrutura de Entrada

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Data | date | Sim |
| Autor | string | Sim (fixo "Pablo" por enquanto) |
| Título | string | Sim |
| Descrição | text | Não |
| É teste A/B? | boolean | Não |
| Campanhas relacionadas | array de IDs | Não |
| Status do experimento | enum | Não |
| Hipótese | text | Não |
| Conclusão | text | Não |

#### 5.5.2 Status de Experimento

Fluxo de status:

```
Hipótese → Rodando → Concluído → Aprendizado
```

**Regras a definir (brainstorm com IA):**
- Quais campos obrigatórios em cada status?
- Permitir voltar status ou fluxo estrito?
- Como exibir badge de experimento junto às campanhas?

#### 5.5.3 Integração com Outros Módulos

- Clicar em dia no Launch Planner → mostra notas relacionadas
- Clicar em ponto no Jornada → mostra notas do período
- Campanhas vinculadas a experimentos têm badge/ícone

---

## 6. ESPECIFICAÇÃO - FASE 2 (ORIENTADOR)

**Timeline:** Após Fase 1 concluída

### 6.1 Objetivo

Responder a pergunta: **"O que devo disparar agora?"**

O Orientador analisa o histórico e recomenda as melhores combinações de Canal + Oferta + Segmento.

### 6.2 Engine de Recomendação

**Cálculo de Score por Combinação:**

| Componente | Peso | Lógica |
|------------|------|--------|
| CAC | 40% | Menor CAC = maior score |
| Taxa de Conversão | 40% | Maior conversão = maior score |
| Volume de testes | 20% | Mais testes = maior confiança |

### 6.3 Elementos da Aba

| Componente | Descrição |
|------------|-----------|
| Lista de recomendações | Cards ordenados por score |
| RecommendationCard | Mostra combo, score, histórico resumido |
| HistoricoModal | Detalhes de execuções anteriores |
| Filtros | Por canal, segmento, período |

### 6.4 Itens do Backlog (Fase 2)

```
2.01 types/recommendations.ts - Interfaces TypeScript
2.02 useRecommendationEngine hook - Lógica principal de scoring
2.03 Agrupamento por combo - Canal + Oferta + Segmento
2.04 Cálculo CAC médio (40%)
2.05 Cálculo Taxa Conversão (40%)
2.06 Cálculo Volume # testes (20%)
2.07 RecommendationView.tsx - Container da aba
2.08 RecommendationCard.tsx - Card por combinação
2.09 HistoricoModal.tsx - Detalhes de execuções
2.10 Integração App.tsx - Nova aba Orientador
```

---

## 7. FASES FUTURAS

### 7.1 Fase 3: Persistência & Automação

- Modal para criar novo disparo direto no sistema
- Integração com Framework (salvar alterações)
- Export avançado (relatórios formatados)
- Feedback loop (resultado real atualiza recomendações)

### 7.2 Fase 4: Deploy Corporativo

- Backend (FastAPI ou Node)
- Banco de dados (PostgreSQL ou similar)
- SSO / Autenticação corporativa
- Docker + CI/CD
- Permissões por usuário
- Auditoria (quem alterou o quê)

**NOTA:** Detalhes da Fase 4 serão definidos em brainstorm com IA quando chegar o momento.

---

## 8. ARQUITETURA TÉCNICA

### 8.1 Stack Frontend

| Tecnologia | Uso |
|------------|-----|
| React 18 | Framework principal |
| TypeScript | Tipagem |
| Vite | Build tool |
| Tailwind CSS | Estilização |
| Zustand | Estado global |
| Recharts | Gráficos |
| Papaparse | Parser CSV |
| Zod | Validação de schemas |

### 8.2 Estado Global (Store)

```typescript
type FrameworkRow = { /* 41 colunas tipadas */ }

type Goal = {
  mes: string;           // "2025-11"
  cartoes_meta?: number;
  aprovacoes_meta?: number;
  cac_max?: number;
};

type JournalEntry = {
  id: string;
  data: string;
  autor: string;
  titulo: string;
  descricao: string;
  testeAB: boolean;
  campanhasRelacionadas: string[];
  statusExperimento?: "hipotese" | "rodando" | "concluido" | "aprendizado";
  hipotese?: string;
  conclusao?: string;
};

type ViewSettings = {
  periodo: { inicio: string; fim: string };
  abaAtual: "launch" | "resultados" | "jornada" | "framework" | "diario" | "orientador";
  filtrosGlobais: {
    bu?: string[];
    canal?: string[];
    parceiro?: string[];
    oferta?: string[];
    segmento?: string[];
  };
  modoTempoJornada: "diario" | "semanal";
};

// Store global contém:
// - frameworkData: FrameworkRow[]
// - goals: Goal[]
// - journal: JournalEntry[]
// - viewSettings: ViewSettings
// - frameworkEdits: Map<rowId, editedFields>
```

### 8.3 Performance

- `useMemo` / `useCallback` para cálculos de agregações
- Virtualização para tabelas grandes (Framework)
- Lazy loading de componentes pesados

### 8.4 Validação com Zod

Na importação do CSV:
1. Ler arquivo
2. Mapear cada linha para objeto tipado
3. Validar com Zod
4. Linha inválida → destacar com: número da linha, campo problemático, motivo

### 8.5 Design System (Atomic Design)

| Nível | Exemplos |
|-------|----------|
| **Atoms** | Botões, Badges de status, Ícones de canal |
| **Molecules** | KPIWidget, FilterChip, ComboRow |
| **Organisms** | CalendarGrid, ResultsTable, TimelineChart, FrameworkGrid, JournalList |
| **Layouts** | DashboardLayout (sidebar + conteúdo) |

---

## 9. DECISÕES ARQUITETURAIS (Para Fase 4)

Documentar no arquivo `DECISOES_ARQUITETURA.md`:

| Decisão | Valor Atual | Impacto Fase 4 |
|---------|-------------|----------------|
| Onde salvar dados | localStorage | Migrar para banco |
| Estrutura Framework | CSV como fonte | Controle de versão |
| Identificação usuário | Fixo "Pablo" | Plugar login |
| Formato das metas | JSON estruturado | Fácil virar tabela |
| Edições do Framework | Sem histórico | Auditoria futura |

**Princípio:** Usar estruturas de dados pensadas para crescer (JSON bem definido, não gambiarras).

---

## 10. DEFINITION OF DONE

O sistema será considerado "usável de verdade" quando:

| Critério | Tempo Alvo |
|----------|------------|
| Ver "o que temos hoje" ao abrir o app | < 10 segundos |
| Responder "quais combos performam bem/mal" | < 30 segundos |
| Ajustar metas e ver Meta vs Realizado | < 1 minuto |
| Encontrar e editar linha no Framework | Mais rápido que Excel |
| Registrar hipótese de teste A/B | < 1 minuto |
| **Preferência de uso** | Growth Brain > Planilha bruta |

---

## 11. BACKLOG RESUMIDO

### Fase 1: MVP (~60h)

| Área | Itens | Status |
|------|-------|--------|
| Infraestrutura | Setup, Parser, Filtros universais | ◐ 60% |
| Launch Planner | Calendário, navegação, KPIs | ◐ 80% |
| Resultados | Tabela, Pizza, Metas | ○ 10% |
| Jornada & Disparos | Gráfico temporal | ○ 0% |
| Framework | Tabela editável, export | ○ 0% |
| Diário de Bordo | CRUD, flags A/B | ◐ 50% |

### Fase 2: Orientador (~25h)

- Engine de scoring
- Componentes de recomendação
- Nova aba

### Fase 3: Persistência (~30h)

- Salvar alterações
- Criar disparos
- Export avançado

### Fase 4: Deploy (~50h)

- Backend
- Banco
- Auth
- Docker

---

## 12. COMO USAR ESTE DOCUMENTO

### Para Vibe Coding no Antigravity:

1. **Abrir projeto existente** ou criar novo
2. **Colar este documento** como contexto inicial
3. **Pedir feature específica** referenciando a seção relevante

Exemplos de prompts:

```
"Implemente a Tabela de Combinações conforme seção 5.2.1"

"Crie o gráfico temporal da seção 5.3.1 com as 3 linhas (Cartões, Aprovações, Pedidos)"

"Adicione a Pizza Interativa com os 2 dropdowns conforme 5.2.4"

"Faça os filtros globais funcionarem em todas as abas conforme 4.2"
```

### Para Brainstorm:

```
"Me ajude a definir as regras de transição de status de experimento (seção 5.5.2)"

"Como implementar a engine de recomendação da Fase 2?"

"Quais decisões arquiteturais devo documentar para facilitar Fase 4?"
```

---

**Fim do documento de especificação.**

*Última atualização: Novembro 2025*
