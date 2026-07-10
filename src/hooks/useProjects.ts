import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Employee, ProjectGroup } from '@/types/kanban';
import { toast } from 'sonner';

// Hook para gerenciar funcionários
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getEmployees();
      setEmployees(data);
    } catch (error: any) {
      toast.error('Erro ao carregar funcionários: ' + error.message);
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Real-time sync
  useEffect(() => {
    const socket = getSocket();
    const onCreated = (emp: Employee) => setEmployees(cur => cur.some(e => e.id === emp.id) ? cur : [...cur, emp]);
    const onUpdated = (emp: Employee) => setEmployees(cur => cur.map(e => e.id === emp.id ? emp : e));
    const onDeleted = ({ id }: { id: string }) => setEmployees(cur => cur.filter(e => e.id !== id));
    socket.on('employee:created', onCreated);
    socket.on('employee:updated', onUpdated);
    socket.on('employee:deleted', onDeleted);
    return () => {
      socket.off('employee:created', onCreated);
      socket.off('employee:updated', onUpdated);
      socket.off('employee:deleted', onDeleted);
    };
  }, []);

  const createEmployee = async (data: Partial<Employee>) => {
    try {
      const newEmployee = await apiClient.createEmployee(data);
      setEmployees(current => [...current, newEmployee]);
      return newEmployee;
    } catch (error: any) {
      toast.error('Erro ao criar funcionário: ' + error.message);
      throw error;
    }
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      const updatedEmployee = await apiClient.updateEmployee(id, data);
      setEmployees(current => 
        current.map(emp => emp.id === id ? updatedEmployee : emp)
      );
      return updatedEmployee;
    } catch (error: any) {
      toast.error('Erro ao atualizar funcionário: ' + error.message);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await apiClient.deleteEmployee(id);
      setEmployees(current => current.filter(emp => emp.id !== id));
    } catch (error: any) {
      toast.error('Erro ao deletar funcionário: ' + error.message);
      throw error;
    }
  };

  const searchEmployees = async (query: string) => {
    try {
      if (!query.trim()) {
        return employees;
      }
      return await apiClient.searchEmployees(query);
    } catch (error: any) {
      console.error('Error searching employees:', error);
      return employees.filter(emp => 
        emp.name.toLowerCase().includes(query.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(query.toLowerCase()))
      );
    }
  };

  const getEmployeeById = (id: string | undefined) => {
    if (!id) return undefined;
    return employees.find(emp => emp.id === id);
  };

  return {
    employees,
    loading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees,
    getEmployeeById,
    refreshEmployees: loadEmployees
  };
}

// Hook para gerenciar grupos de projeto
export function useProjectGroups(boardId: string) {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    if (!boardId) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getProjectGroups(boardId);
      setGroups(data);
    } catch (error: any) {
      toast.error('Erro ao carregar grupos: ' + error.message);
      console.error('Error loading project groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [boardId]);

  // Real-time sync - stable listener with ref
  const boardIdRef = useRef(boardId);
  useEffect(() => { boardIdRef.current = boardId; }, [boardId]);

  useEffect(() => {
    const socket = getSocket();
    const onCreated = (group: ProjectGroup) => {
      if (group.boardId === boardIdRef.current) {
        setGroups(cur => cur.some(g => g.id === group.id) ? cur : [...cur, group]);
      }
    };
    const onUpdated = (group: ProjectGroup) => {
      setGroups(cur => cur.map(g => g.id === group.id ? group : g));
    };
    const onDeleted = ({ id }: { id: string }) => setGroups(cur => cur.filter(g => g.id !== id));
    socket.on('group:created', onCreated);
    socket.on('group:updated', onUpdated);
    socket.on('group:deleted', onDeleted);
    return () => {
      socket.off('group:created', onCreated);
      socket.off('group:updated', onUpdated);
      socket.off('group:deleted', onDeleted);
    };
  }, []);

  const createGroup = async (name: string, color?: string) => {
    try {
      const newGroup = await apiClient.createProjectGroup({ name, boardId, color });
      setGroups(current => [...current, newGroup]);
      return newGroup;
    } catch (error: any) {
      toast.error('Erro ao criar grupo: ' + error.message);
      throw error;
    }
  };

  const updateGroup = async (id: string, data: Partial<ProjectGroup>) => {
    try {
      const updatedGroup = await apiClient.updateProjectGroup(id, data);
      setGroups(current => 
        current.map(group => group.id === id ? updatedGroup : group)
      );
      return updatedGroup;
    } catch (error: any) {
      toast.error('Erro ao atualizar grupo: ' + error.message);
      throw error;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await apiClient.deleteProjectGroup(id);
      setGroups(current => current.filter(group => group.id !== id));
    } catch (error: any) {
      toast.error('Erro ao deletar grupo: ' + error.message);
      throw error;
    }
  };

  const getGroupById = (id: string | undefined) => {
    if (!id) return undefined;
    return groups.find(group => group.id === id);
  };

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    refreshGroups: loadGroups
  };
}
