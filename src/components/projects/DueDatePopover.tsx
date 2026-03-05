import React, { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { X, Clock, Sparkle } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

interface DueDatePopoverProps {
  children: React.ReactNode
  scheduledDate?: string
  currentDate: string | undefined
  onSelect: (scheduledDate: string | undefined, dueDate: string | undefined) => void
}

export function DueDatePopover({
  children,
  scheduledDate,
  currentDate,
  onSelect,
}: DueDatePopoverProps) {
  const [open, setOpen] = useState(false)

  const fromDate = scheduledDate ? new Date(scheduledDate) : undefined
  const toDate = currentDate ? new Date(currentDate) : undefined

  const handleSelect = (range: DateRange | undefined) => {
    onSelect(
      range?.from ? range.from.toISOString() : undefined,
      range?.to ? range.to.toISOString() : undefined,
    )
    if (range?.from && range?.to) setOpen(false)
  }

  const handleClear = () => {
    onSelect(undefined, undefined)
    setOpen(false)
  }

  const labelText = fromDate && toDate
    ? `${format(fromDate, 'dd/MM')} → ${format(toDate, 'dd/MM/yy')}`
    : fromDate
    ? `${format(fromDate, 'dd/MM/yy')} → ...`
    : toDate
    ? format(toDate, 'dd/MM/yy')
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Período do projeto</span>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground h-7 w-7 p-0">
              <X size={14} />
            </Button>
          )}
        </div>
        {labelText && (
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-b text-center">
            {labelText}
          </div>
        )}
        <Calendar
          mode="range"
          selected={{ from: fromDate, to: toDate }}
          onSelect={handleSelect}
          initialFocus
        />
        <div className="p-2 border-t">
          <button
            className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors text-sm text-muted-foreground"
          >
            <Sparkle size={16} />
            Preencher data automaticamente...
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
