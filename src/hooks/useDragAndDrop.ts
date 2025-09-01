import React, { useState, useRef } from 'react'
import { Card as CardType } from '@/types/kanban'

interface DragState {
  isDragging: boolean
  draggedCard: CardType | null
  dragOffset: { x: number; y: number }
}

export function useDragAndDrop(onCardMove: (cardId: string, newColumn: string, newOrder?: number) => void) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedCard: null,
    dragOffset: { x: 0, y: 0 }
  })
  
  const dragRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (card: CardType, event: React.DragEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    
    setDragState({
      isDragging: true,
      draggedCard: card,
      dragOffset: { x: offsetX, y: offsetY }
    })
    
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('cardId', card.id)
    event.dataTransfer.setData('sourceColumn', card.column)
  }

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      dragOffset: { x: 0, y: 0 }
    })
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (column: string, event: React.DragEvent) => {
    event.preventDefault()
    const cardId = event.dataTransfer.getData('cardId')
    const sourceColumn = event.dataTransfer.getData('sourceColumn')
    
    if (cardId && cardId !== '') {
      // Calculate drop position for reordering
      const dropTarget = event.currentTarget as HTMLElement
      const cards = Array.from(dropTarget.children).filter(child => 
        child.querySelector('[data-card-id]')
      )
      
      let dropIndex = cards.length
      
      // Find the insertion point based on mouse position
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement
        const rect = card.getBoundingClientRect()
        const cardCenter = rect.top + rect.height / 2
        
        if (event.clientY < cardCenter) {
          dropIndex = i
          break
        }
      }
      
      // If moving within the same column, adjust for the dragged card removal
      if (sourceColumn === column && dragState.draggedCard) {
        const draggedIndex = cards.findIndex(card => 
          card.querySelector(`[data-card-id="${dragState.draggedCard?.id}"]`)
        )
        if (draggedIndex !== -1 && draggedIndex < dropIndex) {
          dropIndex--
        }
      }
      
      onCardMove(cardId, column, dropIndex)
    }
    handleDragEnd()
  }

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    dragRef
  }
}