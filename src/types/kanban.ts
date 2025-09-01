export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
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
  dueDate?: string
  scheduledDate?: string
  scheduledTime?: string
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