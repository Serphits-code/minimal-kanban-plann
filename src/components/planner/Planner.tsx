import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Card as CardType } from '@/types/kanban'
import { format, startOfDay, isSameDay, addDays, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

  // Show empty state if no cards exist
  if (cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhum card encontrado</h3>
          <p className="text-muted-foreground">Crie alguns cards nos quadros para usar o planejador</p>
        </div>
      </div>
    )
  }

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
    <div className="h-full flex gap-4">
      {/* Left sidebar - Unscheduled cards */}
      <div className="w-80 flex flex-col gap-4 max-h-full">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Não Agendados ({unscheduledCards.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <div 
              className={`h-full border-2 border-dashed transition-all rounded-lg p-3 ${
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
              <ScrollArea className="h-full">
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
        <Card className="flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-muted rounded-lg">
                <div className="font-semibold text-lg">{stats.total}</div>
                <div className="text-muted-foreground text-xs">Total</div>
              </div>
              <div className="text-center p-2 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="font-semibold text-lg text-accent-foreground">{stats.scheduled}</div>
                <div className="text-muted-foreground text-xs">Agendados</div>
              </div>
              <div className="text-center p-2 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="font-semibold text-lg text-primary">{stats.today}</div>
                <div className="text-muted-foreground text-xs">Hoje</div>
              </div>
              <div className="text-center p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="font-semibold text-lg text-destructive">{stats.unscheduled}</div>
                <div className="text-muted-foreground text-xs">Livres</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main timeline */}
      <div className="flex-1 min-w-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {formatDateLabel(selectedDate)} - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {scheduledCards.length} cards agendados
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {workingHours.map(time => {
                  const cardsAtTime = getCardsForTime(time)
                  const isCurrentHour = new Date().getHours() === parseInt(time.split(':')[0])
                  
                  return (
                    <div
                      key={time}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-muted/50 min-h-16 border ${
                        cardsAtTime.length > 0 ? 'bg-muted/20 border-muted' : 'border-transparent'
                      } ${isCurrentHour && isToday(selectedDate) ? 'ring-2 ring-accent bg-accent/5' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(time, e)}
                    >
                      <div className={`w-16 text-sm font-mono flex-shrink-0 text-center py-1 ${
                        isCurrentHour && isToday(selectedDate) 
                          ? 'text-accent-foreground font-semibold' 
                          : 'text-muted-foreground'
                      }`}>
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
                          <div className={`h-10 border border-dashed transition-all rounded-lg flex items-center justify-center ${
                            draggedCard 
                              ? 'border-primary bg-primary/10' 
                              : 'border-transparent hover:border-border'
                          }`}>
                            <div className="text-xs text-muted-foreground/50">
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
    <div className="h-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg font-semibold">
            Semana de {format(weekDays[0], "dd/MM/yy", { locale: ptBR })} - {format(weekDays[6], "dd/MM/yy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <div className="grid grid-cols-7 gap-2 h-full">
            {weekDays.map(day => {
              const dayCards = getCardsForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`border rounded-lg p-2 cursor-pointer transition-all hover:shadow-sm flex flex-col ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                  } ${isToday(day) ? 'bg-accent/10 border-accent' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-center mb-2 flex-shrink-0">
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                    </div>
                    <div className={`text-sm font-medium ${isToday(day) ? 'text-accent-foreground' : ''}`}>
                      {format(day, 'dd')}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-1">
                        {dayCards.slice(0, 8).map(card => (
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
                        
                        {dayCards.length > 8 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{dayCards.length - 8} mais
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
      <div className="border-b bg-card px-6 py-4 flex-shrink-0">
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
      <div className="flex-1 overflow-auto">
        <div className="p-6 h-full">
          {viewMode === 'day' ? renderDayView() : renderWeekView()}
        </div>
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
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()
  const isDueToday = card.dueDate && isSameDay(new Date(card.dueDate), new Date())

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(card, e)}
      onDragEnd={onDragEnd}
      className={`p-3 border rounded-lg cursor-move hover:shadow-lg transition-all bg-background group hover:border-primary/50 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''} ${
        isDueToday ? 'border-amber-500/50 bg-amber-50' : ''
      }`}
    >
      <div 
        className="space-y-2 cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation()
          onEdit(card)
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight flex-1 group-hover:text-primary transition-colors">
            {card.title}
          </h4>
          <div className="flex items-center gap-1">
            {showTime && card.scheduledTime && (
              <Badge variant="outline" className="text-xs">
                <Clock size={10} className="mr-1" />
                {card.scheduledTime}
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Vencido
              </Badge>
            )}
            {isDueToday && !isOverdue && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                Hoje
              </Badge>
            )}
          </div>
        </div>
        
        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Progress bar for checklist */}
        {totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {completedTasks}/{totalTasks} tarefas
              </span>
              <span className="text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-accent h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 2).map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-1.5 py-0"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {card.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{card.tags.length - 2}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {card.dueDate && !isDueToday && !isOverdue && (
              <div className="flex items-center gap-1">
                <CalendarIcon size={10} />
                {format(new Date(card.dueDate), 'dd/MM')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}