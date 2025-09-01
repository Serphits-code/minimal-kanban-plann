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
  createdAt: string
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