import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Board } from '@/types/kanban'

interface BoardSelectorProps {
  boards: Board[]
  activeBoard: string
  onBoardChange: (boardId: string) => void
}

export function BoardSelector({ boards, activeBoard, onBoardChange }: BoardSelectorProps) {
  const activeBoardData = boards.find(board => board.id === activeBoard)

  if (boards.length === 0) {
    return <div className="text-sm text-muted-foreground">Nenhum quadro</div>
  }

  return (
    <Select value={activeBoard} onValueChange={onBoardChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Selecionar quadro" />
      </SelectTrigger>
      <SelectContent>
        {boards.map(board => (
          <SelectItem key={board.id} value={board.id}>
            {board.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}