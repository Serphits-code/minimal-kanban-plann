import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Card as CardType } from '@/types/kanban'
import { format, startOfDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock } from '@phosphor-icons/react'

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

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const getCardsForTime = (time: string) => {
    return scheduledCards.filter(card => card.scheduledTime === time)
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CalendarIcon size={24} />
          Planejador
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Cards Não Agendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {unscheduledCards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(card, e)}
                    onDragEnd={handleDragEnd}
                    className="p-3 border rounded cursor-move hover:shadow-md transition-shadow bg-card"
                    onClick={() => onEditCard(card)}
                  >
                    <div className="font-medium text-sm mb-1">{card.title}</div>
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                
                {unscheduledCards.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Todos os cards estão agendados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {timeSlots.map(time => {
                  const cardsAtTime = getCardsForTime(time)
                  
                  return (
                    <div
                      key={time}
                      className="flex items-start gap-3 p-2 border-b hover:bg-muted/50 transition-colors min-h-12"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(time, e)}
                    >
                      <div className="w-16 text-sm text-muted-foreground font-mono">
                        {time}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {cardsAtTime.map(card => (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => handleDragStart(card, e)}
                            onDragEnd={handleDragEnd}
                            className="p-2 border rounded cursor-move hover:shadow-md transition-shadow bg-card"
                            onClick={() => onEditCard(card)}
                          >
                            <div className="font-medium text-sm mb-1">{card.title}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-wrap gap-1">
                                {card.tags.map(tag => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                              
                              {card.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock size={12} />
                                  {format(new Date(card.dueDate), 'dd/MM', { locale: ptBR })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {cardsAtTime.length === 0 && (
                          <div className="h-8 border-2 border-dashed border-transparent rounded transition-colors hover:border-border">
                            <div className="text-xs text-muted-foreground/50 text-center leading-8">
                              Solte um card aqui
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}