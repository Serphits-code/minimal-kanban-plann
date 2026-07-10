import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Card as CardType, Employee } from '@/types/kanban'
import { format, startOfDay, isSameDay, addDays, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Calendar as CalendarIcon, CaretLeft, CaretRight, MagnifyingGlass, Funnel, Paperclip } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

interface PlannerProps {
  cards: CardType[]
  employees: Employee[]
  concludedColumnIds?: string[]
  onScheduleCard: (cardId: string, date: string, time: string, scheduledTimeDate?: string) => void
  onEditCard: (card: CardType) => void
  onUpdateCardDuration?: (cardId: string, duration: number) => void
}

type ViewMode = 'day' | 'week' | 'month'

// Parse a date-only string ("YYYY-MM-DD" or full ISO) as LOCAL midnight,
// avoiding the UTC-offset shift that new Date("YYYY-MM-DD") causes in non-UTC timezones.
const parseLocalDate = (dateStr: string): Date => {
  const d = dateStr.split('T')[0]
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

export function Planner({ cards, employees, concludedColumnIds = [], onScheduleCard, onEditCard, onUpdateCardDuration }: PlannerProps) {
  const { user: authUser } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  // Find the employee record that matches the logged-in user
  const currentEmployee = useMemo(() => {
    if (!authUser) return null
    return employees.find(e => e.userId === authUser.id) || null
  }, [employees, authUser])

  // Filter cards: only show cards assigned to the current user
  const myCards = useMemo(() => {
    if (!currentEmployee) return []
    return cards.filter(card =>
      card.assigneeIds?.includes(currentEmployee.id) || card.assigneeId === currentEmployee.id
    )
  }, [cards, currentEmployee])

  // Filter cards based on search (from myCards, not all cards)
  const filteredCards = useMemo(() => {
    if (!searchQuery) return myCards
    return myCards.filter(card => 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      card.attachments?.some(attachment => attachment.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [myCards, searchQuery])

  // Helper: format a Date as YYYY-MM-DD in local timezone
  const toLocalDateStr = (date: Date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0')
  }

  // Helper: check if a card is a multi-day period card
  const isPeriodCard = (card: CardType) => {
    if (card.scheduledDate && card.dueDate) {
      return differenceInDays(parseLocalDate(card.dueDate), parseLocalDate(card.scheduledDate)) > 0
    }
    return false
  }

  // Helper: check if the selected date falls within a card's period
  const isDateInPeriod = (card: CardType, date: Date) => {
    if (!card.scheduledDate || !card.dueDate) return false
    const start = startOfDay(parseLocalDate(card.scheduledDate))
    const end = startOfDay(parseLocalDate(card.dueDate))
    const day = startOfDay(date)
    return day >= start && day <= end
  }

  // Detect multi-day cards
  const multiDayCards = useMemo(() => {
    return filteredCards.filter(isPeriodCard)
  }, [filteredCards])

  // Cards shown in the timeline: period cards scheduled only for today (scheduledTimeDate matches)
  const scheduledCards = filteredCards.filter(card => {
    if (!card.scheduledTime) return false
    if (isPeriodCard(card)) {
      // Only show in timeline if the time was allocated for this specific day
      return isDateInPeriod(card, selectedDate) && card.scheduledTimeDate === toLocalDateStr(selectedDate)
    }
    // Regular card: must match exact date
    return card.scheduledDate && isSameDay(parseLocalDate(card.scheduledDate), selectedDate)
  }).sort((a, b) => {
    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime)
    }
    return 0
  })

  const unscheduledCards = filteredCards.filter(card => {
    if (card.completed || concludedColumnIds.includes(card.column)) return false
    if (isPeriodCard(card)) {
      // Period cards: show as unscheduled on every day in their period,
      // unless they've been allocated a time specifically for today
      if (!isDateInPeriod(card, selectedDate)) return false
      return !card.scheduledTime || card.scheduledTimeDate !== toLocalDateStr(selectedDate)
    }
    // Regular cards: unscheduled if no time allocated
    if (card.scheduledDate && card.scheduledTime) return false
    return true
  })

  // Period cards in banner: within range AND not already time-allocated for today AND not completed
  const periodCardsForBanner = multiDayCards.filter(card => {
    if (card.completed || concludedColumnIds.includes(card.column)) return false
    if (!isDateInPeriod(card, selectedDate)) return false
    // Hide if already has a time allocated specifically for today
    if (card.scheduledTime && card.scheduledTimeDate === toLocalDateStr(selectedDate)) return false
    return true
  })

  // Week view data
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  const getCardsForDate = (date: Date) => {
    return filteredCards.filter(card => {
      if (!card.scheduledDate) return false
      // Period cards: show if the date falls within the period
      if (isPeriodCard(card)) return isDateInPeriod(card, date)
      return isSameDay(parseLocalDate(card.scheduledDate), date)
    }
    ).sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime)
      }
      return 0
    })
  }

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
      // Check if the target time and duration would conflict with existing cards
      const cardDuration = draggedCard.duration || 1
      const startHour = parseInt(time.split(':')[0])
      
      // Check for conflicts with existing scheduled cards
      const hasConflict = scheduledCards.some(existingCard => {
        if (existingCard.id === cardId) return false // Ignore the card being moved
        
        if (existingCard.scheduledTime) {
          const existingStartHour = parseInt(existingCard.scheduledTime.split(':')[0])
          const existingDuration = existingCard.duration || 1
          
          // Check if the time ranges overlap
          return (
            startHour < existingStartHour + existingDuration &&
            startHour + cardDuration > existingStartHour
          )
        }
        return false
      })
      
      if (hasConflict) {
        toast.error('Conflito de horário! Escolha outro horário.')
        setDraggedCard(null)
        return
      }
      
      // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const localDate = toLocalDateStr(selectedDate)
      
      // For period cards, keep original scheduledDate (project start), only set the time.
      // Also save scheduledTimeDate = today so tomorrow the card resets to unscheduled.
      const isPeriod = isPeriodCard(draggedCard)
      onScheduleCard(
        cardId,
        isPeriod ? draggedCard.scheduledDate! : localDate,
        time,
        isPeriod ? localDate : undefined
      )
    }
    
    setDraggedCard(null)
  }

  const handleUnscheduleCard = (cardId: string) => {
    // For period cards: keep scheduledDate but clear scheduledTime and scheduledTimeDate,
    // so the card reappears in banner and unscheduled list.
    const card = filteredCards.find(c => c.id === cardId)
    if (card && isPeriodCard(card)) {
      onScheduleCard(cardId, card.scheduledDate!, '', undefined)
    } else {
      onScheduleCard(cardId, '', '')
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const isDropZoneHighlighted = (time: string) => {
    if (!draggedCard) return false
    
    const timeHour = parseInt(time.split(':')[0])
    const draggedDuration = draggedCard.duration || 1
    
    // For now, we'll just return false until we implement proper drop zone highlighting
    return false
  }

  const getCardsForTime = (time: string) => {
    return scheduledCards.filter(card => {
      if (!card.scheduledTime) return false
      
      const cardStartHour = parseInt(card.scheduledTime.split(':')[0])
      const cardDuration = card.duration || 1
      const timeHour = parseInt(time.split(':')[0])
      
      // Check if this time slot falls within the card's duration
      return timeHour >= cardStartHour && timeHour < cardStartHour + cardDuration
    })
  }

  const isCardStartTime = (card: CardType, time: string) => {
    return card.scheduledTime === time
  }

  const getCardStats = () => {
    const total = filteredCards.length
    const scheduled = filteredCards.filter(card => card.scheduledDate && card.scheduledTime).length
    const today = filteredCards.filter(card => 
      card.scheduledDate && isSameDay(new Date(card.scheduledDate), new Date())
    ).length
    const withAttachments = filteredCards.filter(card => card.attachments && card.attachments.length > 0).length
    
    return { total, scheduled, today, unscheduled: total - scheduled, withAttachments }
  }

  const stats = getCardStats()

  const renderDayView = () => (
    <div className="flex flex-col md:flex-row md:h-full gap-3">
      {/* Left sidebar - Unscheduled cards */}
      <div className="md:w-72 md:min-w-[288px] flex flex-col gap-3 md:h-full md:overflow-y-auto">
        <Card className="flex flex-col md:flex-1 md:min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Não Agendados ({unscheduledCards.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div 
              className={`border-2 border-dashed transition-all rounded-lg p-3 ${
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
              <div className="max-h-60 md:max-h-72 overflow-y-auto">
                <div className="space-y-2">
                  {unscheduledCards.map(card => {
                    const cardIsMultiDay = multiDayCards.some(mc => mc.id === card.id)
                    const cardDays = card.dueDate
                      ? Math.max(differenceInDays(new Date(card.dueDate), startOfDay(selectedDate)), 0)
                      : card.duration ? Math.ceil(card.duration / 8) : 0
                    return (
                      <PlannerCard
                        key={card.id}
                        card={card}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onEdit={onEditCard}
                        isDragging={draggedCard?.id === card.id}
                        showTime={false}
                        duration={card.duration || 1}
                        isMultiDay={cardIsMultiDay}
                        multiDayDays={cardDays}
                        onUpdateDuration={onUpdateCardDuration}
                      />
                    )
                  })}
                  
                  {unscheduledCards.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      <CalendarIcon size={24} className="mx-auto mb-2 opacity-50" />
                      Todos os cards estão agendados
                      <br />
                      <span className="text-xs">Arraste cards aqui para desagendar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="flex-shrink-0 px-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{stats.total}</span> total
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{stats.scheduled}</span> agendados
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{stats.today}</span> hoje
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{stats.unscheduled}</span> livres
            </span>
          </div>
        </div>
      </div>

      {/* Main timeline */}
      <div className="flex-1 min-w-0">
        <Card className="flex flex-col md:h-full" style={{ minHeight: '520px' }}>
          <CardHeader className="pb-3 flex-shrink-0 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm sm:text-lg font-semibold leading-snug">
                {formatDateLabel(selectedDate)} - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <Badge variant="outline" className="text-xs flex-shrink-0">
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
                  
                  // Check if this slot is occupied by a multi-hour task
                  const occupyingCard = cardsAtTime.find(card => !isCardStartTime(card, time))
                  const hasStartingCard = cardsAtTime.some(card => isCardStartTime(card, time))
                  
                  return (
                    <div
                      key={time}
                      data-time={time}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-muted/50 min-h-16 border ${
                        hasStartingCard ? 'bg-muted/20 border-muted' : 
                        occupyingCard ? 'bg-accent/10 border-accent/30 border-l-4' : 
                        'border-transparent'
                      } ${isCurrentHour && isToday(selectedDate) ? 'border-l-2 border-l-accent' : ''} ${
                        draggedCard ? 'hover:bg-primary/10 hover:border-primary/30' : ''
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(time, e)}
                    >
                      <div className={`w-16 text-sm font-mono flex-shrink-0 text-center py-1 ${
                        isCurrentHour && isToday(selectedDate) 
                          ? 'text-accent font-semibold' 
                          : 'text-muted-foreground'
                      }`}>
                        {time}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {cardsAtTime.map(card => {
                          // Only render the card at its start time to avoid duplicates
                          if (!isCardStartTime(card, time)) return null
                          
                          const cardDuration = card.duration || 1
                          const isMultiHour = cardDuration > 1
                          
                          return (
                            <div
                              key={card.id}
                              className="relative"
                            >
                              <PlannerCard
                                card={card}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onEdit={onEditCard}
                                isDragging={draggedCard?.id === card.id}
                                showTime={true}
                                duration={cardDuration}
                                onUpdateDuration={onUpdateCardDuration}
                              />
                              {isMultiHour && (
                                <div className="absolute top-1 right-1 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
                                  {cardDuration}h
                                </div>
                              )}
                            </div>
                          )
                        })}
                        
                        {/* Show indicator for occupied time slots */}
                        {occupyingCard && !hasStartingCard && (
                          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 px-2 py-1 bg-accent/20 rounded-md">
                              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                              <span className="font-medium">{occupyingCard.title}</span>
                              <span className="text-xs">em andamento</span>
                            </div>
                          </div>
                        )}
                        
                          {cardsAtTime.filter(card => isCardStartTime(card, time)).length === 0 && !occupyingCard && (
                          <div className={`h-10 border border-dashed transition-all rounded-lg flex items-center justify-center ${
                            draggedCard 
                              ? 'border-primary bg-primary/10' 
                              : 'border-transparent hover:border-border'
                          }`}>
                            <div className="text-xs text-muted-foreground/50">
                              {draggedCard ? (
                                <div className="flex items-center gap-2">
                                  <Clock size={12} />
                                  <span>Soltar para agendar às {time}</span>
                                  {draggedCard.duration && draggedCard.duration > 1 && (
                                    <span className="text-primary">({draggedCard.duration}h)</span>
                                  )}
                                </div>
                              ) : ''}
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
          <CardTitle className="text-base sm:text-lg font-semibold">
            Semana de {format(weekDays[0], "dd/MM/yy", { locale: ptBR })} - {format(weekDays[6], "dd/MM/yy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 h-full" style={{ minWidth: '560px' }}>
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
      <div className="border-b bg-card px-3 sm:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-semibold">Planejador</h2>
            
            {/* Date navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="h-8 w-8 p-0"
              >
                <CaretLeft size={16} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
                className="min-w-24 h-8 px-2 text-xs sm:text-sm"
              >
                <CalendarIcon size={14} className="mr-1" />
                {formatDateLabel(selectedDate)}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="h-8 w-8 p-0"
              >
                <CaretRight size={16} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="h-8 px-2 text-xs sm:text-sm"
              >
                Hoje
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-48 h-8 text-sm"
              />
            </div>

            {/* View mode selector */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg flex-shrink-0">
              <Button
                variant={viewMode === 'day' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('day')}
                className="text-xs h-7 px-2"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'week' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('week')}
                className="text-xs h-7 px-2"
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

      {/* Period cards banner */}
      {periodCardsForBanner.length > 0 && (
        <div className="px-3 sm:px-6 pt-3 pb-2">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-2">
              <CalendarIcon size={12} />
              Agendados por período ({periodCardsForBanner.length})
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {periodCardsForBanner.map(card => {
                const days = card.dueDate
                  ? Math.max(differenceInDays(parseLocalDate(card.dueDate), startOfDay(selectedDate)), 0)
                  : card.duration ? Math.ceil(card.duration / 8) : 0
                const start = card.scheduledDate ? format(parseLocalDate(card.scheduledDate), 'dd/MM') : null
                const end = card.dueDate ? format(parseLocalDate(card.dueDate), 'dd/MM') : null
                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(card, e)}
                    onDragEnd={handleDragEnd}
                    className="flex-shrink-0 w-28 bg-background border border-amber-500/30 rounded-lg p-2 cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all"
                    onClick={() => onEditCard(card)}
                  >
                    <p className="text-xs font-semibold truncate mb-1">{card.title}</p>
                    {start && end && (
                      <p className="text-[10px] text-muted-foreground truncate">{start} → {end}</p>
                    )}
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4 text-amber-600 border-amber-400">
                      {days}d restantes
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="pt-3 px-3 sm:px-6 pb-4 sm:pb-6 h-full overflow-y-auto">
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
  duration?: number
  isMultiDay?: boolean
  multiDayDays?: number
  onUpdateDuration?: (cardId: string, duration: number) => void
}

function PlannerCard({ card, onDragStart, onDragEnd, onEdit, isDragging, showTime, duration = 1, isMultiDay = false, multiDayDays = 0, onUpdateDuration }: PlannerCardProps) {
  const [isResizing, setIsResizing] = useState(false)
  const completedTasks = card.checklist.filter(item => item.completed).length
  const totalTasks = card.checklist.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const isOverdue = card.dueDate && parseLocalDate(card.dueDate) < startOfDay(new Date())
  const isDueToday = card.dueDate && isSameDay(parseLocalDate(card.dueDate), new Date())

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const startY = e.clientY
    const startDuration = duration
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const hourHeight = 64 // Height of one hour slot
      const hoursChange = Math.round(deltaY / hourHeight)
      const newDuration = Math.max(1, Math.min(8, startDuration + hoursChange))
      
      // Update the card duration (this would need to be passed as a prop)
      if (newDuration !== duration && onUpdateDuration) {
        onUpdateDuration(card.id, newDuration)
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(card, e)}
      onDragEnd={onDragEnd}
      className={`p-2.5 border rounded-lg cursor-move hover:shadow-md transition-all bg-background group hover:border-primary/50 flex flex-col ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''} ${
        isDueToday ? 'border-amber-500/50' : ''
      } ${duration > 1 ? 'min-h-16' : ''}`}
    >
      <div 
        className="space-y-1.5 cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation()
          onEdit(card)
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight flex-1 group-hover:text-primary transition-colors">
            {card.title}
          </h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            {showTime && card.scheduledTime && (
              <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent/20" onClick={(e) => e.stopPropagation()}>
                    <Clock size={10} className="mr-1" />
                    {card.scheduledTime}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Duração (horas)</p>
                  <div className="grid grid-cols-4 gap-1">
                    {[1,2,3,4,5,6,7,8].map(h => (
                      <button
                        key={h}
                        className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                          duration === h
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => onUpdateDuration && onUpdateDuration(card.id, h)}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Vencido</Badge>
            )}
            {isDueToday && !isOverdue && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-800">Hoje</Badge>
            )}
            {isMultiDay && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-700 border border-amber-400">
                {multiDayDays}d
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar for checklist */}
        {totalTasks > 0 && (
          <div className="w-full bg-muted rounded-full h-1">
            <div 
              className="bg-accent h-1 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 2).map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {card.tags.length > 2 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">+{card.tags.length - 2}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0">
            {card.dueDate && !isDueToday && !isOverdue && (
              <span className="flex items-center gap-0.5">
                <CalendarIcon size={9} />
                {format(new Date(card.dueDate), 'dd/MM')}
              </span>
            )}
            {card.attachments && card.attachments.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip size={9} />
                {card.attachments.length}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Resize handle for multi-hour tasks */}
      {showTime && duration > 1 && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-accent/20 hover:bg-accent/40 transition-colors"
          onMouseDown={handleResizeStart}
          title="Arrastar para redimensionar"
        >
          <div className="w-full h-0.5 bg-accent/60 mt-0.5"></div>
        </div>
      )}
    </div>
  )
}