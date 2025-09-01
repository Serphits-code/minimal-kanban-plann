import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card as CardType } from '@/types/kanban'
import { KanbanCard } from './KanbanCard'
import { Plus } from '@phosphor-icons/react'
import React, { useState } from 'react'

interface KanbanColumnProps {
  title: string
  columnId: 'todo' | 'progress' | 'done'
  cards: CardType[]
  onCreateCard: (columnId: 'todo' | 'progress' | 'done', title: string) => void
  onEditCard: (card: CardType) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (column: 'todo' | 'progress' | 'done', event: React.DragEvent) => void
  onDragStart: (card: CardType, event: React.DragEvent) => void
  onDragEnd: () => void
  draggedCardId: string | null
}

export function KanbanColumn({
  title,
  columnId,
  cards,
  onCreateCard,
  onEditCard,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  draggedCardId
}: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onCreateCard(columnId, newCardTitle.trim())
      setNewCardTitle('')
      setIsAddingCard(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard()
    } else if (e.key === 'Escape') {
      setIsAddingCard(false)
      setNewCardTitle('')
    }
  }

  return (
    <div className="flex flex-col h-full min-w-80">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {cards.length}
        </span>
      </div>

      <div
        className="flex-1 space-y-3 p-2 rounded-lg border-2 border-dashed border-transparent transition-colors min-h-40"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(columnId, e)}
        style={{
          borderColor: draggedCardId ? 'var(--color-border)' : 'transparent'
        }}
      >
        {cards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            onEdit={onEditCard}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggedCardId === card.id}
          />
        ))}

        {isAddingCard ? (
          <div className="p-3 border rounded-lg bg-card">
            <Input
              placeholder="Título do card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!newCardTitle.trim()) {
                  setIsAddingCard(false)
                }
              }}
              autoFocus
              className="border-none p-0 text-sm font-medium focus-visible:ring-0"
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleAddCard} disabled={!newCardTitle.trim()}>
                Adicionar
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setIsAddingCard(false)
                  setNewCardTitle('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus size={16} />
            Adicionar card
          </Button>
        )}
      </div>
    </div>
  )
}