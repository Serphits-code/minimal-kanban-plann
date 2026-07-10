import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card as CardType, Employee, Priority, PRIORITY_CONFIG } from '@/types/kanban'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Warning, CheckCircle, CalendarBlank, Flag, ArrowRight, ArrowsClockwise, BellRinging } from '@phosphor-icons/react'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { RecurringTask } from '@/components/recurring/RecurringTasks'

interface WelcomeProps {
  cards: CardType[]
  employees: Employee[]
  concludedColumnIds: string[]
  onEditCard: (card: CardType) => void
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

function parseLocalDate(dateStr: string): Date {
  const d = dateStr.split('T')[0]
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function urgencyLabel(daysLeft: number): string {
  if (daysLeft < 0) return 'Atrasado!'
  if (daysLeft === 0) return 'Vence hoje!'
  if (daysLeft === 1) return 'Amanhã'
  return `Faltam ${daysLeft} dias`
}

export function Welcome({ cards, employees, concludedColumnIds, onEditCard }: WelcomeProps) {
  const { user } = useAuth()

  // Recurring tasks
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([])
  useEffect(() => {
    apiClient.getRecurringTasks().then(setRecurringTasks).catch(() => {})
  }, [])

  const upcomingRecurring = useMemo(() => {
    const today = new Date().getDate()
    return recurringTasks
      .filter(t => t.active)
      .map(t => {
        const daysUntil = t.day_of_month >= today
          ? t.day_of_month - today
          : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - today + t.day_of_month
        return { ...t, daysUntil }
      })
      .filter(t => t.daysUntil <= 3)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [recurringTasks])

  const currentEmployee = useMemo(() => {
    if (!user) return null
    return employees.find(e => e.userId === user.id) || null
  }, [employees, user])

  // All non-concluded cards assigned to me
  const myCards = useMemo(() => {
    if (!currentEmployee) return []
    return cards.filter(card => {
      const isMine = card.assigneeIds?.includes(currentEmployee.id) || card.assigneeId === currentEmployee.id
      if (!isMine) return false
      if (card.completed || concludedColumnIds.includes(card.column)) return false
      return true
    })
  }, [cards, currentEmployee, concludedColumnIds])

  // Urgent cards: due within 3 days (includes overdue)
  const urgentCards = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return myCards
      .filter(card => {
        if (!card.dueDate) return false
        const due = parseLocalDate(card.dueDate)
        const diff = differenceInCalendarDays(due, today)
        return diff <= 3
      })
      .sort((a, b) => {
        const dA = parseLocalDate(a.dueDate!).getTime()
        const dB = parseLocalDate(b.dueDate!).getTime()
        return dA - dB
      })
  }, [myCards])

  // All cards sorted by priority
  const sortedCards = useMemo(() => {
    return [...myCards].sort((a, b) => {
      const pA = a.priority ? (PRIORITY_ORDER[a.priority] ?? 4) : 4
      const pB = b.priority ? (PRIORITY_ORDER[b.priority] ?? 4) : 4
      return pA - pB
    })
  }, [myCards])

  // Group cards by priority for display
  const groupedCards = useMemo(() => {
    const groups: { key: string; label: string; color: string; cards: CardType[] }[] = []
    const priorityKeys: (Priority | 'none')[] = ['critical', 'high', 'medium', 'low', 'none']

    for (const pk of priorityKeys) {
      const filtered = sortedCards.filter(c =>
        pk === 'none' ? !c.priority : c.priority === pk
      )
      if (filtered.length === 0) continue
      if (pk === 'none') {
        groups.push({ key: 'none', label: 'Sem prioridade', color: '#9ca3af', cards: filtered })
      } else {
        const cfg = PRIORITY_CONFIG[pk]
        groups.push({ key: pk, label: cfg.label, color: cfg.color, cards: filtered })
      }
    }
    return groups
  }, [sortedCards])

  const today = new Date()
  const firstName = user?.name?.split(' ')[0] || 'Usuário'
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="welcome-shimmer rounded-2xl p-6 sm:p-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold"
          >
            {greeting}, {firstName}! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-muted-foreground mt-1 capitalize"
          >
            {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            className="mt-4"
          >
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {myCards.length === 0
                ? 'Nenhuma tarefa pendente'
                : `Você tem ${myCards.length} tarefa${myCards.length !== 1 ? 's' : ''} pendente${myCards.length !== 1 ? 's' : ''}`}
            </Badge>
          </motion.div>
        </motion.div>

        {/* Urgent alerts section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Warning size={20} className="text-amber-500" />
            Te alertando... Prazo curto
          </h2>

          {urgentCards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4"
            >
              <CheckCircle size={24} weight="fill" className="text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400">
                Sem prazos urgentes — tudo tranquilo! 🎉
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
            >
              {urgentCards.map(card => {
                const daysLeft = differenceInCalendarDays(parseLocalDate(card.dueDate!), today)
                const isOverdue = daysLeft < 0
                const isToday = daysLeft === 0

                return (
                  <motion.button
                    key={card.id}
                    variants={item}
                    onClick={() => onEditCard(card)}
                    className={`flex-shrink-0 w-56 sm:w-64 rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${
                      isOverdue
                        ? 'border-red-500/50 bg-red-500/5'
                        : isToday
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-amber-400/30 bg-amber-400/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        isOverdue ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {urgencyLabel(daysLeft)}
                      </span>
                      {isOverdue ? (
                        <Warning size={16} weight="fill" className="text-red-500 animate-pulse" />
                      ) : (
                        <Warning size={16} weight="fill" className="text-amber-500 animate-pulse" />
                      )}
                    </div>
                    <p className="font-medium text-sm line-clamp-2 mb-2">{card.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarBlank size={13} />
                      <span>{format(parseLocalDate(card.dueDate!), 'dd/MM/yyyy')}</span>
                      {card.priority && (
                        <Badge
                          variant="outline"
                          className="ml-auto text-[10px] px-1.5 py-0"
                          style={{ borderColor: PRIORITY_CONFIG[card.priority].color, color: PRIORITY_CONFIG[card.priority].color }}
                        >
                          {PRIORITY_CONFIG[card.priority].label}
                        </Badge>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </motion.section>

        {/* Upcoming recurring tasks */}
        {upcomingRecurring.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <ArrowsClockwise size={20} className="text-primary" />
              Tarefas recorrentes próximas
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
            >
              {upcomingRecurring.map(task => {
                const isToday = task.daysUntil === 0
                return (
                  <motion.div
                    key={task.id}
                    variants={item}
                    className={`flex-shrink-0 w-56 sm:w-64 rounded-xl border p-4 ${
                      isToday
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-muted-foreground/20 bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        isToday ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {isToday ? 'Hoje!' : task.daysUntil === 1 ? 'Amanhã' : `Em ${task.daysUntil} dias`}
                      </span>
                      {isToday && <BellRinging size={16} weight="fill" className="text-primary animate-pulse" />}
                    </div>
                    <p className="font-medium text-sm line-clamp-2 mb-1">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <CalendarBlank size={11} />
                      <span>Todo dia {task.day_of_month}</span>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.section>
        )}

        {/* To-do list by priority */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
        >
          <h2 className="text-lg font-semibold mb-4">Seus afazeres</h2>

          {groupedCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p className="text-sm">Nenhuma tarefa pendente — aproveite o dia!</p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {groupedCards.map(group => (
                <motion.div key={group.key} variants={item}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: group.color }}
                    />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.label}
                    </h3>
                    <span className="text-xs text-muted-foreground/60">({group.cards.length})</span>
                  </div>

                  <div className="space-y-1">
                    {group.cards.map(card => (
                      <motion.button
                        key={card.id}
                        variants={item}
                        onClick={() => onEditCard(card)}
                        className="w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/60 group"
                      >
                        <span
                          className="w-1.5 h-8 rounded-full flex-shrink-0"
                          style={{ background: group.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{card.title}</p>
                          {card.dueDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <CalendarBlank size={11} />
                              {format(parseLocalDate(card.dueDate), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>
      </div>
    </div>
  )
}
