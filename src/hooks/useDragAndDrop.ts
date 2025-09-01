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
    
    // Add ghost image styling
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (event: React.DragEvent<HTMLElement>) => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      draggedFrom: null,
      draggedIndex: null
    })
    
    // Reset opacity
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (targetColumn: string, event: React.DragEvent<HTMLElement>, targetIndex?: number) => {
    event.preventDefault()
    event.stopPropagation()
    
    // Get the dragged card from state
    if (!dragState.draggedCard) {
      return
    }
    
    const cardId = dragState.draggedCard.id
    const sourceColumn = dragState.draggedCard.column
    const sourceIndex = dragState.draggedIndex
    
    let newIndex = targetIndex
    
    // If no specific target index provided, determine it from drop position
    if (newIndex === undefined) {
      const dropZone = event.currentTarget as HTMLElement
      // Look for card elements more broadly
      const cardElements = Array.from(dropZone.querySelectorAll('[data-card-id]'))
      
      newIndex = cardElements.length
      
      // Find insertion point based on mouse Y position
      for (let i = 0; i < cardElements.length; i++) {
        const cardElement = cardElements[i] as HTMLElement
        const rect = cardElement.getBoundingClientRect()
        const cardMiddle = rect.top + rect.height / 2
        
        if (event.clientY < cardMiddle) {
          newIndex = i
          break
        }
      }
    }
    
    // Adjust index if moving within same column
    if (sourceColumn === targetColumn && sourceIndex !== null && sourceIndex < newIndex) {
      newIndex = Math.max(0, newIndex - 1)
    }
    
    // Always call the move function to trigger state update
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