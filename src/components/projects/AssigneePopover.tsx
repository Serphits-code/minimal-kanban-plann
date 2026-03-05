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
import { X, MagnifyingGlass, UserPlus, EnvelopeSimple } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'

interface AssigneePopoverProps {
  children: React.ReactNode
  selectedEmployee?: Employee
  employees: Employee[]
  onSelect: (employeeId: string | undefined) => void
  onCreateEmployee: (data: Partial<Employee>) => Promise<Employee>
}

export function AssigneePopover({
  children,
  selectedEmployee,
  employees,
  onSelect,
  onCreateEmployee,
}: AssigneePopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSelect = (employeeId: string) => {
    onSelect(employeeId)
    setOpen(false)
    setSearchQuery('')
  }

  const handleRemove = () => {
    onSelect(undefined)
    setOpen(false)
  }

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return
    
    try {
      const newEmployee = await onCreateEmployee({
        name: newEmployeeName.trim(),
        email: newEmployeeEmail.trim() || undefined,
      })
      onSelect(newEmployee.id)
      setIsAddingNew(false)
      setNewEmployeeName('')
      setNewEmployeeEmail('')
      setOpen(false)
    } catch (error) {
      console.error('Error creating employee:', error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            {/* Selected employee */}
            {selectedEmployee && (
              <div className="p-2 border-b">
                <div className="flex items-center justify-between bg-primary/10 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedEmployee.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedEmployee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{selectedEmployee.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRemove}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-2">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquise nomes, funções ou equipes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Separator />

            {/* Suggested people */}
            <div className="p-2">
              <span className="text-xs text-muted-foreground px-2">Pessoas sugeridas</span>
              <div className="mt-2 max-h-48 overflow-y-auto">
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors"
                    onClick={() => handleSelect(employee.id)}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{employee.name}</span>
                      {employee.role && (
                        <span className="text-xs text-muted-foreground">{employee.role}</span>
                      )}
                    </div>
                  </button>
                ))}
                {filteredEmployees.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum funcionário encontrado
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="p-2 space-y-1">
              <button
                className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors text-sm"
                onClick={() => setIsAddingNew(true)}
              >
                <EnvelopeSimple size={16} className="text-muted-foreground" />
                Convide um novo membro por e-mail
              </button>
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
