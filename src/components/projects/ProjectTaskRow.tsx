import React, { useState } from 'react'
import { Card as CardType, Employee, Priority, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG, Attachment, Column, getColumnStatusColor } from '@/types/kanban'
import { AssigneePopover } from './AssigneePopover'
import { StatusPopover } from './StatusPopover'
import { PriorityPopover } from './PriorityPopover'
import { DueDatePopover } from './DueDatePopover'
import { FilePopover } from './FilePopover'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DotsSixVertical, Trash, Paperclip } from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProjectTaskRowProps {
  card: CardType
  employees: Employee[]
  columns?: Column[]
  getEmployeeById: (id: string | undefined) => Employee | undefined
  onUpdate: (updates: Partial<CardType>) => void
  onDelete: () => void
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onCreateEmployee: (data: Partial<Employee>) => Promise<Employee>
}

export function ProjectTaskRow({
  card,
  employees,
  columns = [],
  getEmployeeById,
  onUpdate,
  onDelete,
  onClick,
  onDragStart,
  onDragEnd,
  onCreateEmployee,
}: ProjectTaskRowProps) {
  const [isDragging, setIsDragging] = useState(false)
  
  const assignee = getEmployeeById(card.assigneeId)
  const statusConfig = STATUS_CONFIG[card.status || 'not_started']
  const priorityConfig = PRIORITY_CONFIG[card.priority || 'medium']

  // Derive column info for status display
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)
  const currentColumnIndex = sortedColumns.findIndex(c => c.id === card.column)
  const currentColumn = sortedColumns[currentColumnIndex]
  const columnColor = currentColumnIndex >= 0 ? getColumnStatusColor(currentColumnIndex) : statusConfig.color
  const columnLabel = currentColumn ? currentColumn.name : statusConfig.label

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    onDragStart(e)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    onDragEnd()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDueDate = (dateStr: string | undefined) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return format(date, "d 'de' MMM", { locale: ptBR })
    } catch {
      return null
    }
  }

  const handleAddAttachment = (attachment: Attachment) => {
    const currentAttachments = card.attachments || []
    onUpdate({ attachments: [...currentAttachments, attachment] })
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    const currentAttachments = card.attachments || []
    onUpdate({ attachments: currentAttachments.filter(a => a.id !== attachmentId) })
  }

  return (
    <TableRow 
      className={`group hover:bg-muted/50 cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Drag handle */}
      <TableCell className="w-8 p-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={card.completed}
            onCheckedChange={(checked) => onUpdate({ completed: !!checked })}
            onClick={(e) => e.stopPropagation()}
          />
          <DotsSixVertical 
            size={16} 
            className="text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </TableCell>

      {/* Task title */}
      <TableCell 
        className="font-medium min-w-[200px]"
        onClick={onClick}
      >
        <span className={card.completed ? 'line-through text-muted-foreground' : ''}>
          {card.title}
        </span>
      </TableCell>

      {/* Assignee */}
      <TableCell className="w-[120px]" onClick={(e) => e.stopPropagation()}>
        <AssigneePopover
          selectedEmployee={assignee}
          employees={employees}
          onSelect={(employeeId) => onUpdate({ assigneeId: employeeId })}
          onCreateEmployee={onCreateEmployee}
        >
          <button className="flex items-center gap-2 hover:bg-muted rounded p-1 w-full">
            {assignee ? (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback className="text-xs bg-primary/10">
                    {getInitials(assignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{assignee.name.split(' ')[0]}</span>
              </>
            ) : (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-muted">
                  ?
                </AvatarFallback>
              </Avatar>
            )}
          </button>
        </AssigneePopover>
      </TableCell>

      {/* Status */}
      <TableCell className="w-[140px]" onClick={(e) => e.stopPropagation()}>
        <StatusPopover
          currentStatus={card.status || 'not_started'}
          currentColumn={card.column}
          columns={columns}
          onSelect={(status) => onUpdate({ status })}
          onColumnChange={(columnId) => onUpdate({ column: columnId })}
        >
          <Badge 
            className="cursor-pointer"
            style={{ 
              backgroundColor: columnColor,
              color: 'white'
            }}
          >
            {columnLabel}
          </Badge>
        </StatusPopover>
      </TableCell>

      {/* Due date */}
      <TableCell className="w-[140px]" onClick={(e) => e.stopPropagation()}>
        <DueDatePopover
          scheduledDate={card.scheduledDate}
          currentDate={card.dueDate}
          onSelect={(sched, due) => onUpdate({ scheduledDate: sched, dueDate: due })}
        >
          <button className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded px-2 py-1 text-left">
            {card.scheduledDate && card.dueDate
              ? `${formatDueDate(card.scheduledDate)} → ${formatDueDate(card.dueDate)}`
              : formatDueDate(card.dueDate) || 'Sem período'}
          </button>
        </DueDatePopover>
      </TableCell>

      {/* Priority */}
      <TableCell className="w-[100px]" onClick={(e) => e.stopPropagation()}>
        <PriorityPopover
          currentPriority={card.priority || 'medium'}
          onSelect={(priority) => onUpdate({ priority })}
        >
          <Badge 
            className="cursor-pointer"
            style={{ 
              backgroundColor: priorityConfig.color,
              color: 'white'
            }}
          >
            {priorityConfig.label}
          </Badge>
        </PriorityPopover>
      </TableCell>

      {/* Files */}
      <TableCell className="w-[100px]" onClick={(e) => e.stopPropagation()}>
        <FilePopover
          attachments={card.attachments || []}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
        >
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded px-2 py-1">
            <Paperclip size={14} />
            <span>{(card.attachments || []).length}</span>
          </button>
        </FilePopover>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash size={14} />
        </Button>
      </TableCell>
    </TableRow>
  )
}
