import React from 'react'
import { Card as CardType, ChecklistItem, PRIORITY_CONFIG, STATUS_CONFIG, Employee } from '@/types/kanban'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar, Clock, Paperclip, Image, User, Flag, Circle } from '@phosphor-icons/react'
import { format } from 'date-fns'

interface KanbanCardProps {
  card: CardType
  index: number
  onEdit: (card: CardType) => void
  onDragStart: (card: CardType, event: React.DragEvent<HTMLElement>, index: number) => void
  onDragEnd: (event: React.DragEvent<HTMLElement>) => void
  isDragging: boolean
  onUpdateCard: (cardId: string, updates: Partial<CardType>) => void
  onToggleCardCompletion: (cardId: string, completed: boolean) => void
  employees?: Employee[]
}

export function KanbanCard({ 
  card, 
  index, 
  onEdit, 
  onDragStart, 
  onDragEnd, 
  isDragging, 
  onUpdateCard, 
  onToggleCardCompletion,
  employees = []
}: KanbanCardProps) {
  const completedItems = card.checklist.filter(item => item.completed).length
  const totalItems = card.checklist.length
  const imageAttachments = card.attachments?.filter(att => att.type.startsWith('image/')) || []
  const otherAttachments = card.attachments?.filter(att => !att.type.startsWith('image/')) || []

  // Resolve assignee from card.assignee or employees list
  const assignee = card.assignee || (card.assigneeId ? employees.find(e => e.id === card.assigneeId) : null)
  const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null
  const statusConfig = card.status ? STATUS_CONFIG[card.status] : null

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleChecklistChange = (itemId: string, completed: boolean) => {
    const updatedChecklist = card.checklist.map(item =>
      item.id === itemId ? { ...item, completed } : item
    )
    onUpdateCard(card.id, { checklist: updatedChecklist })
  }

  const handleClick = (e: React.MouseEvent) => {
    // Prevent triggering edit during drag operations or if clicking on interactive elements
    if (isDragging) {
      e.preventDefault()
      return
    }
    
    // Don't trigger if clicking on checkboxes or other interactive elements
    const target = e.target as HTMLElement
    if (target.closest('input[type="checkbox"]') || target.closest('button')) {
      return
    }
    
    // Stop propagation to prevent parent handlers
    e.stopPropagation()
    onEdit(card)
  }

  const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
    e.stopPropagation()
    onDragStart(card, e, index)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.stopPropagation()
    onDragEnd(e)
  }

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-card-id={card.id}
      className={`cursor-move transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      onClick={handleClick}
    >
      {/* Priority stripe */}
      {priorityConfig && card.priority !== 'medium' && (
        <div className="h-1 rounded-t-lg" style={{ backgroundColor: priorityConfig.color }} />
      )}
      <div>
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-medium text-sm leading-tight flex-1 ${card.completed ? 'line-through text-muted-foreground' : ''}`}>
                {card.title}
              </h3>
              <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={card.completed}
                  onCheckedChange={(checked) => onToggleCardCompletion(card.id, Boolean(checked))}
                  className="h-4 w-4"
                />
              </div>
            </div>
            
            {card.description && (
              <p className={`text-xs leading-tight ${card.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                {card.description.length > 60 ? card.description.substring(0, 60) + '...' : card.description}
              </p>
            )}

            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs px-2 py-0"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {totalItems > 0 && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{completedItems}/{totalItems} tarefas</span>
              </div>
              
              <div className="space-y-1">
                {card.checklist.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                      className="h-3 w-3"
                    />
                    <span className={`text-xs ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
                
                {totalItems > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{totalItems - 3} mais
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Priority & Status badges */}
          {(priorityConfig || (statusConfig && card.status !== 'not_started')) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {priorityConfig && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 gap-1"
                        style={{ backgroundColor: priorityConfig.color + '18', color: priorityConfig.color }}
                      >
                        <Flag size={10} weight="fill" />
                        {priorityConfig.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Prioridade: {priorityConfig.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {statusConfig && card.status !== 'not_started' && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 gap-1"
                        style={{ backgroundColor: statusConfig.color + '18', color: statusConfig.color }}
                      >
                        <Circle size={8} weight="fill" />
                        {statusConfig.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Status: {statusConfig.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {card.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(card.dueDate), 'dd/MM')}
                </div>
              )}
              
              {card.scheduledDate && card.scheduledTime && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {card.scheduledTime}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {otherAttachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip size={12} />
                  <span>{otherAttachments.length}</span>
                </div>
              )}
              
              {imageAttachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Image size={12} />
                  <span>{imageAttachments.length}</span>
                </div>
              )}

              {/* Assignee avatar */}
              {assignee && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-medium text-primary border border-primary/20 ml-1">
                        {assignee.avatar ? (
                          <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          getInitials(assignee.name)
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{assignee.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}