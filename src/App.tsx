import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useBoards, useCards, useTags } from '@/hooks/useKanban'
import { BoardSelector } from '@/components/kanban/BoardSelector'
import { CreateBoardDialog } from '@/components/kanban/CreateBoardDialog'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CardEditor } from '@/components/kanban/CardEditor'
import { Planner } from '@/components/planner/Planner'
import { Card as CardType } from '@/types/kanban'
import { Calendar, X } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function App() {
  const { boards, activeBoard, setActiveBoard, createBoard } = useBoards()
  const { cards, updateCard, deleteCard, scheduleCard } = useCards(activeBoard)
  const { tags, createTag } = useTags()
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)

  const handleCreateBoard = (name: string) => {
    createBoard(name)
    toast.success('Quadro criado com sucesso!')
  }

  const handleEditCard = (card: CardType) => {
    setSelectedCard(card)
    setIsCardEditorOpen(true)
  }

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
            <Button
              variant={isPlannerOpen ? "default" : "outline"}
              onClick={() => setIsPlannerOpen(!isPlannerOpen)}
              className="gap-2"
            >
              <Calendar size={16} />
              Planejador
            </Button>
            <BoardSelector
              boards={boards}
              activeBoard={activeBoard}
              onBoardChange={setActiveBoard}
            />
            <CreateBoardDialog onCreateBoard={handleCreateBoard} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`transition-all duration-300 ease-in-out ${isPlannerOpen ? 'flex-1' : 'w-full'}`}>
          <KanbanBoard 
            boardId={activeBoard}
            onEditCard={handleEditCard}
          />
        </div>

        <div className={`transition-all duration-300 ease-in-out border-l bg-card flex flex-col shadow-lg ${
          isPlannerOpen ? 'w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}>
          {isPlannerOpen && (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <h2 className="font-semibold flex items-center gap-2">
                  <Calendar size={18} />
                  Planejador
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlannerOpen(false)}
                  className="hover:bg-background"
                >
                  <X size={16} />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Planner
                  cards={cards}
                  onScheduleCard={handleScheduleCard}
                  onEditCard={handleEditCard}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <CardEditor
        card={selectedCard}
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