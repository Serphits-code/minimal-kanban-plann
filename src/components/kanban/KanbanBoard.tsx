import { useBoards, useCards } from '@/hooks/useKanban'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { KanbanColumn } from './KanbanColumn'
import { Card as CardType } from '@/types/kanban'

interface KanbanBoardProps {
  boardId: string
  onEditCard: (card: CardType) => void
}

export function KanbanBoard({ boardId, onEditCard }: KanbanBoardProps) {
  const { cards, createCard, moveCard, updateCard } = useCards(boardId)
  const { dragState, handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragAndDrop(moveCard)

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
          onCreateCard={createCard}
          onEditCard={onEditCard}
          onUpdateCard={updateCard}
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
          onCreateCard={createCard}
          onEditCard={onEditCard}
          onUpdateCard={updateCard}
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
          onCreateCard={createCard}
          onEditCard={onEditCard}
          onUpdateCard={updateCard}
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