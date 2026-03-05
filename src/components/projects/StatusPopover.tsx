import React, { useState } from 'react'
import { TaskStatus, STATUS_CONFIG, Column, getColumnStatusColor } from '@/types/kanban'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Sparkle } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'

interface StatusPopoverProps {
  children: React.ReactNode
  currentStatus: TaskStatus
  currentColumn?: string
  columns?: Column[]
  onSelect: (status: TaskStatus) => void
  onColumnChange?: (columnId: string) => void
}

const statusOrder: TaskStatus[] = ['done', 'in_progress', 'paused', 'not_started']

export function StatusPopover({
  children,
  currentStatus,
  currentColumn,
  columns = [],
  onSelect,
  onColumnChange,
}: StatusPopoverProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (status: TaskStatus) => {
    onSelect(status)
    setOpen(false)
  }

  const handleColumnSelect = (columnId: string) => {
    if (onColumnChange) onColumnChange(columnId)
    setOpen(false)
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2 space-y-1">
          {sortedColumns.length > 0 ? (
            sortedColumns.map((col, index) => {
              const isSelected = col.id === currentColumn
              const color = getColumnStatusColor(index)
              return (
                <button
                  key={col.id}
                  className={`flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleColumnSelect(col.id)}
                >
                  <Badge 
                    style={{ 
                      backgroundColor: color,
                      color: 'white'
                    }}
                  >
                    {col.name}
                  </Badge>
                </button>
              )
            })
          ) : (
            statusOrder.map((status) => {
              const config = STATUS_CONFIG[status]
              const isSelected = status === currentStatus
              
              return (
                <button
                  key={status}
                  className={`flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleSelect(status)}
                >
                  <Badge 
                    style={{ 
                      backgroundColor: config.color,
                      color: 'white'
                    }}
                  >
                    {config.label}
                  </Badge>
                </button>
              )
            })
          )}
        </div>

        <Separator />

        <div className="p-2 space-y-1">
          <button
            className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors text-sm text-muted-foreground"
          >
            <Pencil size={16} />
            Editar etiquetas
          </button>
          <button
            className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors text-sm text-muted-foreground"
          >
            <Sparkle size={16} />
            Atribuir etiquetas automaticamente
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
