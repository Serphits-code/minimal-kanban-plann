import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash, PencilSimple, ArrowsClockwise, CalendarBlank, BellRinging } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface RecurringTask {
  id: string
  title: string
  description: string
  day_of_month: number
  active: boolean
  user_id: string
  created_at: string
  updated_at: string
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export function RecurringTasks() {
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')

  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiClient.getRecurringTasks()
      setTasks(data)
    } catch (error: any) {
      toast.error('Erro ao carregar tarefas recorrentes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDayOfMonth('1')
    setEditingTask(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (task: RecurringTask) => {
    setTitle(task.title)
    setDescription(task.description || '')
    setDayOfMonth(String(task.day_of_month))
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    try {
      if (editingTask) {
        const updated = await apiClient.updateRecurringTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          dayOfMonth: parseInt(dayOfMonth),
        })
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t))
        toast.success('Tarefa recorrente atualizada!')
      } else {
        const created = await apiClient.createRecurringTask({
          title: title.trim(),
          description: description.trim(),
          dayOfMonth: parseInt(dayOfMonth),
        })
        setTasks(prev => [...prev, created])
        toast.success('Tarefa recorrente criada!')
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar tarefa recorrente')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteRecurringTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Tarefa recorrente excluída!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir')
    }
  }

  const handleToggleActive = async (task: RecurringTask) => {
    try {
      const updated = await apiClient.updateRecurringTask(task.id, { active: !task.active })
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
      toast.success(updated.active ? 'Tarefa ativada!' : 'Tarefa pausada!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar')
    }
  }

  const today = new Date().getDate()

  const daysOptions = Array.from({ length: 31 }, (_, i) => i + 1)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ArrowsClockwise size={24} className="text-primary" />
              Tarefas Recorrentes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crie tarefas mensais e receba notificações no dia escolhido
            </p>
          </div>
          <Button onClick={openCreateDialog} size="sm" className="gap-1.5">
            <Plus size={16} />
            Nova Tarefa
          </Button>
        </motion.div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 text-muted-foreground"
          >
            <ArrowsClockwise size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma tarefa recorrente criada ainda</p>
            <p className="text-xs mt-1 opacity-70">Clique em "Nova Tarefa" para começar</p>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {tasks.map(task => {
              const isToday = task.day_of_month === today
              const isPast = task.day_of_month < today
              const daysUntil = task.day_of_month >= today
                ? task.day_of_month - today
                : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - today + task.day_of_month

              return (
                <motion.div
                  key={task.id}
                  variants={item}
                  className={`rounded-xl border p-4 transition-all ${
                    !task.active
                      ? 'opacity-50 border-muted'
                      : isToday
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-medium ${!task.active ? 'line-through' : ''}`}>
                          {task.title}
                        </h3>
                        {isToday && task.active && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-1">
                            <BellRinging size={10} />
                            Hoje!
                          </Badge>
                        )}
                        {!task.active && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Pausada
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarBlank size={12} />
                          Todo dia {task.day_of_month}
                        </span>
                        {task.active && !isToday && (
                          <span>
                            {daysUntil === 1 ? 'Amanhã' : `Em ${daysUntil} dias`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(task)}
                        title={task.active ? 'Pausar' : 'Ativar'}
                      >
                        <ArrowsClockwise size={16} className={task.active ? 'text-primary' : 'text-muted-foreground'} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(task)}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Editar Tarefa Recorrente' : 'Nova Tarefa Recorrente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título</label>
              <Input
                placeholder="Ex: Pagar conta de luz"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Descrição</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-none"
                placeholder="Detalhes da tarefa (opcional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Dia do mês para notificação</label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOptions.map(d => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Você receberá uma notificação push todo mês neste dia
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTask ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
