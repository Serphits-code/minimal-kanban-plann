import React, { useState } from 'react'
import { Employee } from '@/types/kanban'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X, MagnifyingGlass, UserPlus, Check } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'

interface AssigneePopoverProps {
  children: React.ReactNode
  /** Legacy single-select */
  selectedEmployee?: Employee
  /** Multi-select list */
  selectedEmployees?: Employee[]
  employees: Employee[]
  onSelect: (employeeId: string | undefined) => void
  /** Called when multiple ids change */
  onSelectMultiple?: (employeeIds: string[]) => void
  onCreateEmployee: (data: Partial<Employee>) => Promise<Employee>
}

export function AssigneePopover({
  children,
  selectedEmployee,
  selectedEmployees,
  employees,
  onSelect,
  onSelectMultiple,
  onCreateEmployee,
}: AssigneePopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')

  const isMulti = typeof onSelectMultiple === 'function'

  const selectedIds: string[] = isMulti
    ? (selectedEmployees ?? (selectedEmployee ? [selectedEmployee] : [])).map(e => e.id)
    : selectedEmployee ? [selectedEmployee.id] : []

  const currentSelected: Employee[] = isMulti
    ? (selectedEmployees ?? employees.filter(e => selectedIds.includes(e.id)))
    : selectedEmployee ? [selectedEmployee] : []

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleToggle = (employeeId: string) => {
    if (isMulti) {
      const next = selectedIds.includes(employeeId)
        ? selectedIds.filter(id => id !== employeeId)
        : [...selectedIds, employeeId]
      onSelectMultiple!(next)
    } else {
      onSelect(selectedIds[0] === employeeId ? undefined : employeeId)
      setOpen(false)
      setSearchQuery('')
    }
  }

  const handleRemoveOne = (employeeId: string) => {
    if (isMulti) {
      onSelectMultiple!(selectedIds.filter(id => id !== employeeId))
    } else {
      onSelect(undefined)
      setOpen(false)
    }
  }

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return
    try {
      const newEmployee = await onCreateEmployee({
        name: newEmployeeName.trim(),
        email: newEmployeeEmail.trim() || undefined,
      })
      if (isMulti) {
        onSelectMultiple!([...selectedIds, newEmployee.id])
      } else {
        onSelect(newEmployee.id)
        setOpen(false)
      }
      setIsAddingNew(false)
      setNewEmployeeName('')
      setNewEmployeeEmail('')
    } catch (error) {
      console.error('Error creating employee:', error)
    }
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearchQuery('') }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {isAddingNew ? (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Novo membro</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsAddingNew(false)}
              >
                <X size={14} />
              </Button>
            </div>
            <Input
              placeholder="Nome"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="E-mail (opcional)"
              type="email"
              value={newEmployeeEmail}
              onChange={(e) => setNewEmployeeEmail(e.target.value)}
            />
            <Button
              className="w-full"
              size="sm"
              onClick={handleAddEmployee}
              disabled={!newEmployeeName.trim()}
            >
              Adicionar
            </Button>
          </div>
        ) : (
          <>
            {/* Selected employees */}
            {currentSelected.length > 0 && (
              <div className="p-2 border-b space-y-1">
                {currentSelected.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between bg-primary/10 rounded-lg px-2 py-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={emp.avatar} />
                        <AvatarFallback className="text-[9px]">{getInitials(emp.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{emp.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleRemoveOne(emp.id)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="p-2">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Separator />

            {/* Employee list */}
            <div className="p-2">
              <span className="text-xs text-muted-foreground px-2">Pessoas</span>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
                {filteredEmployees.map((employee) => {
                  const isSelected = selectedIds.includes(employee.id)
                  return (
                    <button
                      key={employee.id}
                      className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors text-left ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => handleToggle(employee.id)}
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback className="text-xs">{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-sm truncate w-full">{employee.name}</span>
                        {employee.role && (
                          <span className="text-xs text-muted-foreground truncate w-full">{employee.role}</span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-primary flex-shrink-0" />}
                    </button>
                  )
                })}
                {filteredEmployees.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum funcionário encontrado
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="p-2">
              <button
                className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors text-sm"
                onClick={() => setIsAddingNew(true)}
              >
                <UserPlus size={16} className="text-muted-foreground" />
                Adicionar novo funcionário
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
