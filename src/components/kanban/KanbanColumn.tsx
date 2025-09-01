import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card as CardType } from '@/types/kanban'
import { KanbanCard } from './KanbanCard'
import { Plus } from '@phosphor-icons/react'
import React, { useState } from 'react'

interface KanbanColumnProps {
  title: string
  columnId: string
  cards: CardType[]
  onCreateCard: (columnId: string, title: string) => void
  onEditCard: (card: CardType) => void
  onUpdateCard: (cardId: string, updates: Partial<CardType>) => void
  onDragOver: (event: React.DragEvent<HTMLElement>) => void
  onDrop: (column: string, event: React.DragEvent<HTMLElement>) => void
  onDragStart: (card: CardType, event: React.DragEvent<HTMLElement>, index: number) => void
  onDragEnd: (event: React.DragEvent<HTMLElement>) => void
  draggedCardId: string | null
}

export function KanbanColumn({
  title,
  columnId,
  cards,
  onCreateCard,
  onEditCard,
  onUpdateCard,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  draggedCardId
}: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onCreateCard(columnId, newCardTitle.trim())
      setNewCardTitle('')
      setIsAddingCard(false)
    }
  }

  const handleKeyPress = (e: React.KeyEvent) => {
    if (e.key === 'Enter') {
      handleAddCard()
    } else if (e.key === 'Escape') {
      setIsAddingCard(false)
      setNewCardTitle('')
    }
  }

  const handleCardDragOver = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleCardDrop = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Use a more robust way to get drag data
    let cardId = e.dataTransfer.getData('text/plain')
    if (!cardId) {
      try {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
        cardId = dragData.cardId
      } catch {
        // If we can't get the cardId, don't proceed
        return
      }
    }
    
    if (cardId) {
      // Call the drop handler with the specific index
      onDrop(columnId, e, index)
    }
    
    setDragOverIndex(null)
  }

  const handleColumnDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    // Drop at the end of the column
    onDrop(columnId, e, cards.length)
    setDragOverIndex(null)
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
        className={`flex-1 space-y-3 p-2 rounded-lg border-2 border-dashed transition-all duration-200 min-h-40 ${
          draggedCardId ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
        onDragOver={onDragOver}
        onDrop={handleColumnDrop}
        onDragLeave={() => setDragOverIndex(null)}
      >
        {cards.map((card, index) => (
          <div key={card.id}>
            {dragOverIndex === index && draggedCardId && (
              <div className="h-2 bg-primary rounded-full mb-2 opacity-50" />
            )}
            <div
              onDragOver={(e) => handleCardDragOver(e, index)}
              onDrop={(e) => handleCardDrop(e, index)}
            >
              <KanbanCard
                card={card}
                index={index}
                onEdit={onEditCard}
                onUpdateCard={onUpdateCard}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggedCardId === card.id}
              />
            </div>
          </div>
        ))}
        
        {dragOverIndex === cards.length && draggedCardId && (
          <div className="h-2 bg-primary rounded-full opacity-50" />
        )}

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