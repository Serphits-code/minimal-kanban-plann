import { useKV } from '@github/spark/hooks'
import { Board, Card, Tag, Column } from '@/types/kanban'

export function useBoards() {
  const [boards, setBoards] = useKV<Board[]>('kanban-boards', [])
  const [activeBoard, setActiveBoard] = useKV<string>('active-board', '')

  // Migrate old boards without columns
  const migratedBoards = boards.map(board => {
    if (!board.columns || board.columns.length === 0) {
      return {
        ...board,
        columns: [
          { id: 'todo', name: 'A Fazer', order: 0 },
          { id: 'progress', name: 'Em Progresso', order: 1 },
          { id: 'done', name: 'Concluído', order: 2 }
        ]
      }
    }
    return board
  })

  // Update boards if migration occurred
  if (JSON.stringify(migratedBoards) !== JSON.stringify(boards)) {
    setBoards(migratedBoards)
  }

  const createBoard = (name: string) => {
    const defaultColumns: Column[] = [
      { id: 'todo', name: 'A Fazer', order: 0 },
      { id: 'progress', name: 'Em Progresso', order: 1 },
      { id: 'done', name: 'Concluído', order: 2 }
    ]

    const newBoard: Board = {
      id: crypto.randomUUID(),
      name,
      columns: defaultColumns,
      createdAt: new Date().toISOString()
    }
    
    setBoards(current => [...current, newBoard])
    setActiveBoard(newBoard.id)
    return newBoard
  }

  const deleteBoard = (boardId: string) => {
    setBoards(current => current.filter(board => board.id !== boardId))
    if (activeBoard === boardId) {
      setActiveBoard('')
    }
  }

  const updateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoards(current => 
      current.map(board => 
        board.id === boardId ? { ...board, ...updates } : board
      )
    )
  }

  const addColumn = (boardId: string, name: string) => {
    setBoards(current => 
      current.map(board => {
        if (board.id === boardId) {
          const newColumn: Column = {
            id: crypto.randomUUID(),
            name,
            order: board.columns.length
          }
          return { ...board, columns: [...board.columns, newColumn] }
        }
        return board
      })
    )
  }

  const updateColumn = (boardId: string, columnId: string, updates: Partial<Column>) => {
    setBoards(current => 
      current.map(board => {
        if (board.id === boardId) {
          return {
            ...board,
            columns: board.columns.map(col => 
              col.id === columnId ? { ...col, ...updates } : col
            )
          }
        }
        return board
      })
    )
  }

  const deleteColumn = (boardId: string, columnId: string) => {
    setBoards(current => 
      current.map(board => {
        if (board.id === boardId) {
          return {
            ...board,
            columns: board.columns.filter(col => col.id !== columnId)
          }
        }
        return board
      })
    )
  }

  const reorderColumns = (boardId: string, sourceIndex: number, destinationIndex: number) => {
    setBoards(current => 
      current.map(board => {
        if (board.id === boardId) {
          const newColumns = [...board.columns]
          const [removed] = newColumns.splice(sourceIndex, 1)
          newColumns.splice(destinationIndex, 0, removed)
          
          // Update order values
          const reorderedColumns = newColumns.map((col, index) => ({
            ...col,
            order: index
          }))
          
          return { ...board, columns: reorderedColumns }
        }
        return board
      })
    )
  }

  return {
    boards: migratedBoards,
    activeBoard,
    setActiveBoard,
    createBoard,
    deleteBoard,
    updateBoard,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns
  }
}

