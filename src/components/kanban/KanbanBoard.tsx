import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { KanbanColumn } from './KanbanColumn'
import { Card as CardType } from '@/types/kanban'

interface KanbanBoardProps {
  boardId: string
  cards: CardType[]
  onCreateCard: (columnId: 'todo' | 'progress' | 'done', title: string) => void
  onMoveCard: (cardId: string, newColumn: 'todo' | 'progress' | 'done') => void
  onUpdateCard: (cardId: string, updates: Partial<CardType>) => void
  onEditCard: (card: CardType) => void
}

export function KanbanBoard({ 
  boardId, 
  cards, 
  onCreateCard, 
  onMoveCard, 
  onUpdateCard, 
  onEditCard 
}: KanbanBoardProps) {
  const { dragState, handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragAndDrop(onMoveCard)

  const todoCards = cards.filter(card => card.column === 'todo')
  const progressCards = cards.filter(card => card.column === 'progress') 
  const doneCards = cards.filter(card => card.column === 'done')

  if (!boardId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Selecione um quadro</h3>
          <p className="text-muted-foreground">Escolha um quadro existente ou crie um novo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex gap-6 p-6 min-w-max">
        <KanbanColumn
          title="A Fazer"
          columnId="todo"
          cards={todoCards}
          onCreateCard={onCreateCard}
          onEditCard={onEditCard}
          onUpdateCard={onUpdateCard}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggedCardId={dragState.draggedCard?.id || null}
        />
        
        <KanbanColumn
          title="Em Progresso"
          columnId="progress"
          cards={progressCards}
          onCreateCard={onCreateCard}
          onEditCard={onEditCard}
          onUpdateCard={onUpdateCard}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggedCardId={dragState.draggedCard?.id || null}
        />
        
        <KanbanColumn
          title="Concluído"
          columnId="done"
          cards={doneCards}
          onCreateCard={onCreateCard}
          onEditCard={onEditCard}
          onUpdateCard={onUpdateCard}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggedCardId={dragState.draggedCard?.id || null}
        />
      </div>
    </div>
  )
}