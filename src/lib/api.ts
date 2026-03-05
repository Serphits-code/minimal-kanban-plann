// API client para comunicação com o backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint: string, options: any = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token inválido ou expirado - redirecionar para login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new Event('auth:logout'));
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(name: string, email: string, password: string, role: string = 'member') {
    return this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: data,
    });
  }

  async getUsers() {
    return this.request('/auth/users');
  }

  async deleteUser(id: string) {
    return this.request(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Boards
  async getBoards() {
    return this.request('/boards');
  }

  async getBoard(id) {
    return this.request(`/boards/${id}`);
  }

  async createBoard(name) {
    return this.request('/boards', {
      method: 'POST',
      body: { name },
    });
  }

  async updateBoard(id, data) {
    return this.request(`/boards/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteBoard(id) {
    return this.request(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  // Cards
  async getCards(boardId = null) {
    const query = boardId ? `?boardId=${boardId}` : '';
    return this.request(`/cards${query}`);
  }

  async getCard(id) {
    return this.request(`/cards/${id}`);
  }

  async createCard(cardData) {
    return this.request('/cards', {
      method: 'POST',
      body: cardData,
    });
  }

  async updateCard(id: string, data: any) {
    // Sanitize data before sending
    const sanitizedData = {
      ...data,
      title: data.title || '',
      description: data.description || '',
      tags: data.tags || [],
      checklist: data.checklist || [],
      attachments: data.attachments || [],
      dueDate: data.dueDate || null,
      scheduledDate: data.scheduledDate || null,
      scheduledTime: data.scheduledTime || null,
      duration: data.duration || null,
      column: data.column || '',
      order: data.order || 0,
      completed: data.completed || false,
      boardId: data.boardId,
      assigneeId: data.assigneeId !== undefined ? data.assigneeId : null,
      priority: data.priority || 'medium',
      status: data.status || 'not_started',
      groupId: data.groupId !== undefined ? data.groupId : null,
    };
    
    return this.request(`/cards/${id}`, {
      method: 'PUT',
      body: sanitizedData,
    });
  }

  async deleteCard(id) {
    return this.request(`/cards/${id}`, {
      method: 'DELETE',
    });
  }

  async moveCard(id, newColumn, newOrder) {
    return this.request(`/cards/${id}/move`, {
      method: 'POST',
      body: { newColumn, newOrder },
    });
  }

  // Tags
  async getTags() {
    return this.request('/tags');
  }

  async createTag(name, color) {
    return this.request('/tags', {
      method: 'POST',
      body: { name, color },
    });
  }

  async updateTag(id, data) {
    return this.request(`/tags/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteTag(id) {
    return this.request(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Employees
  async getEmployees() {
    return this.request('/employees');
  }

  async getEmployee(id) {
    return this.request(`/employees/${id}`);
  }

  async createEmployee(data) {
    return this.request('/employees', {
      method: 'POST',
      body: data,
    });
  }

  async updateEmployee(id, data) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteEmployee(id) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async searchEmployees(query) {
    return this.request(`/employees/search/${encodeURIComponent(query)}`);
  }

  // Project Groups
  async getProjectGroups(boardId: string | null = null) {
    const query = boardId ? `?boardId=${boardId}` : '';
    return this.request(`/project-groups${query}`);
  }

  async getProjectGroup(id) {
    return this.request(`/project-groups/${id}`);
  }

  async createProjectGroup(data) {
    return this.request('/project-groups', {
      method: 'POST',
      body: data,
    });
  }

  async updateProjectGroup(id, data) {
    return this.request(`/project-groups/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteProjectGroup(id) {
    return this.request(`/project-groups/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();