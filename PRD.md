# Planning Guide

Um aplicativo kanban minimalista e moderno que permite gerenciar projetos através de múltiplos quadros com funcionalidades avançadas de organização temporal.

**Experience Qualities**:
1. **Eficiente** - Fluxo de trabalho rápido e direto, sem cliques desnecessários para maximizar produtividade
2. **Intuitivo** - Interface limpa que torna óbvio como criar, mover e organizar tarefas
3. **Flexível** - Adaptável a diferentes metodologias de trabalho com múltiplos quadros e planejamento temporal

**Complexity Level**: Light Application (multiple features with basic state)
- Gerencia estado de múltiplos quadros, cards com propriedades complexas e um sistema de planejamento temporal integrado

## Essential Features

**Gerenciamento de Quadros**
- Functionality: Criar, editar, excluir e alternar entre múltiplos quadros kanban
- Purpose: Organizar projetos ou contextos diferentes em espaços separados
- Trigger: Botão "+" na sidebar ou dropdown de seleção de quadros
- Progression: Clique em criar quadro → Digite nome → Confirma → Quadro ativo automaticamente
- Success criteria: Quadros salvos persistem entre sessões e switching é instantâneo

**Sistema de Cards com Propriedades**
- Functionality: Cards com título, descrição, tags coloridas, checklists e datas de vencimento
- Purpose: Capturar todos os detalhes necessários de uma tarefa em um local centralizado
- Trigger: Clique em "+" em qualquer coluna ou modal de edição
- Progression: Adicionar card → Preencher detalhes → Salvar → Card aparece na coluna → Editar clicando no card
- Success criteria: Todas as propriedades são salvas e exibidas claramente no card

**Drag & Drop entre Colunas**
- Functionality: Arrastar cards entre colunas To Do, In Progress, Done
- Purpose: Atualizar status do trabalho de forma visual e intuitiva
- Trigger: Click e drag no card
- Progression: Mousedown no card → Arrastar para coluna destino → Drop → Card reposiciona
- Success criteria: Movimento fluido com feedback visual e posição salva instantaneamente

**Planejador Temporal Integrado**
- Functionality: View de calendário/timeline onde cards podem ser agendados por data/hora
- Purpose: Planejar quando trabalhar em tarefas específicas além do status atual
- Trigger: Botão "Planejador" na navegação ou arrastar card para área de planejamento
- Progression: Abrir planejador → Selecionar data/hora → Arrastar card do kanban → Card aparece no slot temporal
- Success criteria: Cards aparecem tanto no kanban quanto no planejador, com sincronização bidirecional

**Tags Coloridas**
- Functionality: Sistema de etiquetas coloridas para categorização
- Purpose: Classificar e filtrar tarefas por categoria, prioridade ou contexto
- Trigger: Campo de tags na criação/edição do card
- Progression: Digite nome da tag → Selecionar cor → Tag aplicada → Aparece no card
- Success criteria: Tags são visuais, consistentes e permitem filtragem rápida

## Edge Case Handling

- **Quadros Vazios**: Mostrar estado vazio com CTA para criar primeiro card
- **Cards Sem Título**: Fallback para "Tarefa sem título" com destaque visual para edição
- **Conflitos de Agendamento**: Permitir múltiplos cards no mesmo horário com stacking visual
- **Dados Corrompidos**: Recuperação graceful com reset para estado inicial se necessário
- **Drag Cancelado**: Retornar card à posição original com animação suave

## Design Direction

Design minimalista e clean que evoca eficiência e clareza mental, inspirado em ferramentas profissionais como Linear e Notion, com interface limpa que não compete com o conteúdo.

## Color Selection

Analogous (adjacent colors on color wheel) - Usando tons de azul e cinza para criar sensação de calma e profissionalismo, com acentos em verde para ações positivas.

- **Primary Color**: Azul profissional (oklch(0.5 0.15 230)) - Transmite confiança e produtividade
- **Secondary Colors**: Cinza claro (oklch(0.95 0.02 230)) para backgrounds e Cinza médio (oklch(0.7 0.05 230)) para elementos secundários
- **Accent Color**: Verde energético (oklch(0.6 0.15 140)) para CTAs e elementos de progresso
- **Foreground/Background Pairings**:
  - Background (Branco #FFFFFF): Texto escuro (oklch(0.2 0.02 230)) - Ratio 9.1:1 ✓
  - Card (Cinza claro oklch(0.98 0.01 230)): Texto escuro (oklch(0.2 0.02 230)) - Ratio 8.5:1 ✓
  - Primary (Azul oklch(0.5 0.15 230)): Texto branco (#FFFFFF) - Ratio 5.2:1 ✓
  - Accent (Verde oklch(0.6 0.15 140)): Texto branco (#FFFFFF) - Ratio 4.8:1 ✓

## Font Selection

Tipografia clean e moderna usando Inter que transmite profissionalismo e legibilidade excelente em diferentes tamanhos.

- **Typographic Hierarchy**:
  - H1 (Título do Quadro): Inter Bold/24px/tight letter spacing
  - H2 (Títulos de Coluna): Inter Semibold/18px/normal spacing
  - H3 (Título do Card): Inter Medium/16px/normal spacing
  - Body (Descrições): Inter Regular/14px/relaxed line height
  - Caption (Tags, datas): Inter Medium/12px/tight spacing

## Animations

Animações sutis e funcionais que comunicam estado e guiam a atenção, mantendo a sensação de responsividade sem distrair do trabalho.

- **Purposeful Meaning**: Micro-animações que reforçam a física do drag & drop e confirmam ações
- **Hierarchy of Movement**: Cards têm prioridade máxima de animação, seguido por transições de estado e por último elementos da UI

## Component Selection

- **Components**: Card, Button, Input, Dialog, Popover para edição inline, Calendar para planejador, Badge para tags, Checkbox para checklists
- **Customizations**: Card customizado com área de drag, Timeline/Calendar view personalizado para o planejador
- **States**: Hover states suaves em cards, estados de loading durante operações, focus states claros em inputs
- **Icon Selection**: Plus (adicionar), Calendar (planejador), MoreHorizontal (opções), Check (completar), X (remover)
- **Spacing**: Padding consistente de 4/6/8px, gaps de 4px entre elementos relacionados, 8px entre seções
- **Mobile**: Stack lateral em mobile com navigation drawer, cards em lista vertical, planejador adaptado para touch