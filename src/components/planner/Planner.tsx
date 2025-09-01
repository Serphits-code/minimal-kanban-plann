import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card as CardType } from '@/types/kanban'
import { format, startOfDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock } from '@phosphor-icons/react'

interface PlannerProps {
  cards: CardType[]
  onScheduleCard: (cardId: string, date: string, time: string) => void
  onEditCard: (card: CardType) => void
}

export function Planner({ cards, onScheduleCard, onEditCard }: PlannerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null)

  const scheduledCards = cards.filter(card => 
    card.scheduledDate && card.scheduledTime &&
    isSameDay(new Date(card.scheduledDate), selectedDate)
  ).sort((a, b) => {
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime)
    }
    return 0
  })

  const unscheduledCards = cards.filter(card => 
    !card.scheduledDate || !card.scheduledTime
  )

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return `${hour}:00`
  })

  const handleDragStart = (card: CardType, event: React.DragEvent) => {
    setDraggedCard(card)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', card.id)
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
  }

  const handleDrop = (time: string, event: React.DragEvent) => {
    event.preventDefault()
    const cardId = event.dataTransfer.getData('text/plain')
    
    if (cardId && draggedCard) {
      onScheduleCard(cardId, selectedDate.toISOString(), time)
    }
    
    setDraggedCard(null)
  }

  const handleUnscheduleCard = (cardId: string) => {
    onScheduleCard(cardId, '', '')
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const getCardsForTime = (time: string) => {
    return scheduledCards.filter(card => card.scheduledTime === time)
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border w-full"
          fixedWeeks
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cards Não Agendados</CardTitle>
          </CardHeader>
          <CardContent>
              <div 
                className={`min-h-8 border-2 border-dashed transition-all rounded p-2 ${
                  draggedCard ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault()
                  const cardId = e.dataTransfer.getData('text/plain')
                  if (cardId) {
                    handleUnscheduleCard(cardId)
                  }
                }}
              >
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {unscheduledCards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(card, e)}
                      onDragEnd={handleDragEnd}
                      className="p-2 border rounded cursor-move hover:shadow-md transition-shadow bg-background text-xs"
                      onClick={() => onEditCard(card)}
                    >
                      <div className="font-medium mb-1">{card.title}</div>
                      <div className="flex flex-wrap gap-1">
                        {card.tags.slice(0, 2).map(tag => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {card.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{card.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {unscheduledCards.length === 0 && (
                    <div className="text-center text-muted-foreground py-4 text-xs">
                      Todos os cards estão agendados
                      <br />
                      <span className="text-xs">Arraste cards aqui para desagendar</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 border-t mt-4">
        <div className="pt-4">
          <h3 className="font-medium text-sm mb-3">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy")}
          </h3>
          
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {timeSlots.filter((_, index) => index % 2 === 0).map(time => {
                const cardsAtTime = getCardsForTime(time)
                
                return (
                  <div
                    key={time}
                    className="flex items-start gap-2 p-2 border-b hover:bg-muted/50 transition-colors min-h-10"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(time, e)}
                  >
                    <div className="w-12 text-xs text-muted-foreground font-mono flex-shrink-0">
                      {time}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      {cardsAtTime.map(card => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={(e) => handleDragStart(card, e)}
                          onDragEnd={handleDragEnd}
                          className="p-2 border rounded cursor-move hover:shadow-md transition-shadow bg-background text-xs"
                          onClick={() => onEditCard(card)}
                        >
                          <div className="font-medium mb-1">{card.title}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1">
                              {card.tags.slice(0, 1).map(tag => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                              {card.tags.length > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{card.tags.length - 1}
                                </Badge>
                              )}
                            </div>
                            
                            {card.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock size={10} />
                                {format(new Date(card.dueDate), 'dd/MM')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {cardsAtTime.length === 0 && (
                        <div className={`h-6 border border-dashed transition-all rounded ${
                          draggedCard ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'
                        }`}>
                          <div className="text-xs text-muted-foreground/50 text-center leading-6">
                            {draggedCard ? 'Soltar aqui' : 'Vazio'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}