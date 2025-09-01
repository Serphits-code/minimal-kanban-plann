import { useState } from 'react'
import React from 'react'
import { Card as CardType } from '@/types/kanban'

interface DragState {
  isDragging: boolean
  draggedCard: CardType | null
  draggedFrom: string | null
  draggedIndex: number | null
}

export function useDragAndDrop(onCardMove: (cardId: string, newColumn: string, newOrder?: number) => void) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedCard: null,
    draggedFrom: null,
    draggedIndex: null
  })

  const handleDragStart = (card: CardType, event: React.DragEvent<HTMLElement>, cardIndex: number) => {
    // Prevent default to ensure we control the drag behavior
    event.dataTransfer.effectAllowed = 'move'
    
    setDragState({
      isDragging: true,
      draggedCard: card,
      draggedFrom: card.column,
      draggedIndex: cardIndex
    })
    
    // Set multiple formats for better compatibility
    event.dataTransfer.setData('text/plain', card.id)
    event.dataTransfer.setData('application/json', JSON.stringify({
      cardId: card.id,
      sourceColumn: card.column,
      sourceIndex: cardIndex
    }))
  }

  const handleDragEnd = (event: React.DragEvent<HTMLElement>) => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      draggedFrom: null,
      draggedIndex: null
    })
  }

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (targetColumn: string, event: React.DragEvent<HTMLElement>, targetIndex?: number) => {
    event.preventDefault()
    event.stopPropagation()
    
    // Get the dragged card from state - this is more reliable than dataTransfer
    if (!dragState.draggedCard) {
      return
    }
    
    const cardId = dragState.draggedCard.id
    const sourceColumn = dragState.draggedCard.column
    
    // Calculate the target index
    let newIndex = targetIndex
    
    // If moving within the same column, adjust for the removal
    if (sourceColumn === targetColumn && dragState.draggedIndex !== null && newIndex !== undefined && dragState.draggedIndex < newIndex) {
      newIndex = Math.max(0, newIndex - 1)
    }
    
    // Call the move function
    onCardMove(cardId, targetColumn, newIndex)
  }

  const handleCardDrop = (targetColumn: string, targetIndex: number, event: React.DragEvent<HTMLElement>) => {
    handleDrop(targetColumn, event, targetIndex)
  }

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleCardDrop
  }
}