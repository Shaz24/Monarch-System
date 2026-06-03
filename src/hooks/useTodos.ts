import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export type TodoPriority = 'critical' | 'high' | 'medium' | 'low';
export type TodoStatus = 'active' | 'in-progress' | 'done' | 'archived';
export type TodoCategory = 'personal' | 'work' | 'fitness' | 'learning' | 'project' | 'idea' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  category: TodoCategory;
  tags: string[];
  subtasks: SubTask[];
  due_date?: string;         // ISO date string
  estimated_minutes?: number;
  xp_reward: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  pinned: boolean;
  color_accent?: string;     // custom hex
}

const STORAGE_KEY = 'monarch_todos';

function loadFromStorage(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    /* quota exceeded or SSR */
  }
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => loadFromStorage());
  const [loading] = useState(false);

  // Persist on every change
  useEffect(() => {
    saveToStorage(todos);
  }, [todos]);

  const addTodo = useCallback((data: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'status' | 'subtasks' | 'tags'> & {
    tags?: string[];
    subtasks?: SubTask[];
  }) => {
    const now = new Date().toISOString();
    const newTodo: Todo = {
      id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: 'active',
      category: data.category,
      tags: data.tags || [],
      subtasks: data.subtasks || [],
      due_date: data.due_date,
      estimated_minutes: data.estimated_minutes,
      xp_reward: data.xp_reward,
      pinned: data.pinned || false,
      color_accent: data.color_accent,
      created_at: now,
      updated_at: now,
    };
    setTodos(prev => [newTodo, ...prev]);
    toast.success(`📋 Task created! +${data.xp_reward} XP on completion`);
    return newTodo;
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      )
    );
  }, []);

  const completeTodo = useCallback((id: string) => {
    const now = new Date().toISOString();
    setTodos(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const xp = t.xp_reward;
        // Dispatch XP event just like tasks/fitness do
        window.dispatchEvent(new CustomEvent('monarch-xp-granted', {
          detail: { xpAdded: xp, statNames: ['discipline'] }
        }));
        window.dispatchEvent(new CustomEvent('monarch-db-sync'));
        toast.success(`✅ Task done! +${xp} XP earned!`);
        return { ...t, status: 'done' as TodoStatus, completed_at: now, updated_at: now };
      })
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    toast.success('Task deleted');
  }, []);

  const togglePin = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, pinned: !t.pinned, updated_at: new Date().toISOString() } : t)
    );
  }, []);

  const toggleSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos(prev =>
      prev.map(t => {
        if (t.id !== todoId) return t;
        const subtasks = t.subtasks.map(s =>
          s.id === subtaskId ? { ...s, done: !s.done } : s
        );
        return { ...t, subtasks, updated_at: new Date().toISOString() };
      })
    );
  }, []);

  const addSubtask = useCallback((todoId: string, title: string) => {
    const newSub: SubTask = {
      id: `sub_${Date.now()}`,
      title,
      done: false,
    };
    setTodos(prev =>
      prev.map(t =>
        t.id === todoId
          ? { ...t, subtasks: [...t.subtasks, newSub], updated_at: new Date().toISOString() }
          : t
      )
    );
  }, []);

  const deleteSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos(prev =>
      prev.map(t =>
        t.id === todoId
          ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId), updated_at: new Date().toISOString() }
          : t
      )
    );
  }, []);

  const archiveDone = useCallback(() => {
    setTodos(prev =>
      prev.map(t => t.status === 'done' ? { ...t, status: 'archived' as TodoStatus } : t)
    );
    toast.success('Completed tasks archived');
  }, []);

  const clearArchived = useCallback(() => {
    setTodos(prev => prev.filter(t => t.status !== 'archived'));
    toast.success('Archived tasks cleared');
  }, []);

  // Stats
  const stats = {
    total: todos.filter(t => t.status !== 'archived').length,
    active: todos.filter(t => t.status === 'active').length,
    inProgress: todos.filter(t => t.status === 'in-progress').length,
    done: todos.filter(t => t.status === 'done').length,
    archived: todos.filter(t => t.status === 'archived').length,
    overdue: todos.filter(t => {
      if (!t.due_date || t.status === 'done' || t.status === 'archived') return false;
      return new Date(t.due_date) < new Date();
    }).length,
    todayXp: todos
      .filter(t => {
        if (t.status !== 'done' || !t.completed_at) return false;
        const today = new Date();
        const completed = new Date(t.completed_at);
        return completed.toDateString() === today.toDateString();
      })
      .reduce((sum, t) => sum + t.xp_reward, 0),
  };

  return {
    todos,
    loading,
    stats,
    addTodo,
    updateTodo,
    completeTodo,
    deleteTodo,
    togglePin,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    archiveDone,
    clearArchived,
  };
}
