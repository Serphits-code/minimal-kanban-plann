import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useBoards, useTags, useCards } from '@/hooks/useKanban'
import { useTheme } from '@/hooks/useTheme'
import { BoardSelector } from '@/components/kanban/BoardSelector'
import { CreateBoardDialog } from '@/components/kanban/CreateBoardDialog'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CardEditor } from '@/components/kanban/CardEditor'
import { Planner } from '@/components/planner/Planner'
import { Card as CardType } from '@/types/kanban'
import { Calendar, Kanban, Moon, Sun } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

type ViewMode = 'kanban' | 'planner'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { boards, activeBoard, setActiveBoard, createBoard, deleteBoard, addColumn, updateColumn, deleteColumn, reorderColumns } = useBoards()
  const { tags, createTag } = useTags()
  // Get board-specific functions and all cards
  const { cards: boardCards, getAllCards, createCard, updateCard, deleteCard, deleteAllCardsFromBoard, moveCard, reorderCard } = useCards(activeBoard)
  const allCards = getAllCards()
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  const handleCreateBoard = (name: string) => {
    createBoard(name)
    toast.success('Quadro criado com sucesso!')
  }

  const handleDeleteBoard = (boardId: string) => {
    // Delete all cards from the board first
    deleteAllCardsFromBoard(boardId)
    // Then delete the board
    deleteBoard(boardId)
    toast.success('Quadro excluído com sucesso!')
  }

  const handleEditCard = (card: CardType) => {
    setSelectedCard(card)
    setIsCardEditorOpen(true)
  }

  // Always get the fresh card data from the store when the dialog is open
  const currentSelectedCard = selectedCard && isCardEditorOpen ? 
    allCards.find(c => c.id === selectedCard.id) || selectedCard : 
    selectedCard

  const handleSaveCard = (card: CardType) => {
    updateCard(card.id, {
      title: card.title,
      description: card.description,
      tags: card.tags,
      checklist: card.checklist,
      attachments: card.attachments,
      dueDate: card.dueDate,
      scheduledDate: card.scheduledDate,
      scheduledTime: card.scheduledTime,
      duration: card.duration,
      completed: card.completed
    })
    
    // Close the dialog and clear selected card
    setIsCardEditorOpen(false)
    setSelectedCard(null)
    
    toast.success('Card atualizado!')
  }

  const handleDeleteCard = (cardId: string) => {
    deleteCard(cardId)
    toast.success('Card excluído!')
  }

  const handleScheduleCard = (cardId: string, date: string, time: string) => {
    updateCard(cardId, { scheduledDate: date, scheduledTime: time })
    toast.success(date && time ? 'Card agendado!' : 'Card desagendado!')
  }

  const handleUpdateCardDuration = (cardId: string, duration: number) => {
    updateCard(cardId, { duration })
    toast.success(`Duração alterada para ${duration}h`)
  }

  const handleToggleCardCompletion = (cardId: string, completed: boolean) => {
    updateCard(cardId, { completed })
    toast.success(completed ? 'Tarefa marcada como concluída!' : 'Tarefa marcada como pendente!')
  }



  const activeBoardData = boards.find(board => board.id === activeBoard)
  
  // Get columns for the active board (with fallback to default columns for old boards)
  const boardColumns = activeBoardData?.columns || [
    { id: 'todo', name: 'A Fazer', order: 0 },
    { id: 'progress', name: 'Em Progresso', order: 1 },
    { id: 'done', name: 'Concluído', order: 2 }
  ]

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Kanban Pro</h1>
            {activeBoardData && (
              <span className="text-lg font-medium text-muted-foreground">
                / {activeBoardData.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun size={16} className="text-muted-foreground" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
              <Moon size={16} className="text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="gap-2"
              >
                <Kanban size={16} />
                Quadro
              </Button>
              <Button
                variant={viewMode === 'planner' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('planner')}
                className="gap-2"
              >
                <Calendar size={16} />
                Planejador
              </Button>
            </div>
            <BoardSelector
              boards={boards}
              activeBoard={activeBoard}
              onBoardChange={setActiveBoard}
              onDeleteBoard={handleDeleteBoard}
            />
            <CreateBoardDialog onCreateBoard={handleCreateBoard} />
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'kanban' ? (
          <KanbanBoard 
            boardId={activeBoard}
            cards={allCards.filter(card => card.boardId === activeBoard)}
            columns={boardColumns}
            onCreateCard={createCard}
            onMoveCard={moveCard}
            onUpdateCard={updateCard}
            onEditCard={handleEditCard}
            onToggleCardCompletion={handleToggleCardCompletion}
            onAddColumn={(name) => addColumn(activeBoard, name)}
            onUpdateColumn={(columnId, updates) => updateColumn(activeBoard, columnId, updates)}
            onDeleteColumn={(columnId) => deleteColumn(activeBoard, columnId)}
            onReorderColumns={(sourceIndex, destinationIndex) => reorderColumns(activeBoard, sourceIndex, destinationIndex)}
            onReorderCard={reorderCard}
          />
        ) : (
          <div className="h-full overflow-hidden">
            <Planner
              cards={allCards}
              onScheduleCard={handleScheduleCard}
              onEditCard={handleEditCard}
              onUpdateCardDuration={handleUpdateCardDuration}
            />
          </div>
        )}
      </div>

      <CardEditor
        card={currentSelectedCard}
        isOpen={isCardEditorOpen}
        onClose={() => {
          setIsCardEditorOpen(false)
          setSelectedCard(null)
        }}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        availableTags={tags}
        onCreateTag={createTag}
      />

      <Toaster />
    </div>
  )
}

export default App