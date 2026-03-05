import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Column } from '@/types/kanban'
import { Plus, Pencil, Trash, DotsNine } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ColumnEditorProps {
  isOpen: boolean
  onClose: () => void
  columns: Column[]
  onAddColumn: (name: string) => void
  onUpdateColumn: (columnId: string, updates: Partial<Column>) => void
  onDeleteColumn: (columnId: string) => void
  onReorderColumns: (sourceIndex: number, destinationIndex: number) => void
}

export function ColumnEditor({
  isOpen,
  onClose,
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns
}: ColumnEditorProps) {
  const [newColumnName, setNewColumnName] = useState('')
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      onAddColumn(newColumnName.trim())
      setNewColumnName('')
      toast.success('Coluna adicionada!')
    }
  }

  const handleUpdateColumn = (columnId: string) => {
    if (editingName.trim()) {
      onUpdateColumn(columnId, { name: editingName.trim() })
      setEditingColumn(null)
      setEditingName('')
      toast.success('Coluna atualizada!')
    }
  }

  const handleDeleteColumn = (columnId: string) => {
    onDeleteColumn(columnId)
    toast.success('Coluna excluída!')
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem !== null && draggedItem !== dropIndex) {
      onReorderColumns(draggedItem, dropIndex)
    }
    setDraggedItem(null)
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Colunas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new column */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova coluna"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            />
            <Button onClick={handleAddColumn} size="sm">
              <Plus size={16} />
            </Button>
          </div>

          {/* Existing columns */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Colunas existentes:</h4>
            {sortedColumns.map((column, index) => (
              <div
                key={column.id}
                className={`flex items-center gap-2 p-2 border rounded-lg ${
                  draggedItem === index ? 'opacity-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <DotsNine size={16} className="text-muted-foreground cursor-grab" />
                
                {editingColumn === column.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateColumn(column.id)
                        if (e.key === 'Escape') {
                          setEditingColumn(null)
                          setEditingName('')
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateColumn(column.id)}
                    >
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1">{column.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingColumn(column.id)
                        setEditingName(column.name)
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteColumn(column.id)}
                      disabled={columns.length <= 1}
                    >
                      <Trash size={14} />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}