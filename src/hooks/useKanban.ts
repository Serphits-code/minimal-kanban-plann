import { useKV } from '@github/spark/hooks'
import { Board, Card, Tag } from '@/types/kanban'

export function useBoards() {
  const [boards, setBoards] = useKV<Board[]>('kanban-boards', [])
  const [activeBoard, setActiveBoard] = useKV<string>('active-board', '')

  const createBoard = (name: string) => {
    const newBoard: Board = {
      id: crypto.randomUUID(),
      name,
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

  return {
    boards,
    activeBoard,
    setActiveBoard,
    createBoard,
    deleteBoard,
    updateBoard
  }
}

export function useCards(boardId: string) {
  const [cards, setCards] = useKV<Card[]>('kanban-cards', [])
  
  const boardCards = cards.filter(card => card.boardId === boardId)

  // Function to get all cards across all boards (for planner)
  const getAllCards = () => cards

  const createCard = (columnId: 'todo' | 'progress' | 'done', title: string) => {
    const newCard: Card = {
      id: crypto.randomUUID(),
      title,
      description: '',
      tags: [],
      checklist: [],
      column: columnId,
      boardId,
      createdAt: new Date().toISOString()
    }
    
    setCards(current => [...current, newCard])
    return newCard
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

  const moveCard = (cardId: string, newColumn: 'todo' | 'progress' | 'done') => {
    updateCard(cardId, { column: newColumn })
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