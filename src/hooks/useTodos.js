import { useState, useEffect, useCallback, useRef } from 'react';
import TodoStorage from '../plugins/todoStorage';

const STORAGE_KEY = 'todos';
const AUTO_CLEAN_DAYS = 30;

// 生成唯一 ID（兼容旧 WebView）
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// 从 localStorage 同步读取（仅用于首次迁移判断）
function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// 异步加载（优先 SharedPreferences，fallback localStorage，自动迁移存量数据）
async function loadTodosAsync() {
  try {
    const { data } = await TodoStorage.load();
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { todos: parsed, source: 'sharedPrefs' };
    }
    // SharedPreferences 为空，检查 localStorage 是否有存量数据
    if (Array.isArray(parsed) && parsed.length === 0) {
      const localData = loadFromLocalStorage();
      if (localData.length > 0) {
        // 一次性迁移：写入 SharedPreferences，后续不再读 localStorage
        await TodoStorage.save({ data: JSON.stringify(localData) });
        return { todos: localData, source: 'sharedPrefs' };
      }
    }
    return { todos: [], source: 'sharedPrefs' };
  } catch {
    // 插件不可用（浏览器开发环境），fallback 到 localStorage
    return { todos: loadFromLocalStorage(), source: 'localStorage' };
  }
}

// 异步保存
async function saveTodosAsync(todos) {
  const json = JSON.stringify(todos);
  try {
    await TodoStorage.save({ data: json });
  } catch {
    // 插件不可用时静默
  }
  // 同步备份到 localStorage（浏览器开发环境用）
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {}
}

// 清理完成超过 30 天的任务
function autoClean(todos) {
  const now = Date.now();
  const threshold = AUTO_CLEAN_DAYS * 24 * 60 * 60 * 1000;
  return todos.filter((todo) => {
    if (!todo.completed) return true;
    if (!todo.completedAt) return true;
    return now - todo.completedAt < threshold;
  });
}

// Todo 数据管理 Hook
export default function useTodos() {
  const [todos, setTodos] = useState([]);
  const loadedRef = useRef(false);

  // 用于测试：等待初始加载完成的 Promise
  const loadedResolveRef = useRef(null);
  const loadedPromiseRef = useRef(new Promise((resolve) => {
    loadedResolveRef.current = resolve;
  }));

  // 启动时异步加载（含迁移逻辑）
  useEffect(() => {
    loadTodosAsync().then(({ todos: data }) => {
      setTodos(autoClean(data));
      loadedRef.current = true;
      loadedResolveRef.current?.();
    });
  }, []);

  // 数据变化时异步保存（跳过首次渲染和未加载完成前）
  useEffect(() => {
    if (!loadedRef.current) return;
    saveTodosAsync(todos);
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

  // 从原生端重新同步（app 回到前台时调用）
  const resyncFromNative = useCallback(async () => {
    const { todos: fresh } = await loadTodosAsync();
    setTodos(autoClean(fresh));
  }, []);

  return { todos, loadedPromise: loadedPromiseRef.current, addTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos, resyncFromNative };
}
