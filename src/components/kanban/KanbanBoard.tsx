import { useState } from 'react'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { KanbanColumn } from './KanbanColumn'
import { ColumnEditor } from './ColumnEditor'
import { Card as CardType, Column, Employee } from '@/types/kanban'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Gear, Clock } from '@phosphor-icons/react'

interface KanbanBoardProps {
  boardId: string
  cards: CardType[]
  columns: Column[]
  employees?: Employee[]
  onCreateCard: (title: string, columnId: string) => void
  onMoveCard: (cardId: string, newColumn: string, newOrder?: number) => void
  onUpdateCard: (cardId: string, updates: Partial<CardType>) => void
  onEditCard: (card: CardType) => void
  onToggleCardCompletion: (cardId: string, completed: boolean) => void
  onAddColumn: (name: string) => void
  onUpdateColumn: (columnId: string, updates: Partial<Column>) => void
  onDeleteColumn: (columnId: string) => void
  onReorderColumns: (sourceIndex: number, destinationIndex: number) => void
  onReorderCard: (cardId: string, newOrder: number) => void
}

export function KanbanBoard({ 
  boardId, 
  cards, 
  columns,
  employees = [],
  onCreateCard, 
  onMoveCard, 
  onUpdateCard, 
  onEditCard,
  onToggleCardCompletion,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns,
  onReorderCard
}: KanbanBoardProps) {
  const [showColumnEditor, setShowColumnEditor] = useState(false)
  
  const { dragState, handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragAndDrop(onMoveCard)

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

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 pb-2 flex-shrink-0">
        <h2 className="text-lg font-semibold">Quadro</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowColumnEditor(true)}
          className="gap-2"
        >
          <Gear size={16} />
          Gerenciar Colunas
        </Button>
      </div>



      <div className="flex-1 overflow-auto">
        <div className="flex gap-6 p-6 pt-4 min-w-max">
          {sortedColumns.map((column) => {
            const columnCards = cards
              .filter(card => card.column === column.id)
              .sort((a, b) => a.order - b.order)

            return (
              <KanbanColumn
                key={column.id}
                title={column.name}
                columnId={column.id}
                cards={columnCards}
                employees={employees}
                onCreateCard={onCreateCard}
                onEditCard={onEditCard}
                onUpdateCard={onUpdateCard}
                onToggleCardCompletion={onToggleCardCompletion}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                draggedCardId={dragState.draggedCard?.id || null}
              />
            )
          })}
        </div>
      </div>

      <ColumnEditor
        isOpen={showColumnEditor}
        onClose={() => setShowColumnEditor(false)}
        columns={columns}
        onAddColumn={onAddColumn}
        onUpdateColumn={onUpdateColumn}
        onDeleteColumn={onDeleteColumn}
        onReorderColumns={onReorderColumns}
      />
    </div>
  )
}