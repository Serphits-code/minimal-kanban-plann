import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useApiBoards, useApiTags, useApiCards } from '@/hooks/useApiKanban'
import { useEmployees, useProjectGroups } from '@/hooks/useProjects'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { BoardSelector } from '@/components/kanban/BoardSelector'
import { CreateBoardDialog } from '@/components/kanban/CreateBoardDialog'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CardEditor } from '@/components/kanban/CardEditor'
import { Planner } from '@/components/planner/Planner'
import { ProjectsTable } from '@/components/projects/ProjectsTable'
import { GanttChart } from '@/components/gantt/GanttChart'
import { LoginPage } from '@/components/auth/LoginPage'
import { UserManagement } from '@/components/admin/UserManagement'
import { Card as CardType } from '@/types/kanban'
import { Calendar, Kanban, Moon, Sun, Table, ChartBar, Users, SignOut, SpinnerGap } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type ViewMode = 'kanban' | 'planner' | 'projects' | 'gantt' | 'users'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth()

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <SpinnerGap size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={login} />
        <Toaster />
      </>
    )
  }

  return <AuthenticatedApp user={user!} logout={logout} theme={theme} toggleTheme={toggleTheme} />
}

function AuthenticatedApp({ user, logout, theme, toggleTheme }: { user: any; logout: () => void; theme: string; toggleTheme: () => void }) {
  const { boards, activeBoard, setActiveBoard, createBoard, deleteBoard, addColumn, updateColumn, deleteColumn, reorderColumns } = useApiBoards()
  const { tags, createTag } = useApiTags()
  const { cards: boardCards, getAllCards, createCard, updateCard, deleteCard, deleteAllCardsFromBoard, moveCard, reorderCard } = useApiCards(activeBoard)
  const { employees, createEmployee, getEmployeeById } = useEmployees()
  const { groups, createGroup, updateGroup, deleteGroup } = useProjectGroups(activeBoard)
  const allCards = getAllCards()
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  const handleCreateTag = (name: string, color: string) => {
    // Wrapper síncrono para a função assíncrona
    createTag(name, color).catch(error => {
      toast.error('Erro ao criar tag: ' + error.message);
    });
    
    // Retorna tag temporária para manter compatibilidade
    return {
      id: crypto.randomUUID(),
      name,
      color
    };
  };

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
      completed: card.completed,
      boardId: card.boardId,
      column: card.column,
      order: card.order,
      assigneeId: card.assigneeId,
      priority: card.priority,
      status: card.status
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
    console.log('Scheduling card with date:', date);
    console.log('Date object:', new Date(date));
    console.log('Local date:', new Date().toLocaleDateString());
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
                variant={viewMode === 'projects' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('projects')}
                className="gap-2"
              >
                <Table size={16} />
                Projetos
              </Button>
              <Button
                variant={viewMode === 'gantt' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('gantt')}
                className="gap-2"
              >
                <ChartBar size={16} />
                Gantt
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
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-medium text-primary">
                    {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span className="hidden sm:inline text-sm">{user.name?.split(' ')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => setViewMode('users')}>
                    <Users size={14} className="mr-2" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <SignOut size={14} className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'users' ? (
          <UserManagement currentUserId={user.id} onBack={() => setViewMode('kanban')} />
        ) : viewMode === 'kanban' ? (
          <KanbanBoard 
            boardId={activeBoard}
            cards={allCards.filter(card => card.boardId === activeBoard)}
            columns={boardColumns}
            employees={employees}
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
        ) : viewMode === 'projects' ? (
          <ProjectsTable
            boardId={activeBoard}
            cards={allCards.filter(card => card.boardId === activeBoard)}
            groups={groups}
            columns={boardColumns}
            employees={employees}
            onCreateCard={(title, column, groupId) => createCard(title, column, groupId)}
            onUpdateCard={(cardId, updates) => updateCard(cardId, updates)}
            onDeleteCard={handleDeleteCard}
            onMoveCardToGroup={(cardId, groupId) => updateCard(cardId, { groupId })}
            onCreateGroup={(name) => createGroup(name)}
            onUpdateGroup={(groupId, updates) => updateGroup(groupId, updates)}
            onDeleteGroup={(groupId) => deleteGroup(groupId)}
            onCreateEmployee={createEmployee}
            getEmployeeById={getEmployeeById}
          />
        ) : viewMode === 'gantt' ? (
          <GanttChart
            cards={allCards.filter(card => card.boardId === activeBoard)}
            employees={employees}
            onEditCard={handleEditCard}
          />
        ) : (
          <div className="h-full overflow-hidden">
            <Planner
              cards={allCards}
              employees={employees}
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
        onCreateTag={handleCreateTag}
        employees={employees}
        columns={boardColumns}
      />

      <Toaster />
    </div>
  )
}

export default App