export function useCards(boardId: string) {
  const [cards, setCards] = useKV<Card[]>('kanban-cards', [])
  
  // Migrate cards without order property
  const migratedCards = cards.map((card, index) => {
    if (card.order === undefined) {
      return { ...card, order: index }
    }
    return card
  })

  // Update cards if migration occurred
  if (JSON.stringify(migratedCards) !== JSON.stringify(cards)) {
    setCards(migratedCards)
  }
  
  const boardCards = migratedCards.filter(card => card.boardId === boardId)

  // Function to get all cards across all boards (for planner)
  const getAllCards = () => migratedCards

  const createCard = (columnId: string, title: string) => {
    setCards(current => {
      const columnCards = current.filter(card => card.boardId === boardId && card.column === columnId)
      const maxOrder = columnCards.length > 0 ? Math.max(...columnCards.map(c => c.order)) : -1

      const newCard: Card = {
        id: crypto.randomUUID(),
        title,
        description: '',
        tags: [],
        checklist: [],
        column: columnId,
        boardId,
        order: maxOrder + 1,
        createdAt: new Date().toISOString()
      }
      
      return [...current, newCard]
    })
  }

  const updateCard = (cardId: string, updates: Partial<Card>) => {
    setCards(current =>
      current.map(card =>
        card.id === cardId ? { ...card, ...updates } : card
      )
    )
  }

  const deleteCard = (cardId: string) => {
    setCards(current => current.filter(card => card.id !== cardId))
  }

  const moveCard = (cardId: string, newColumn: string, newOrder?: number) => {
    console.log('moveCard called:', { cardId, newColumn, newOrder })
    
    setCards(current => {
      const cardIndex = current.findIndex(c => c.id === cardId)
      if (cardIndex === -1) {
        console.log('Card not found:', cardId)
        return current
      }

      const card = current[cardIndex]
      const oldColumn = card.column

      console.log('Moving card from', oldColumn, 'to', newColumn)

      // Create a new array without the card we're moving
      const otherCards = current.filter(c => c.id !== cardId)
      
      // Get all cards in the target column (sorted by order)
      const targetColumnCards = otherCards.filter(c => 
        c.boardId === boardId && c.column === newColumn
      ).sort((a, b) => a.order - b.order)

      // Determine insertion position
      let insertIndex = targetColumnCards.length
      if (newOrder !== undefined) {
        insertIndex = Math.max(0, Math.min(newOrder, targetColumnCards.length))
      }

      console.log('Target column has', targetColumnCards.length, 'cards, inserting at index', insertIndex)

      // Create updated card
      const updatedCard = { ...card, column: newColumn }
      
      // Insert the card at the correct position
      targetColumnCards.splice(insertIndex, 0, updatedCard)
      
      // Update orders for all cards in target column
      const reorderedTargetCards = targetColumnCards.map((c, index) => ({
        ...c,
        order: index
      }))

      // If we moved from a different column, reorder the source column
      let reorderedSourceCards: Card[] = []
      if (oldColumn !== newColumn) {
        const sourceColumnCards = otherCards.filter(c => 
          c.boardId === boardId && c.column === oldColumn
        ).sort((a, b) => a.order - b.order)
        
        reorderedSourceCards = sourceColumnCards.map((c, index) => ({
          ...c,
          order: index
        }))
      }

      // Keep all other cards unchanged
      const unchangedCards = otherCards.filter(c => 
        c.boardId !== boardId || (c.column !== newColumn && c.column !== oldColumn)
      )

      const result = [
        ...unchangedCards,
        ...reorderedTargetCards,
        ...reorderedSourceCards
      ]

      console.log('Updated cards count:', result.length)
      return result
    })
  }

  const reorderCard = (cardId: string, newOrder: number) => {
    setCards(current => {
      const card = current.find(c => c.id === cardId)
      if (!card) return current

      const sameColumnCards = current.filter(c => 
        c.boardId === boardId && c.column === card.column && c.id !== cardId
      ).sort((a, b) => a.order - b.order)

      // Insert at new position
      sameColumnCards.splice(newOrder, 0, card)
      
      // Reorder all cards in the column
      const reorderedCards = sameColumnCards.map((c, index) => ({
        ...c,
        order: index
      }))

      return [
        ...current.filter(c => !(c.boardId === boardId && c.column === card.column)),
        ...reorderedCards
      ]
    })
  }

  const scheduleCard = (cardId: string, date: string, time: string) => {
    updateCard(cardId, { scheduledDate: date, scheduledTime: time })
  }

  return {
    cards: boardCards,
    getAllCards,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
    scheduleCard
  }
}

export function useTags() {
  const [tags, setTags] = useKV<Tag[]>('kanban-tags', [])

  const createTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color
    }
    
    setTags(current => [...current, newTag])
    return newTag
  }

  const deleteTag = (tagId: string) => {
    setTags(current => current.filter(tag => tag.id !== tagId))
  }

  return {
    tags,
    createTag,
    deleteTag
  }
}