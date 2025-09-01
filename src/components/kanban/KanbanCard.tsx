import React from 'react'
import { Card as CardType, ChecklistItem } from '@/types/kanban'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock, Paperclip, Image } from '@phosphor-icons/react'
import { format } from 'date-fns'

interface KanbanCardProps {
  card: CardType
  index: number
  onEdit: (card: CardType) => void
  onDragStart: (card: CardType, event: React.DragEvent<HTMLElement>, index: number) => void
  onDragEnd: (event: React.DragEvent<HTMLElement>) => void
  isDragging: boolean
  onUpdateCard: (cardId: string, updates: Partial<CardType>) => void
}

export function KanbanCard({ card, index, onEdit, onDragStart, onDragEnd, isDragging, onUpdateCard }: KanbanCardProps) {
  const completedItems = card.checklist.filter(item => item.completed).length
  const totalItems = card.checklist.length
  const imageAttachments = card.attachments?.filter(att => att.type.startsWith('image/')) || []
  const otherAttachments = card.attachments?.filter(att => !att.type.startsWith('image/')) || []

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
      <div>
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <h3 className="font-medium text-sm leading-tight">{card.title}</h3>
            
            {card.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {card.description}
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
          </div>
        </CardContent>
      </div>
    </Card>
  )
}