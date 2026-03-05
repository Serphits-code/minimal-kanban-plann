import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card as CardType, Employee, Column, PRIORITY_CONFIG, STATUS_CONFIG, Priority, TaskStatus, getColumnStatusColor } from '@/types/kanban'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  House, 
  Files, 
  ClockCounterClockwise, 
  At,
  PaperclipHorizontal,
  Smiley,
  PaperPlaneTilt,
  Image,
  Gif as GifIcon,
  MagicWand,
  ListChecks,
  CalendarBlank,
  User,
  Tag,
  TextAlignLeft,
  Check,
  X,
  Pencil
} from '@phosphor-icons/react'

interface TaskSidebarProps {
  card: CardType | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<CardType>) => void
  employees: Employee[]
  columns?: Column[]
  getEmployeeById: (id: string | undefined) => Employee | undefined
}

interface Update {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
  mentions?: string[]
}

export function TaskSidebar({
  card,
  isOpen,
  onClose,
  onUpdate,
  employees,
  columns = [],
  getEmployeeById,
}: TaskSidebarProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [newUpdate, setNewUpdate] = useState('')
  const [updates, setUpdates] = useState<Update[]>([])
  const { user: authUser } = useAuth()

  // Editable details state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState('')

  useEffect(() => {
    if (card) {
      setTitleValue(card.title)
      setDescValue(card.description || '')
    }
  }, [card?.id, isOpen])

  if (!card) return null

  const assignee = getEmployeeById(card.assigneeId)
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handlePostUpdate = () => {
    if (!newUpdate.trim()) return
    const update: Update = {
      id: crypto.randomUUID(),
      userId: authUser?.id || 'current-user',
      userName: authUser?.name || 'Você',
      content: newUpdate,
      createdAt: new Date().toISOString(),
      mentions: extractMentions(newUpdate)
    }
    setUpdates(prev => [update, ...prev])
    setNewUpdate('')
  }

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex)
    return matches ? matches.map(m => m.slice(1)) : []
  }

  const attachmentCount = card.attachments?.length || 0
  const completedTasks = card.checklist.filter(i => i.completed).length
  const totalTasks = card.checklist.length

  // Column / status display
  const currentColIndex = sortedColumns.findIndex(c => c.id === card.column)
  const currentCol = sortedColumns[currentColIndex]
  const columnColor = currentColIndex >= 0 ? getColumnStatusColor(currentColIndex) : '#6b7280'
  const columnLabel = currentCol ? currentCol.name : (card.status ? STATUS_CONFIG[card.status]?.label : 'Sem status')
  const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : PRIORITY_CONFIG['medium']

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  className="text-base font-semibold h-8"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onUpdate({ title: titleValue })
                      setEditingTitle(false)
                    }
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { onUpdate({ title: titleValue }); setEditingTitle(false) }}>
                  <Check size={14} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTitle(false)}>
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0 group cursor-pointer" onClick={() => setEditingTitle(true)}>
                <SheetTitle className="text-base truncate">{card.title}</SheetTitle>
                <Pencil size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </div>
            )}
            {assignee && (
              <Avatar className="h-8 w-8 flex-shrink-0 ml-2">
                <AvatarImage src={assignee.avatar} />
                <AvatarFallback className="text-xs">{getInitials(assignee.name)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 flex-shrink-0">
            <TabsTrigger 
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <ListChecks size={16} />
              Detalhes
            </TabsTrigger>
            <TabsTrigger 
              value="updates"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <House size={16} />
              Atualizações
            </TabsTrigger>
            <TabsTrigger 
              value="files"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <Files size={16} />
              Arquivos/{attachmentCount}
            </TabsTrigger>
            <TabsTrigger 
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <ClockCounterClockwise size={16} />
              Log
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-y-auto m-0 p-4 space-y-4">
            {/* Status / Column */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Status</span>
              {sortedColumns.length > 0 ? (
                <Select value={card.column || ''} onValueChange={val => onUpdate({ column: val })}>
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: columnColor }} />
                        {columnLabel}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sortedColumns.map((col, idx) => (
                      <SelectItem key={col.id} value={col.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColumnStatusColor(idx) }} />
                          {col.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={card.status || 'not_started'} onValueChange={val => onUpdate({ status: val as TaskStatus })}>
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_CONFIG) as [TaskStatus, { label: string; color: string }][]).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Prioridade</span>
              <Select value={card.priority || 'medium'} onValueChange={val => onUpdate({ priority: val as Priority })}>
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityConfig.color }} />
                      {priorityConfig.label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string; color: string }][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Responsável</span>
              <Select value={card.assigneeId || '__none__'} onValueChange={val => onUpdate({ assigneeId: val === '__none__' ? undefined : val })}>
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Nenhum">
                    {assignee ? (
                      <span className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={assignee.avatar} />
                          <AvatarFallback className="text-[9px]">{getInitials(assignee.name)}</AvatarFallback>
                        </Avatar>
                        {assignee.name.split(' ')[0]}
                      </span>
                    ) : 'Nenhum'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <span className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback className="text-[9px]">{getInitials(emp.name)}</AvatarFallback>
                        </Avatar>
                        {emp.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex items-start gap-3">
              <span className="text-sm text-muted-foreground w-28 flex-shrink-0 pt-1.5">Período</span>
              <div className="flex-1 space-y-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-sm w-full justify-start font-normal">
                      <CalendarBlank size={14} className="mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {card.scheduledDate && card.dueDate
                          ? `${format(new Date(card.scheduledDate), 'dd/MM/yy')} → ${format(new Date(card.dueDate), 'dd/MM/yy')}`
                          : card.scheduledDate
                          ? `${format(new Date(card.scheduledDate), 'dd/MM/yy')} → fim`
                          : card.dueDate
                          ? `início → ${format(new Date(card.dueDate), 'dd/MM/yy')}`
                          : 'Sem período'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: card.scheduledDate ? new Date(card.scheduledDate) : undefined,
                        to: card.dueDate ? new Date(card.dueDate) : undefined,
                      }}
                      onSelect={(range) => onUpdate({
                        scheduledDate: range?.from?.toISOString(),
                        dueDate: range?.to?.toISOString(),
                      })}
                      numberOfMonths={1}
                    />
                    {(card.scheduledDate || card.dueDate) && (
                      <div className="p-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full text-destructive"
                          onClick={() => onUpdate({ scheduledDate: undefined, dueDate: undefined })}>
                          Remover período
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                {card.scheduledDate && card.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((new Date(card.dueDate).getTime() - new Date(card.scheduledDate).getTime()) / (1000 * 60 * 60 * 24) + 1)} dia(s)
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TextAlignLeft size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">Descrição</span>
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <Textarea
                    value={descValue}
                    onChange={e => setDescValue(e.target.value)}
                    className="text-sm min-h-[100px] resize-none"
                    placeholder="Adicione uma descrição..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { onUpdate({ description: descValue }); setEditingDesc(false) }}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDescValue(card.description || ''); setEditingDesc(false) }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded p-2 min-h-[40px]"
                  onClick={() => { setDescValue(card.description || ''); setEditingDesc(true) }}
                >
                  {card.description || <span className="italic">Clique para adicionar uma descrição...</span>}
                </div>
              )}
            </div>

            {/* Tags */}
            {card.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Etiquetas</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {card.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Checklist */}
            {totalTasks > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ListChecks size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Checklist</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{completedTasks}/{totalTasks}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    {card.checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={checked => {
                            const newChecklist = card.checklist.map(ci =>
                              ci.id === item.id ? { ...ci, completed: !!checked } : ci
                            )
                            onUpdate({ checklist: newChecklist })
                          }}
                        />
                        <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="flex-1 flex flex-col overflow-hidden m-0 p-4">
            {/* Update input */}
            <div className="border rounded-lg p-3 mb-4 flex-shrink-0">
              <Textarea
                placeholder="Escreva uma atualização e mencione outros com @"
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[80px] p-0"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <At size={16} className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <PaperclipHorizontal size={16} className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <GifIcon size={16} className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Smiley size={16} className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MagicWand size={16} className="text-muted-foreground" />
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  onClick={handlePostUpdate}
                  disabled={!newUpdate.trim()}
                  className="gap-1"
                >
                  <PaperPlaneTilt size={14} />
                  Enviar
                </Button>
              </div>
            </div>

            {/* Updates list */}
            <div className="flex-1 overflow-y-auto">
              {updates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <div className="w-12 h-3 bg-muted-foreground/20 rounded" />
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Image size={20} className="text-primary" />
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -left-2 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Smiley size={16} className="text-blue-500" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Nenhuma atualização ainda
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-[250px]">
                    Compartilhe o progresso, mencione um colega ou carregue um arquivo para dar andamento às coisas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {updates.map((update) => (
                    <div key={update.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={update.userAvatar} />
                        <AvatarFallback className="text-xs">
                          {getInitials(update.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{update.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(update.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{update.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="flex-1 overflow-y-auto m-0 p-4">
            {(card.attachments || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Files size={48} className="text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Nenhum arquivo
                </h3>
                <p className="text-muted-foreground text-sm">
                  Arraste e solte arquivos aqui ou adicione pela tabela
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {card.attachments?.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="w-full h-24 bg-muted rounded flex items-center justify-center mb-2">
                        {attachment.type.startsWith('image/') ? (
                          <img 
                            src={attachment.url} 
                            alt={attachment.name}
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <Files size={32} className="text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 overflow-y-auto m-0 p-4">
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ClockCounterClockwise size={48} className="text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Nenhuma atividade
              </h3>
              <p className="text-muted-foreground text-sm">
                As atividades desta tarefa aparecerão aqui
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
