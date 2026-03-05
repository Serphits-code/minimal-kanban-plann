import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Board, Card, Tag, Column } from '@/types/kanban';
import { toast } from 'sonner';

// Hook para gerenciar boards com API
export function useApiBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Carregar boards do backend
  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBoards();
      setBoards(data);
      
      // Se não há board ativo e existem boards, selecionar o primeiro
      if (!activeBoard && data.length > 0) {
        setActiveBoard(data[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar boards: ' + error.message);
      console.error('Error loading boards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const createBoard = async (name: string) => {
    try {
      const newBoard = await apiClient.createBoard(name);
      setBoards(current => [...current, newBoard]);
      setActiveBoard(newBoard.id);
      return newBoard;
    } catch (error) {
      toast.error('Erro ao criar board: ' + error.message);
      throw error;
    }
  };

  const deleteBoard = async (boardId: string) => {
    try {
      await apiClient.deleteBoard(boardId);
      setBoards(current => current.filter(board => board.id !== boardId));
      
      if (activeBoard === boardId) {
        const remainingBoards = boards.filter(board => board.id !== boardId);
        setActiveBoard(remainingBoards.length > 0 ? remainingBoards[0].id : '');
      }
    } catch (error) {
      toast.error('Erro ao deletar board: ' + error.message);
      throw error;
    }
  };

  const addColumn = async (boardId: string, name: string) => {
    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      const newColumn: Column = {
        id: crypto.randomUUID(),
        name,
        order: board.columns.length
      };

      const updatedColumns = [...board.columns, newColumn];
      await apiClient.updateBoard(boardId, { name: board.name, columns: updatedColumns });
      
      setBoards(current => 
        current.map(b => 
          b.id === boardId ? { ...b, columns: updatedColumns } : b
        )
      );
    } catch (error) {
      toast.error('Erro ao adicionar coluna: ' + error.message);
      throw error;
    }
  };

  const updateColumn = async (boardId: string, columnId: string, updates: Partial<Column>) => {
    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      const updatedColumns = board.columns.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      );

      await apiClient.updateBoard(boardId, { name: board.name, columns: updatedColumns });
      
      setBoards(current => 
        current.map(b => 
          b.id === boardId ? { ...b, columns: updatedColumns } : b
        )
      );
    } catch (error) {
      toast.error('Erro ao atualizar coluna: ' + error.message);
      throw error;
    }
  };

  const deleteColumn = async (boardId: string, columnId: string) => {
    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      const updatedColumns = board.columns.filter(col => col.id !== columnId);
      await apiClient.updateBoard(boardId, { name: board.name, columns: updatedColumns });
      
      setBoards(current => 
        current.map(b => 
          b.id === boardId ? { ...b, columns: updatedColumns } : b
        )
      );
    } catch (error) {
      toast.error('Erro ao deletar coluna: ' + error.message);
      throw error;
    }
  };

  const reorderColumns = async (boardId: string, sourceIndex: number, destinationIndex: number) => {
    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      const newColumns = [...board.columns];
      const [removed] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(destinationIndex, 0, removed);
      
      // Atualizar ordem
      const updatedColumns = newColumns.map((col, index) => ({ ...col, order: index }));
      
      await apiClient.updateBoard(boardId, { name: board.name, columns: updatedColumns });
      
      setBoards(current => 
        current.map(b => 
          b.id === boardId ? { ...b, columns: updatedColumns } : b
        )
      );
    } catch (error) {
      toast.error('Erro ao reordenar colunas: ' + error.message);
      throw error;
    }
  };

  return {
    boards,
    activeBoard,
    loading,
    setActiveBoard,
    createBoard,
    deleteBoard,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    refreshBoards: loadBoards
  };
}

