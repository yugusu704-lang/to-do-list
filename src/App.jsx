import { useState, useEffect, useRef } from 'react';
import useTodos from './hooks/useTodos';
import FilterTabs from './components/FilterTabs';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';

// 计算距离下一个 0 点的毫秒数
function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

// 根组件
export default function App() {
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos } = useTodos();
  const [filter, setFilter] = useState('all');
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // 跨天自动刷新分组标签
  useEffect(() => {
    const timer = setTimeout(() => {
      setDayKey(new Date().toDateString());
    }, msUntilMidnight());
    return () => clearTimeout(timer);
  }, [dayKey]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  // 清除已完成 + 显示撤销 toast
  const handleClearCompleted = () => {
    const removed = clearCompleted();
    if (removed.length === 0) return;
    setToast({
      message: `已清除 ${removed.length} 条任务`,
      removed,
    });
  };

  // 撤销
  const handleUndo = () => {
    if (!toast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    restoreTodos(toast.removed);
    setToast(null);
  };

  // toast 3 秒后自动消失
  useEffect(() => {
    if (!toast) return;
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* 标题区 */}
      <header className="px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-text">待办清单</h1>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="text-xs text-text-muted transition-colors hover:text-danger active:scale-[0.97]"
            >
              清除已完成 ({completedCount})
            </button>
          )}
        </div>
        <p className="mt-1 text-[13px] tracking-wide text-text-secondary">
          {activeCount} 个未完成
        </p>
      </header>

      {/* 筛选栏 */}
      <FilterTabs currentFilter={filter} onFilterChange={setFilter} />

      {/* 任务列表 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TodoList
          key={dayKey}
          todos={todos}
          filter={filter}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      </div>

      {/* 底部输入栏 */}
      <AddTodo onAdd={addTodo} />

      {/* 撤销 toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 animate-[fadeInUp_0.2s_ease-out]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-xl bg-[#2F3437] px-4 py-3 text-sm text-white shadow-lg">
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              撤销
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
