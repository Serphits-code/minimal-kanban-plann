import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash, UserCircle, SpinnerGap, Eye, EyeSlash, ArrowLeft } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  avatar?: string
  createdAt: string
}

interface UserManagementProps {
  currentUserId: string
  onBack: () => void
}

export function UserManagement({ currentUserId, onBack }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member')
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getUsers()
      setUsers(data)
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error('Preencha todos os campos')
      return
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setCreating(true)
    try {
      await apiClient.register(newName.trim(), newEmail.trim(), newPassword, newRole)
      toast.success('Usuário criado com sucesso!')
      setShowCreateDialog(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('member')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) return

    try {
      await apiClient.deleteUser(userId)
      setUsers(current => current.filter(u => u.id !== userId))
      toast.success('Usuário excluído com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuário')
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <h2 className="text-xl font-bold">Gerenciar Usuários</h2>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus size={16} />
            Novo Usuário
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <SpinnerGap size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3">
            {users.map(user => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin' : 'Membro'}
                    </Badge>
                    {user.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UserCircle size={48} className="mx-auto mb-3 opacity-40" />
                <p>Nenhum usuário cadastrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                placeholder="Nome completo"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={creating}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Função</label>
              <Select value={newRole} onValueChange={(val: 'admin' | 'member') => setNewRole(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGap size={16} className="animate-spin" />
                    Criando...
                  </span>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
