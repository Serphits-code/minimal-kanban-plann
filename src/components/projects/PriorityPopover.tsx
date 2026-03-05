import React, { useState } from 'react'
import { Priority, PRIORITY_CONFIG } from '@/types/kanban'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Pencil, Sparkle, Warning } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'

interface PriorityPopoverProps {
  children: React.ReactNode
  currentPriority: Priority
  onSelect: (priority: Priority) => void
}

const priorityOrder: Priority[] = ['critical', 'high', 'medium', 'low']

export function PriorityPopover({
  children,
  currentPriority,
  onSelect,
}: PriorityPopoverProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (priority: Priority) => {
    onSelect(priority)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="p-2 space-y-1">
          {priorityOrder.map((priority) => {
            const config = PRIORITY_CONFIG[priority]
            const isSelected = priority === currentPriority
            
            return (
              <button
                key={priority}
                className={`flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors ${
                  isSelected ? 'bg-muted' : ''
                }`}
                onClick={() => handleSelect(priority)}
              >
                <Badge 
                  className="flex items-center gap-1"
                  style={{ 
                    backgroundColor: config.color,
                    color: 'white'
                  }}
                >
                  {priority === 'critical' && <Warning size={12} />}
                  {config.label}
                </Badge>
              </button>
            )
          })}
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
