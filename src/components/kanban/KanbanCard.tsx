import React from 'react'
import { Card as CardType, ChecklistItem } from '@/types/kanban'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock } from '@phosphor-icons/react'
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

  const handleChecklistChange = (itemId: string, completed: boolean) => {
    const updatedChecklist = card.checklist.map(item =>
      item.id === itemId ? { ...item, completed } : item
    )
    onUpdateCard(card.id, { checklist: updatedChecklist })
  }

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(card, e, index)}
      onDragEnd={onDragEnd}
      data-card-id={card.id}
      className={`cursor-move transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div onClick={() => onEdit(card)} className="cursor-pointer">
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
        </CardContent>
      </div>
    </Card>
  )
}