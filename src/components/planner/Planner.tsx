import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Card as CardType } from '@/types/kanban'
import { format, startOfDay, isSameDay, addDays, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { Clock, Calendar as CalendarIcon, CaretLeft, CaretRight, MagnifyingGlass, Funnel } from '@phosphor-icons/react'

interface PlannerProps {
  cards: CardType[]
  onScheduleCard: (cardId: string, date: string, time: string) => void
  onEditCard: (card: CardType) => void
}

type ViewMode = 'day' | 'week' | 'month'

export function Planner({ cards, onScheduleCard, onEditCard }: PlannerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  // Filter cards based on search
  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards
    return cards.filter(card => 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [cards, searchQuery])

  const scheduledCards = filteredCards.filter(card => 
    card.scheduledDate && card.scheduledTime &&
    isSameDay(new Date(card.scheduledDate), selectedDate)
  ).sort((a, b) => {
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime)
    }
    return 0
  })

  const unscheduledCards = filteredCards.filter(card => 
    !card.scheduledDate || !card.scheduledTime
  )

  // Week view data
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  const getCardsForDate = (date: Date) => {
    return filteredCards.filter(card => 
      card.scheduledDate && isSameDay(new Date(card.scheduledDate), date)
    ).sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime)
      }
      return 0
    })
  }

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return `${hour}:00`
  })

  const workingHours = timeSlots.filter((_, index) => index >= 8 && index <= 18)

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoje'
    if (isTomorrow(date)) return 'Amanhã'
    if (isYesterday(date)) return 'Ontem'
    return format(date, 'dd/MM', { locale: ptBR })
  }

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

  const getCardStats = () => {
    const total = filteredCards.length
    const scheduled = filteredCards.filter(card => card.scheduledDate && card.scheduledTime).length
    const today = filteredCards.filter(card => 
      card.scheduledDate && isSameDay(new Date(card.scheduledDate), new Date())
    ).length
    
    return { total, scheduled, today, unscheduled: total - scheduled }
  }

  const stats = getCardStats()

  const renderDayView = () => (
    <div className="flex-1 flex gap-4">
      {/* Left sidebar - Unscheduled cards */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Não Agendados ({unscheduledCards.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className={`min-h-16 border-2 border-dashed transition-all rounded-lg p-3 ${
                draggedCard ? 'border-primary bg-primary/5' : 'border-muted hover:border-border'
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
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {unscheduledCards.map(card => (
                    <PlannerCard
                      key={card.id}
                      card={card}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onEdit={onEditCard}
                      isDragging={draggedCard?.id === card.id}
                      showTime={false}
                    />
                  ))}
                  
                  {unscheduledCards.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      <CalendarIcon size={24} className="mx-auto mb-2 opacity-50" />
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

        {/* Quick stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-muted rounded-lg">
                <div className="font-semibold text-lg">{stats.total}</div>
                <div className="text-muted-foreground text-xs">Total</div>
              </div>
              <div className="text-center p-2 bg-green-50 text-green-700 rounded-lg">
                <div className="font-semibold text-lg">{stats.scheduled}</div>
                <div className="text-muted-foreground text-xs">Agendados</div>
              </div>
              <div className="text-center p-2 bg-blue-50 text-blue-700 rounded-lg">
                <div className="font-semibold text-lg">{stats.today}</div>
                <div className="text-muted-foreground text-xs">Hoje</div>
              </div>
              <div className="text-center p-2 bg-orange-50 text-orange-700 rounded-lg">
                <div className="font-semibold text-lg">{stats.unscheduled}</div>
                <div className="text-muted-foreground text-xs">Livres</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main timeline */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {formatDateLabel(selectedDate)} - {format(selectedDate, "dd 'de' MMMM")}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {scheduledCards.length} cards agendados
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {workingHours.map(time => {
                  const cardsAtTime = getCardsForTime(time)
                  
                  return (
                    <div
                      key={time}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-muted/30 min-h-14 ${
                        cardsAtTime.length > 0 ? 'bg-muted/20' : ''
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(time, e)}
                    >
                      <div className="w-16 text-sm font-mono text-muted-foreground flex-shrink-0 text-center py-1">
                        {time}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {cardsAtTime.map(card => (
                          <PlannerCard
                            key={card.id}
                            card={card}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onEdit={onEditCard}
                            isDragging={draggedCard?.id === card.id}
                            showTime={true}
                          />
                        ))}
                        
                        {cardsAtTime.length === 0 && (
                          <div className={`h-8 border border-dashed transition-all rounded-lg ${
                            draggedCard ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'
                          }`}>
                            <div className="text-xs text-muted-foreground/50 text-center leading-8">
                              {draggedCard ? 'Soltar card aqui' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderWeekView = () => (
    <div className="flex-1">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            Semana de {format(weekDays[0], "dd/MM")} - {format(weekDays[6], "dd/MM")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 h-80">
            {weekDays.map(day => {
              const dayCards = getCardsForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`border rounded-lg p-2 cursor-pointer transition-all hover:shadow-sm ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                  } ${isToday(day) ? 'bg-accent/10 border-accent' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-center mb-2">
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-sm font-medium ${isToday(day) ? 'text-accent-foreground' : ''}`}>
                      {format(day, 'dd')}
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {dayCards.slice(0, 4).map(card => (
                        <div
                          key={card.id}
                          className="p-1 bg-background border rounded text-xs cursor-pointer hover:shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditCard(card)
                          }}
                        >
                          <div className="font-medium truncate">{card.title}</div>
                          {card.scheduledTime && (
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Clock size={8} />
                              {card.scheduledTime}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {dayCards.length > 4 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{dayCards.length - 4} mais
                        </div>
                      )}
                      
                      {dayCards.length === 0 && (
                        <div className="text-xs text-muted-foreground/50 text-center py-4">
                          Vazio
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Planejador</h2>
            
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              >
                <CaretLeft size={16} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
                className="min-w-32"
              >
                <CalendarIcon size={16} className="mr-2" />
                {formatDateLabel(selectedDate)}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <CaretRight size={16} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoje
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* View mode selector */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'day' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('day')}
                className="text-xs"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'week' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('week')}
                className="text-xs"
              >
                Semana
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar popup */}
        {showCalendar && (
          <div className="absolute z-10 bg-background border rounded-lg shadow-lg p-4 mt-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date)
                  setShowCalendar(false)
                }
              }}
              className="rounded-md"
            />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-6">
        {viewMode === 'day' ? renderDayView() : renderWeekView()}
      </div>
    </div>
  )
}

// Reusable card component for planner
interface PlannerCardProps {
  card: CardType
  onDragStart: (card: CardType, event: React.DragEvent) => void
  onDragEnd: () => void
  onEdit: (card: CardType) => void
  isDragging: boolean
  showTime: boolean
}

function PlannerCard({ card, onDragStart, onDragEnd, onEdit, isDragging, showTime }: PlannerCardProps) {
  const completedTasks = card.checklist.filter(item => item.completed).length
  const totalTasks = card.checklist.length

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(card, e)}
      onDragEnd={onDragEnd}
      className={`p-3 border rounded-lg cursor-move hover:shadow-md transition-all bg-background ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      onClick={() => onEdit(card)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight flex-1">{card.title}</h4>
          {showTime && card.scheduledTime && (
            <Badge variant="outline" className="text-xs">
              {card.scheduledTime}
            </Badge>
          )}
        </div>
        
        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {card.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 2).map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-1 py-0"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {card.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{card.tags.length - 2}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {totalTasks > 0 && (
              <span>{completedTasks}/{totalTasks}</span>
            )}
            {card.dueDate && (
              <div className="flex items-center gap-1">
                <Clock size={10} />
                {format(new Date(card.dueDate), 'dd/MM')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}