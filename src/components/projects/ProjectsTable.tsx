import React, { useState } from 'react'
import { Card as CardType, ProjectGroup, Employee, Priority, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG, Column, getColumnStatusColor } from '@/types/kanban'
import { ProjectTaskRow } from './ProjectTaskRow'
import { TaskSidebar } from './TaskSidebar'
import { Plus, CaretDown, CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProjectsTableProps {
  boardId: string
  cards: CardType[]
  groups: ProjectGroup[]
  columns?: Column[]
  employees: Employee[]
  onCreateCard: (title: string, column: string, groupId?: string) => void
  onUpdateCard: (cardId: string, updates: Partial<CardType>) => void
  onDeleteCard: (cardId: string) => void
  onMoveCardToGroup: (cardId: string, groupId: string) => void
  onCreateGroup: (name: string) => void
  onUpdateGroup: (groupId: string, updates: Partial<ProjectGroup>) => void
  onDeleteGroup: (groupId: string) => void
  onCreateEmployee: (data: Partial<Employee>) => Promise<Employee>
  getEmployeeById: (id: string | undefined) => Employee | undefined
}

export function ProjectsTable({
  boardId,
  cards,
  groups,
  columns = [],
  employees,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCardToGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateEmployee,
  getEmployeeById,
}: ProjectsTableProps) {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)
  const useColumns = sortedColumns.length > 0

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(useColumns ? sortedColumns.map(c => c.id) : groups.map(g => g.id))
  )
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({})
  const [newGroupName, setNewGroupName] = useState('')
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleAddTask = (groupId: string) => {
    const title = newTaskInputs[groupId]?.trim()
    if (!title) return
    
    if (useColumns) {
      // When using columns, create card in the target column
      onCreateCard(title, groupId)
    } else {
      onCreateCard(title, 'todo', groupId)
    }
    setNewTaskInputs(prev => ({ ...prev, [groupId]: '' }))
  }

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card)
    setIsSidebarOpen(true)
  }

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return
    onCreateGroup(newGroupName.trim())
    setNewGroupName('')
    setIsAddingGroup(false)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, card: CardType) => {
    setDraggedCard(card)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverGroup(groupId)
  }

  const handleDragLeave = () => {
    setDragOverGroup(null)
  }

  const handleDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    if (draggedCard) {
      if (useColumns) {
        // When using columns, moving between groups = changing column
        if (draggedCard.column !== groupId) {
          onUpdateCard(draggedCard.id, { column: groupId })
        }
      } else {
        if (draggedCard.groupId !== groupId) {
          onMoveCardToGroup(draggedCard.id, groupId)
        }
      }
    }
    setDraggedCard(null)
    setDragOverGroup(null)
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
    setDragOverGroup(null)
  }

  // Group cards by column or groupId
  const getCardsForGroup = (groupId: string) => {
    if (useColumns) {
      return cards.filter(card => card.column === groupId)
    }
    return cards.filter(card => card.groupId === groupId)
  }

  // Cards without a group/column
  const ungroupedCards = useColumns
    ? cards.filter(card => !sortedColumns.some(c => c.id === card.column))
    : cards.filter(card => !card.groupId)

  // Build the list of renderable groups
  const renderGroups = useColumns
    ? sortedColumns.map((col, index) => ({
        id: col.id,
        name: col.name,
        color: getColumnStatusColor(index),
      }))
    : groups.map(g => ({
        id: g.id,
        name: g.name,
        color: g.color,
      }))

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-6">
        {/* Render each group */}
        {renderGroups.map((group) => {
          const groupCards = getCardsForGroup(group.id)
          const isExpanded = expandedGroups.has(group.id)
          const isDragOver = dragOverGroup === group.id

          return (
            <div 
              key={group.id} 
              className={`bg-card rounded-lg border ${isDragOver ? 'ring-2 ring-primary' : ''}`}
              onDragOver={(e) => handleDragOver(e, group.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id)}
            >
              {/* Group Header */}
              <div 
                className="flex items-center gap-2 p-4 cursor-pointer select-none"
                onClick={() => toggleGroup(group.id)}
              >
                <button className="text-muted-foreground hover:text-foreground">
                  {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                </button>
                <h3 
                  className="font-semibold text-lg"
                  style={{ color: group.color }}
                >
                  {group.name}
                </h3>
                <span className="text-muted-foreground text-sm">
                  ({groupCards.length})
                </span>
              </div>

              {/* Group Content */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="min-w-[200px]">Tarefa</TableHead>
                        <TableHead className="w-[120px]">ResponsÃ¡vel</TableHead>
                        <TableHead className="w-[140px]">Status</TableHead>
                        <TableHead className="w-[160px]">Período</TableHead>
                        <TableHead className="w-[100px]">Prioridade</TableHead>
                        <TableHead className="w-[100px]">Arquivos</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupCards.map((card) => (
                        <ProjectTaskRow
                          key={card.id}
                          card={card}
                          employees={employees}
                          columns={sortedColumns}
                          getEmployeeById={getEmployeeById}
                          onUpdate={(updates) => onUpdateCard(card.id, updates)}
                          onDelete={() => onDeleteCard(card.id)}
                          onClick={() => handleCardClick(card)}
                          onDragStart={(e) => handleDragStart(e, card)}
                          onDragEnd={handleDragEnd}
                          onCreateEmployee={onCreateEmployee}
                        />
                      ))}
                      
                      {/* Add task row */}
                      <TableRow>
                        <td colSpan={8} className="p-2">
                          <div className="flex items-center gap-2">
                            <Plus size={16} className="text-muted-foreground" />
                            <Input
                              placeholder="+ Adicionar tarefa"
                              value={newTaskInputs[group.id] || ''}
                              onChange={(e) => setNewTaskInputs(prev => ({ 
                                ...prev, 
                                [group.id]: e.target.value 
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTask(group.id)
                                }
                              }}
                              className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
                            />
                          </div>
                        </td>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )
        })}

        {/* Ungrouped cards (if any) */}
        {ungroupedCards.length > 0 && (
          <div className="bg-card rounded-lg border">
            <div className="flex items-center gap-2 p-4">
              <h3 className="font-semibold text-lg text-muted-foreground">
                Sem grupo
              </h3>
              <span className="text-muted-foreground text-sm">
                ({ungroupedCards.length})
              </span>
            </div>
            <div className="px-4 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="min-w-[200px]">Tarefa</TableHead>
                    <TableHead className="w-[120px]">ResponsÃ¡vel</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[160px]">Período</TableHead>
                    <TableHead className="w-[100px]">Prioridade</TableHead>
                    <TableHead className="w-[100px]">Arquivos</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ungroupedCards.map((card) => (
                    <ProjectTaskRow
                      key={card.id}
                      card={card}
                      employees={employees}
                      columns={sortedColumns}
                      getEmployeeById={getEmployeeById}
                      onUpdate={(updates) => onUpdateCard(card.id, updates)}
                      onDelete={() => onDeleteCard(card.id)}
                      onClick={() => handleCardClick(card)}
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragEnd={handleDragEnd}
                      onCreateEmployee={onCreateEmployee}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Add new group button */}
        {isAddingGroup ? (
          <div className="flex items-center gap-2 p-4 bg-card rounded-lg border">
            <Input
              placeholder="Nome do grupo..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGroup()
                if (e.key === 'Escape') {
                  setIsAddingGroup(false)
                  setNewGroupName('')
                }
              }}
              autoFocus
              className="max-w-xs"
            />
            <Button size="sm" onClick={handleAddGroup}>
              Adicionar
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setIsAddingGroup(false)
                setNewGroupName('')
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsAddingGroup(true)}
          >
            <Plus size={16} />
            Adicionar novo grupo
          </Button>
        )}
      </div>

      {/* Task Sidebar */}
      <TaskSidebar
        card={selectedCard}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false)
          setSelectedCard(null)
        }}
        onUpdate={(updates) => {
          if (selectedCard) {
            onUpdateCard(selectedCard.id, updates)
            setSelectedCard(prev => prev ? { ...prev, ...updates } : prev)
          }
        }}
        employees={employees}
        columns={sortedColumns}
        getEmployeeById={getEmployeeById}
      />
    </div>
  )
}

