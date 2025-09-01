import React, { useState, useRef } from 'react'
import { Card as CardType } from '@/types/kanban'

interface DragState {
  isDragging: boolean
  draggedCard: CardType | null
  dragOffset: { x: number; y: number }
}

export function useDragAndDrop(onCardMove: (cardId: string, newColumn: 'todo' | 'progress' | 'done') => void) {
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
    event.dataTransfer.setData('text/plain', card.id)
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

  const handleDrop = (column: 'todo' | 'progress' | 'done', event: React.DragEvent) => {
    event.preventDefault()
    const cardId = event.dataTransfer.getData('text/plain')
    if (cardId && cardId !== '') {
      onCardMove(cardId, column)
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