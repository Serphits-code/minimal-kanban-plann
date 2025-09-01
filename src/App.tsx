import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useBoards, useCards, useTags } from '@/hooks/useKanban'
import { BoardSelector } from '@/components/kanban/BoardSelector'
import { CreateBoardDialog } from '@/components/kanban/CreateBoardDialog'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CardEditor } from '@/components/kanban/CardEditor'
import { Planner } from '@/components/planner/Planner'
import { Card as CardType } from '@/types/kanban'
import { Calendar, Kanban } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

type ViewMode = 'kanban' | 'planner'

function App() {
  const { boards, activeBoard, setActiveBoard, createBoard } = useBoards()
  const { cards, updateCard, deleteCard, scheduleCard } = useCards(activeBoard)
  const { tags, createTag } = useTags()
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  const handleCreateBoard = (name: string) => {
    createBoard(name)
    toast.success('Quadro criado com sucesso!')
  }

  const handleEditCard = (card: CardType) => {
    setSelectedCard(card)
    setIsCardEditorOpen(true)
  }

  // Always get the fresh card data from the store
  const currentSelectedCard = selectedCard ? cards.find(c => c.id === selectedCard.id) || selectedCard : null

  const handleSaveCard = (card: CardType) => {
    updateCard(card.id, {
      title: card.title,
      description: card.description,
      tags: card.tags,
      checklist: card.checklist,
      dueDate: card.dueDate,
      scheduledDate: card.scheduledDate,
      scheduledTime: card.scheduledTime
    })
    setSelectedCard(null)
    setIsCardEditorOpen(false)
    toast.success('Card atualizado!')
  }

  const handleDeleteCard = (cardId: string) => {
    deleteCard(cardId)
    toast.success('Card excluído!')
  }

  const handleScheduleCard = (cardId: string, date: string, time: string) => {
    scheduleCard(cardId, date, time)
    toast.success('Card agendado!')
  }

  const activeBoardData = boards.find(board => board.id === activeBoard)

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
            />
            <CreateBoardDialog onCreateBoard={handleCreateBoard} />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <KanbanBoard 
            boardId={activeBoard}
            onEditCard={handleEditCard}
          />
        ) : (
          <Planner
            cards={cards}
            onScheduleCard={handleScheduleCard}
            onEditCard={handleEditCard}
          />
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