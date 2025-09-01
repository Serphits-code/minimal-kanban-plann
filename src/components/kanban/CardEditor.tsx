import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card as CardType, Tag, ChecklistItem } from '@/types/kanban'
import React, { useState, useEffect } from 'react'
import { Plus, X, Calendar as CalendarIcon, Clock, Tag as TagIcon } from '@phosphor-icons/react'
import { format } from 'date-fns'

interface CardEditorProps {
  card: CardType | null
  isOpen: boolean
  onClose: () => void
  onSave: (card: CardType) => void
  onDelete: (cardId: string) => void
  availableTags: Tag[]
  onCreateTag: (name: string, color: string) => Tag
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
]

export function CardEditor({ 
  card, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  availableTags,
  onCreateTag 
}: CardEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>()
  const [scheduledTime, setScheduledTime] = useState('')
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [showTagCreator, setShowTagCreator] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  useEffect(() => {
    if (card && isOpen) {
      // Always refresh with latest data when dialog opens
      setTitle(card.title)
      setDescription(card.description || '')
      setSelectedTags(card.tags || [])
      setChecklist([...card.checklist] || []) // Create new array to force re-render
      setDueDate(card.dueDate ? new Date(card.dueDate) : undefined)
      setScheduledDate(card.scheduledDate ? new Date(card.scheduledDate) : undefined)
      setScheduledTime(card.scheduledTime || '')
    } else if (!isOpen) {
      // Clear state when dialog closes
      setTitle('')
      setDescription('')
      setSelectedTags([])
      setChecklist([])
      setDueDate(undefined)
      setScheduledDate(undefined)
      setScheduledTime('')
    }
  }, [card, isOpen])

  const handleSave = () => {
    if (!card || !title.trim()) return

    const updatedCard: CardType = {
      ...card,
      title: title.trim(),
      description,
      tags: selectedTags,
      checklist,
      dueDate: dueDate?.toISOString(),
      scheduledDate: scheduledDate?.toISOString(),
      scheduledTime
    }

    onSave(updatedCard)
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: newChecklistItem.trim(),
        completed: false
      }
      setChecklist([...checklist, newItem])
      setNewChecklistItem('')
    }
  }

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklist(checklist.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ))
  }

  const removeChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter(item => item.id !== itemId))
  }

  const toggleTag = (tag: Tag) => {
    setSelectedTags(current => 
      current.find(t => t.id === tag.id)
        ? current.filter(t => t.id !== tag.id)
        : [...current, tag]
    )
  }

  const createNewTag = () => {
    if (newTagName.trim()) {
      const newTag = onCreateTag(newTagName.trim(), newTagColor)
      setSelectedTags([...selectedTags, newTag])
      setNewTagName('')
      setShowTagCreator(false)
    }
  }

  if (!card) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do card"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do card"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="cursor-pointer"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  onClick={() => toggleTag(tag)}
                >
                  {tag.name} <X size={12} className="ml-1" />
                </Badge>
              ))}
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(tag => !selectedTags.find(t => t.id === tag.id))
                  .map(tag => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.name}
                    </Badge>
                  ))
                }
              </div>
              
              {showTagCreator ? (
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Nome da tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    {TAG_COLORS.map(color => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newTagColor === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                  <Button size="sm" onClick={createNewTag}>
                    <Plus size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowTagCreator(false)}>
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTagCreator(true)}
                  className="gap-2"
                >
                  <TagIcon size={14} />
                  Nova Tag
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Checklist</label>
            <div className="space-y-2 mb-3">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => 
                      updateChecklistItem(item.id, { completed: checked as boolean })
                    }
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeChecklistItem(item.id)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Nova tarefa"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
              />
              <Button onClick={addChecklistItem}>
                <Plus size={14} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data de Vencimento</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start gap-2">
                      <CalendarIcon size={16} />
                      {dueDate ? format(dueDate, 'dd/MM/yyyy') : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                    />
                  </PopoverContent>
                </Popover>
                {dueDate && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setDueDate(undefined)}
                    className="flex-shrink-0"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Agendar</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start gap-2">
                        <CalendarIcon size={16} />
                        {scheduledDate ? format(scheduledDate, 'dd/MM/yyyy') : 'Data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                      />
                    </PopoverContent>
                  </Popover>
                  {scheduledDate && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        setScheduledDate(undefined)
                        setScheduledTime('')
                      }}
                      className="flex-shrink-0"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Clock size={16} className="mt-2 text-muted-foreground" />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="flex-1"
                    disabled={!scheduledDate}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(card.id)
                onClose()
              }}
            >
              Excluir Card
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!title.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}