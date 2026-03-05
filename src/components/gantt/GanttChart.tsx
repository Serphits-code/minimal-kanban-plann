import React, { useState, useMemo, useRef } from 'react'
import { Card as CardType, Employee, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/kanban'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CaretLeft, CaretRight, CalendarBlank, MagnifyingGlass, Flag, User } from '@phosphor-icons/react'
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, isToday, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GanttChartProps {
  cards: CardType[]
  employees: Employee[]
  onEditCard: (card: CardType) => void
}

type TimeRange = 'week' | 'two-weeks' | 'month'

export function GanttChart({ cards, employees, onEditCard }: GanttChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('two-weeks')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>('all')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Calculate date range based on selected view
  const { startDate, endDate, days } = useMemo(() => {
    let start: Date, end: Date

    switch (timeRange) {
      case 'week':
        start = startOfWeek(currentDate, { weekStartsOn: 1 })
        end = endOfWeek(currentDate, { weekStartsOn: 1 })
        break
      case 'two-weeks':
        start = startOfWeek(currentDate, { weekStartsOn: 1 })
        end = addDays(start, 13)
        break
      case 'month':
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
        break
      default:
        start = startOfWeek(currentDate, { weekStartsOn: 1 })
        end = addDays(start, 13)
    }

    const days = eachDayOfInterval({ start, end })
    return { startDate: start, endDate: end, days }
  }, [currentDate, timeRange])

  // Filter cards that have dates (dueDate or scheduledDate)
  const ganttCards = useMemo(() => {
    return cards
      .filter(card => {
        const hasDate = card.dueDate || card.scheduledDate
        if (!hasDate) return false
        if (searchTerm && !card.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
        if (filterAssigneeId !== 'all' && card.assigneeId !== filterAssigneeId) return false
        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate || a.dueDate || '')
        const dateB = new Date(b.scheduledDate || b.dueDate || '')
        return dateA.getTime() - dateB.getTime()
      })
  }, [cards, searchTerm, filterAssigneeId])

  const navigate = (direction: 'prev' | 'next') => {
    switch (timeRange) {
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
        break
      case 'two-weeks':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 2) : subWeeks(currentDate, 2))
        break
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
        break
    }
  }

  const goToToday = () => setCurrentDate(new Date())

  const getBarPosition = (card: CardType) => {
    const cardStart = new Date(card.scheduledDate || card.dueDate || '')

    // Calculate duration in days
    let durationDays: number
    if (card.scheduledDate && card.dueDate) {
      const start = new Date(card.scheduledDate)
      const end = new Date(card.dueDate)
      durationDays = Math.max(differenceInDays(end, start) + 1, 1)
    } else if (card.dueDate && !card.scheduledDate) {
      durationDays = 1
    } else {
      durationDays = card.duration ? Math.max(Math.ceil(card.duration / 8), 1) : 1
    }

    // Use pixel values based on COL_WIDTH so positioning is accurate regardless of viewport
    const startOffset = differenceInDays(cardStart, startDate)
    const leftPx = Math.max(startOffset * COL_WIDTH, 0)
    const maxWidth = days.length * COL_WIDTH - leftPx
    const widthPx = Math.min(Math.max(durationDays * COL_WIDTH, COL_WIDTH * 0.8), maxWidth)

    return { left: `${leftPx}px`, width: `${widthPx}px` }
  }

  const getBarColor = (card: CardType) => {
    if (card.completed) return '#22c55e'
    if (card.priority && PRIORITY_CONFIG[card.priority]) {
      return PRIORITY_CONFIG[card.priority].color
    }
    return '#3b82f6'
  }

  const getAssignee = (card: CardType) => {
    if (card.assignee) return card.assignee
    if (card.assigneeId) return employees.find(e => e.id === card.assigneeId)
    return null
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const COL_WIDTH = timeRange === 'month' ? 36 : 56

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">Gráfico de Gantt</h2>
          <Badge variant="secondary" className="text-xs">
            {ganttCards.length} tarefa{ganttCards.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Assignee filter */}
          <Select value={filterAssigneeId} onValueChange={setFilterAssigneeId}>
            <SelectTrigger className="w-[150px] h-8">
              <User size={14} className="mr-1 text-muted-foreground" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 text-sm rounded-md border bg-background w-48 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Time range selector */}
          <Select value={timeRange} onValueChange={(val: TimeRange) => setTimeRange(val)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1 Semana</SelectItem>
              <SelectItem value="two-weeks">2 Semanas</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('prev')}>
              <CaretLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('next')}>
              <CaretRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List (left side) */}
        <div className="w-72 min-w-72 border-r flex flex-col bg-card">
          {/* Header */}
          <div className="h-14 border-b flex items-center px-4 bg-muted/30 font-medium text-sm text-muted-foreground flex-shrink-0">
            Tarefas
          </div>
          {/* Task rows */}
          <div className="flex-1 overflow-y-auto">
            {ganttCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarBlank size={40} className="mb-3 opacity-40" />
                <p className="text-sm">Nenhuma tarefa com data definida</p>
                <p className="text-xs mt-1">Defina datas nos cards para visualizar no Gantt</p>
              </div>
            ) : (
              ganttCards.map((card) => {
                const assignee = getAssignee(card)
                const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null
                return (
                  <div
                    key={card.id}
                    className="h-11 border-b flex items-center px-4 gap-2 hover:bg-muted/30 cursor-pointer group"
                    onClick={() => onEditCard(card)}
                  >
                    {/* Priority dot */}
                    {priorityConfig && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityConfig.color }} />
                    )}
                    {/* Title */}
                    <span className={`text-sm truncate flex-1 ${card.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {card.title}
                    </span>
                    {/* Assignee mini avatar */}
                    {assignee && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-medium text-primary flex-shrink-0">
                              {getInitials(assignee.name)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{assignee.name}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Timeline (right side) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto" ref={scrollRef}>
          <div style={{ minWidth: `${days.length * COL_WIDTH}px` }}>
            {/* Date headers */}
            <div className="h-14 border-b flex bg-muted/30 sticky top-0 z-10">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center border-r text-xs flex-shrink-0 ${
                    isToday(day) ? 'bg-primary/10 font-bold' : isWeekend(day) ? 'bg-muted/50 text-muted-foreground' : ''
                  }`}
                  style={{ width: `${COL_WIDTH}px` }}
                >
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className={`text-sm ${isToday(day) ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>

            {/* Task bars */}
            {ganttCards.map((card) => {
              const { left, width } = getBarPosition(card)
              const barColor = getBarColor(card)
              const assignee = getAssignee(card)
              const statusConfig = card.status ? STATUS_CONFIG[card.status] : null

              return (
                <div key={card.id} className="h-11 border-b relative flex items-center">
                  {/* Grid columns background */}
                  <div className="absolute inset-0 flex">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={`border-r flex-shrink-0 ${
                          isToday(day) ? 'bg-primary/5' : isWeekend(day) ? 'bg-muted/30' : ''
                        }`}
                        style={{ width: `${COL_WIDTH}px` }}
                      />
                    ))}
                  </div>

                  {/* Bar */}
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute h-7 rounded-md cursor-pointer hover:brightness-110 transition-all shadow-sm flex items-center px-2 gap-1 overflow-hidden"
                          style={{
                            left,
                            width,
                            backgroundColor: barColor,
                            opacity: card.completed ? 0.6 : 0.9,
                          }}
                          onClick={() => onEditCard(card)}
                        >
                          <span className="text-white text-[11px] font-medium truncate leading-tight">
                            {card.title}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-white">{card.title}</div>
                          {card.scheduledDate && card.dueDate && (
                            <div className="text-xs text-white/80">
                              Período: {format(new Date(card.scheduledDate), 'dd/MM/yyyy')} → {format(new Date(card.dueDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                          {card.scheduledDate && !card.dueDate && (
                            <div className="text-xs text-white/80">
                              Agendado: {format(new Date(card.scheduledDate), 'dd/MM/yyyy')}
                              {card.scheduledTime && ` às ${card.scheduledTime}`}
                            </div>
                          )}
                          {card.dueDate && !card.scheduledDate && (
                            <div className="text-xs text-white/80">
                              Prazo: {format(new Date(card.dueDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                          {card.duration && (
                            <div className="text-xs text-white/80">Duração: {card.duration}h</div>
                          )}
                          {assignee && (
                            <div className="text-xs text-white/80 flex items-center gap-1">
                              <User size={10} /> {assignee.name}
                            </div>
                          )}
                          {statusConfig && (
                            <div className="text-xs text-white flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig.color }} />
                              {statusConfig.label}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Today indicator line */}
      {days.some(day => isToday(day)) && (
        <style>{`
          /* Today line is embedded in the grid columns via bg-primary/5 */
        `}</style>
      )}
    </div>
  )
}