// Hook para gerenciar cards com API
export function useApiCards(boardId: string) {
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar cards do backend
  const loadCards = async () => {
    try {
      setLoading(true);
      // Carregar todos os cards
      const allData = await apiClient.getCards();
      setAllCards(allData);
      
      // Filtrar cards do board ativo
      const boardData = boardId ? allData.filter(card => card.boardId === boardId) : [];
      setCards(boardData);
    } catch (error) {
      toast.error('Erro ao carregar cards: ' + error.message);
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [boardId]);

  const getAllCards = () => allCards;

  const createCard = async (title: string, columnId: string, groupId?: string) => {
    try {
      const newCard = await apiClient.createCard({
        title,
        column: columnId,
        boardId,
        description: '',
        tags: [],
        checklist: [],
        attachments: [],
        groupId: groupId || null
      });
      
      setCards(current => [...current, newCard]);
      setAllCards(current => [...current, newCard]);
    } catch (error) {
      toast.error('Erro ao criar card: ' + error.message);
      throw error;
    }
  };

  const updateCard = async (cardId: string, updates: Partial<Card>) => {
    try {
      // Encontrar o card original para preservar propriedades importantes
      const originalCard = allCards.find(card => card.id === cardId);
      if (!originalCard) {
        throw new Error('Card não encontrado');
      }

      // Garantir que todas as propriedades do card original sejam preservadas
      // e apenas as propriedades explicitamente passadas em updates sejam alteradas
      const updatesWithDefaults = {
        ...originalCard, // Copiar todas as propriedades do card original
        ...updates, // Sobrescrever apenas as propriedades que foram explicitamente atualizadas
      };

      const updatedCard = await apiClient.updateCard(cardId, updatesWithDefaults);
      
      setCards(current => 
        current.map(card => 
          card.id === cardId ? updatedCard : card
        )
      );
      
      setAllCards(current => 
        current.map(card => 
          card.id === cardId ? updatedCard : card
        )
      );
    } catch (error) {
      toast.error('Erro ao atualizar card: ' + error.message);
      throw error;
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      await apiClient.deleteCard(cardId);
      setCards(current => current.filter(card => card.id !== cardId));
      setAllCards(current => current.filter(card => card.id !== cardId));
    } catch (error) {
      toast.error('Erro ao deletar card: ' + error.message);
      throw error;
    }
  };

  const deleteAllCardsFromBoard = async (boardId: string) => {
    try {
      const boardCards = allCards.filter(card => card.boardId === boardId);
      await Promise.all(boardCards.map(card => apiClient.deleteCard(card.id)));
      
      setCards(current => current.filter(card => card.boardId !== boardId));
      setAllCards(current => current.filter(card => card.boardId !== boardId));
    } catch (error) {
      toast.error('Erro ao deletar cards do board: ' + error.message);
      throw error;
    }
  };

  const moveCard = async (cardId: string, newColumn: string, newOrder?: number) => {
    try {
      const card = cards.find(c => c.id === cardId) || allCards.find(c => c.id === cardId);
      if (!card) return;

      const order = newOrder !== undefined ? newOrder : 0;
      
      await apiClient.moveCard(cardId, newColumn, order);
      
      const updatedCard = { ...card, column: newColumn, order };
      
      setCards(current => 
        current.map(c => 
          c.id === cardId ? updatedCard : c
        )
      );
      
      setAllCards(current => 
        current.map(c => 
          c.id === cardId ? updatedCard : c
        )
      );
    } catch (error) {
      toast.error('Erro ao mover card: ' + error.message);
      throw error;
    }
  };

  const reorderCard = async (cardId: string, newOrder: number) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      await updateCard(cardId, { order: newOrder });
    } catch (error) {
      toast.error('Erro ao reordenar card: ' + error.message);
      throw error;
    }
  };

  return {
    cards,
    loading,
    getAllCards,
    createCard,
    updateCard,
    deleteCard,
    deleteAllCardsFromBoard,
    moveCard,
    reorderCard,
    refreshCards: loadCards
  };
}

// Hook para gerenciar tags com API
export function useApiTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar tags do backend
  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTags();
      setTags(data);
    } catch (error) {
      toast.error('Erro ao carregar tags: ' + error.message);
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const createTag = async (name: string, color: string) => {
    try {
      const newTag = await apiClient.createTag(name, color);
      setTags(current => [...current, newTag]);
      return newTag;
    } catch (error) {
      toast.error('Erro ao criar tag: ' + error.message);
      throw error;
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      await apiClient.deleteTag(tagId);
      setTags(current => current.filter(tag => tag.id !== tagId));
    } catch (error) {
      toast.error('Erro ao deletar tag: ' + error.message);
      throw error;
    }
  };

  return {
    tags,
    loading,
    createTag,
    deleteTag,
    refreshTags: loadTags
  };
}