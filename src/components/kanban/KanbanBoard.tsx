import { useState, useMemo } from 'react'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { KanbanColumn } from './KanbanColumn'
import { ColumnEditor } from './ColumnEditor'
import { Card as CardType, Column, Employee, Priority, PRIORITY_CONFIG } from '@/types/kanban'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Gear, X, FunnelSimple } from '@phosphor-icons/react'

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
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>('all')

  const hasActiveFilter = filterPriority !== 'all' || filterAssigneeId !== 'all'

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (filterPriority !== 'all' && card.priority !== filterPriority) return false
      if (filterAssigneeId !== 'all') {
        const inAssignees = card.assigneeIds?.includes(filterAssigneeId) || card.assigneeId === filterAssigneeId
        if (!inAssignees) return false
      }
      return true
    })
  }, [cards, filterPriority, filterAssigneeId])

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
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 pb-2 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as Priority | 'all')}>
            <SelectTrigger className="h-8 w-[140px] text-xs gap-1">
              <FunnelSimple size={13} className="text-muted-foreground" />
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda prioridade</SelectItem>
              {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string; color: string }][]).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assignee filter */}
          {employees.length > 0 && (
            <Select value={filterAssigneeId} onValueChange={setFilterAssigneeId}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos responsáveis</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear filters */}
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => { setFilterPriority('all'); setFilterAssigneeId('all') }}
            >
              <X size={13} className="mr-1" />
              Limpar
            </Button>
          )}

          {hasActiveFilter && (
            <Badge variant="secondary" className="text-xs">
              {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowColumnEditor(true)}
          className="gap-1.5 h-8 text-xs"
        >
          <Gear size={15} />
          <span className="hidden sm:inline">Gerenciar Colunas</span>
          <span className="sm:hidden">Colunas</span>
        </Button>
      </div>



      <div className="flex-1 overflow-auto">
        <div className="flex gap-6 p-6 pt-4 min-w-max">
          {sortedColumns.map((column) => {
            const columnCards = filteredCards
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