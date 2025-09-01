import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Board } from '@/types/kanban'
import { Trash, DotsThree } from '@phosphor-icons/react'

interface BoardSelectorProps {
  boards: Board[]
  activeBoard: string
  onBoardChange: (boardId: string) => void
  onDeleteBoard: (boardId: string) => void
}

export function BoardSelector({ boards, activeBoard, onBoardChange, onDeleteBoard }: BoardSelectorProps) {
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null)
  const activeBoardData = boards.find(board => board.id === activeBoard)

  if (boards.length === 0) {
    return <div className="text-sm text-muted-foreground">Nenhum quadro</div>
  }

  const handleDeleteBoard = () => {
    if (boardToDelete) {
      onDeleteBoard(boardToDelete.id)
      setBoardToDelete(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
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

        {activeBoardData && boards.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <DotsThree size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setBoardToDelete(activeBoardData)}
                className="text-destructive"
              >
                <Trash size={16} className="mr-2" />
                Excluir quadro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={!!boardToDelete} onOpenChange={() => setBoardToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir quadro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o quadro "{boardToDelete?.name}"?
              <br />
              <span className="font-medium text-destructive">
                Todos os cards e dados deste quadro serão perdidos permanentemente.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoardToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteBoard}>
              Excluir quadro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}