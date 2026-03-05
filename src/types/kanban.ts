export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Column {
  id: string
  name: string
  order: number
}

export interface Employee {
  id: string
  name: string
  email?: string
  avatar?: string
  role?: string
  userId?: string
  createdAt: string
}

export interface ProjectGroup {
  id: string
  name: string
  boardId: string
  order: number
  color: string
  createdAt: string
}

export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'paused'

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  critical: { label: 'Crítico', color: '#7c3aed' },
  high: { label: 'Alta', color: '#3b82f6' },
  medium: { label: 'Média', color: '#22c55e' },
  low: { label: 'Baixa', color: '#6366f1' }
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  not_started: { label: 'Não iniciado', color: '#9ca3af' },
  in_progress: { label: 'Em andamento', color: '#f97316' },
  done: { label: 'Feito', color: '#22c55e' },
  paused: { label: 'Parado', color: '#eab308' }
}

// Dynamic color palette for columns when used as status
export const COLUMN_STATUS_COLORS: string[] = [
  '#9ca3af', // 1st column (e.g. A Fazer) - gray
  '#f97316', // 2nd column (e.g. Em Progresso) - orange
  '#22c55e', // 3rd column (e.g. Concluído) - green
  '#3b82f6', // 4th column - blue
  '#8b5cf6', // 5th column - purple
  '#eab308', // 6th column - yellow
  '#ec4899', // 7th column - pink
  '#06b6d4', // 8th column - cyan
]

export function getColumnStatusColor(index: number): string {
  return COLUMN_STATUS_COLORS[index % COLUMN_STATUS_COLORS.length]
}

export interface Card {
  id: string
  title: string
  description?: string
  tags: Tag[]
  checklist: ChecklistItem[]
  attachments: Attachment[]
  dueDate?: string
  scheduledDate?: string
  scheduledTime?: string
  duration?: number // Duration in hours (1, 2, 3, etc.)
  column: string
  boardId: string
  order: number
  completed: boolean
  createdAt: string
  // New fields for Projects view
  assigneeId?: string
  assignee?: Employee
  priority?: Priority
  status?: TaskStatus
  groupId?: string
}

export interface Board {
  id: string
  name: string
  columns: Column[]
  createdAt: string
}

export interface ScheduledCard {
  cardId: string
  date: string
  time: string
}