import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'todos';
const AUTO_CLEAN_DAYS = 30;

// 生成唯一 ID（兼容旧 WebView）
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// 从 localStorage 读取（带 try-catch 保护）
function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// 清理完成超过 30 天的任务
function autoClean(todos) {
  const now = Date.now();
  const threshold = AUTO_CLEAN_DAYS * 24 * 60 * 60 * 1000;
  return todos.filter((todo) => {
    if (!todo.completed) return true;
    // 用 completedAt 判断，旧数据无 completedAt 则跳过（不清理）
    if (!todo.completedAt) return true;
    return now - todo.completedAt < threshold;
  });
}

// Todo 数据管理 Hook
export default function useTodos() {
  const [todos, setTodos] = useState(() => autoClean(loadTodos()));

  // 数据变化时写入 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // 隐私模式或存储满时静默失败
    }
  }, [todos]);

  // 添加任务
  const addTodo = useCallback(({ text, dueAt = null, location = null }) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTodo = {
      id: generateId(),
      text: trimmed,
      completed: false,
      completedAt: null,
      category: null,
      createdAt: Date.now(),
      dueAt: dueAt || null,
      location: location?.trim() || null,
    };
    setTodos((prev) => [newTodo, ...prev]);
  }, []);

  // 切换完成状态（记录完成时间）
  const toggleTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              completedAt: !todo.completed ? Date.now() : null,
            }
          : todo
      )
    );
  }, []);

  // 删除任务
  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  // 清除所有已完成任务（返回被清除的任务，用于撤销）
  const clearCompleted = useCallback(() => {
    const removed = todos.filter((t) => t.completed);
    if (removed.length > 0) {
      setTodos((prev) => prev.filter((t) => !t.completed));
    }
    return removed;
  }, [todos]);

  // 撤销清除
  const restoreTodos = useCallback((restored) => {
    setTodos((prev) => [...restored, ...prev]);
  }, []);

  return { todos, addTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos };
}
