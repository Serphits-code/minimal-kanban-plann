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

export interface Card {
  id: string
  title: string
  description?: string
  tags: Tag[]
  checklist: ChecklistItem[]
  dueDate?: string
  scheduledDate?: string
  scheduledTime?: string
  column: 'todo' | 'progress' | 'done'
  boardId: string
  createdAt: string
}

export interface Board {
  id: string
  name: string
  createdAt: string
}

export interface ScheduledCard {
  cardId: string
  date: string
  time: string
}