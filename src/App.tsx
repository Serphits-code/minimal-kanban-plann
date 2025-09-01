import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBoards, useCards, useTags } from '@/hooks/useKanban'
import { BoardSelector } from '@/components/kanban/BoardSelector'
import { CreateBoardDialog } from '@/components/kanban/CreateBoardDialog'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CardEditor } from '@/components/kanban/CardEditor'
import { Planner } from '@/components/planner/Planner'
import { Card as CardType } from '@/types/kanban'
import { Kanban, Calendar } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function App() {
  const { boards, activeBoard, setActiveBoard, createBoard } = useBoards()
  const { cards, updateCard, deleteCard, scheduleCard } = useCards(activeBoard)
  const { tags, createTag } = useTags()
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('kanban')

  const handleCreateBoard = (name: string) => {
    createBoard(name)
    toast.success('Quadro criado com sucesso!')
  }

  const handleEditCard = (card: CardType) => {
    setSelectedCard(card)
    setIsCardEditorOpen(true)
  }

  const handleSaveCard = (card: CardType) => {
    updateCard(card.id, card)
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
            <BoardSelector
              boards={boards}
              activeBoard={activeBoard}
              onBoardChange={setActiveBoard}
            />
            <CreateBoardDialog onCreateBoard={handleCreateBoard} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-6 py-2">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="kanban" className="gap-2">
                <Kanban size={16} />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="planner" className="gap-2">
                <Calendar size={16} />
                Planejador
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kanban" className="flex-1 m-0">
            <KanbanBoard 
              boardId={activeBoard}
              onEditCard={handleEditCard}
            />
          </TabsContent>

          <TabsContent value="planner" className="flex-1 m-0">
            <Planner
              cards={cards}
              onScheduleCard={handleScheduleCard}
              onEditCard={handleEditCard}
            />
          </TabsContent>
        </Tabs>
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