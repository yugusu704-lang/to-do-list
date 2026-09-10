import { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import useTodos from './hooks/useTodos';
import useTheme from './hooks/useTheme';
import TodoStorage from './plugins/todoStorage';
import FilterTabs from './components/FilterTabs';
import TodoList from './components/TodoList';
import DailyRoutineSection from './components/DailyRoutineSection';
import TimedSection from './components/TimedSection';
import AddTodo from './components/AddTodo';
import ThemeToggle from './components/ThemeToggle';
import { initNotificationListeners, scheduleDevTestReminder } from './plugins/notificationService';

// 计算距离下一个 0 点的毫秒数
function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

// 根组件
export default function App() {
  const { todos, lastRolloverCount, addTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos, resyncFromNative, rolloverOverdueTodos } = useTodos();
  const { themeMode, cycleTheme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  const [toast, setToast] = useState(null);
  const [highlightedTodoId, setHighlightedTodoId] = useState(null);
  const toastTimerRef = useRef(null);
  const inputRef = useRef(null);

  // 读取并清除 focus_add 标记，聚焦输入框
  const checkAndFocusInput = useCallback(async () => {
    try {
      const { focus } = await TodoStorage.getAndClearFocusAdd();
      if (focus && inputRef.current) {
        inputRef.current.focus();
      }
    } catch {
      // Web 开发环境下插件不可用，静默
    }
  }, []);

  // 跨天自动刷新分组标签 + 顺延过期任务（0 点立即顺延）
  useEffect(() => {
    const timer = setTimeout(() => {
      setDayKey(new Date().toDateString());
      rolloverOverdueTodos();
    }, msUntilMidnight());
    return () => clearTimeout(timer);
  }, [dayKey, rolloverOverdueTodos]);

  // app 从后台回到前台时，从 SharedPreferences 重新同步数据 + 检查 focus_add
  useEffect(() => {
    const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        resyncFromNative();
        checkAndFocusInput();
      }
    });
    return () => { listener.then((l) => l.remove()); };
  }, [resyncFromNative, checkAndFocusInput]);

  // 冷启动时读取 focus_add 标记（处理从桌面直接打开的场景）
  useEffect(() => {
    checkAndFocusInput();
  }, [checkAndFocusInput]);

  // 监听点击系统通知唤起 App：提取 todoId 并高亮展开目标时限任务
  useEffect(() => {
    let clearTimer;
    const unsubPromise = initNotificationListeners((todoId) => {
      if (todoId) {
        setHighlightedTodoId(todoId);
        if (clearTimer) clearTimeout(clearTimer);
        clearTimer = setTimeout(() => {
          setHighlightedTodoId(null);
        }, 3500);
      }
    });
    return () => {
      if (clearTimer) clearTimeout(clearTimer);
      unsubPromise.then((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  // 分离每日必做习惯、阶段时限任务与普通日程任务
  const routines = todos.filter((t) => t.isRoutine);
  const timedTodos = todos.filter((t) => t.isTimed);
  const normalTodos = todos.filter((t) => !t.isRoutine && !t.isTimed);

  // 清除已完成 + 显示撤销 toast
  const handleClearCompleted = () => {
    const removed = clearCompleted();
    if (removed.length === 0) return;
    setToast({
      message: `已清除 ${removed.length} 条任务`,
      removed,
      undoable: true,
    });
  };

  // 撤销（仅清除类的 toast 可撤销）
  const handleUndo = () => {
    if (!toast?.undoable) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    restoreTodos(toast.removed);
    setToast(null);
  };

  // DEV 测试模式：一键预约 5 秒后推送测试通知
  const handleDevTestNotification = async () => {
    let target = timedTodos.find((t) => !t.completed);
    if (!target) {
      // 自动创建一个演示时限任务以便落地高亮
      addTodo({
        text: '演示时限任务（9月15日截止）',
        dueAt: '2026-09-15T18:00',
        isTimed: true,
        hasReminder: true,
      });
      target = {
        id: 'dev-demo-task',
        text: '演示时限任务（9月15日截止）',
      };
    }

    const res = await scheduleDevTestReminder(target);
    if (res.success) {
      setToast({
        message: '🔔 已预约 5 秒后推送！请在 5 秒内将 App 退至后台或锁屏查看',
        undoable: false,
      });
    } else {
      setToast({
        message: `推送预约失败: ${res.error}`,
        undoable: false,
      });
    }
  };

  // 顺延通知 toast（无撤销按钮，3 秒自动消失）
  useEffect(() => {
    if (lastRolloverCount > 0) {
      setToast({
        message: `${lastRolloverCount} 个任务已顺延到今天`,
        undoable: false,
      });
    }
  }, [lastRolloverCount]);

  // toast 3 秒后自动消失
  useEffect(() => {
    if (!toast) return;
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg">
      {/* 响应式居中容器：常规手机满宽，折叠屏/大屏/平板自动限制黄金宽度居中 */}
      <div className="mx-auto flex h-full w-full max-w-lg md:max-w-xl flex-col overflow-hidden">
        {/* 标题区（双行呼吸感排版：大标题 + 状态轻胶囊 + 右侧对称操作区） */}
        <header className="flex flex-col gap-2.5 px-4 sm:px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3">
          {/* 第一行：大标题 + 右侧操作组 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-text leading-tight">
                待办清单
              </h1>
              <span className="rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 px-1.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
                Dev
              </span>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  aria-label={`清除已完成的 ${completedCount} 项任务`}
                  className="inline-flex h-[38px] items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 sm:px-3 text-xs font-medium text-text-secondary shadow-sm transition-all duration-150 hover:border-danger/40 hover:bg-danger/5 hover:text-danger active:scale-95"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 flex-shrink-0">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span className="whitespace-nowrap">清除 ({completedCount})</span>
                </button>
              )}
              <ThemeToggle themeMode={themeMode} onCycle={cycleTheme} />
            </div>
          </div>

          {/* 第二行：未完成状态轻胶囊徽标 */}
          <div className="flex items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 text-xs text-text-secondary shadow-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  activeCount > 0 ? 'bg-primary' : 'bg-done'
                }`}
              />
              <span className="font-medium tracking-wide">
                {activeCount > 0 ? `${activeCount} 项未完成` : '所有任务已完成 🎉'}
              </span>
            </div>
          </div>
        </header>

        {/* Dev 测试版专属：即时通知测试栏 */}
        <div className="mx-4 sm:mx-5 mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold truncate">Dev 通知测试</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={async () => {
                try {
                  await TodoStorage.openNotificationSettings();
                } catch {}
              }}
              className="rounded-lg border border-amber-600/40 bg-card/60 hover:bg-card px-2 py-1 text-xs font-medium text-amber-900 dark:text-amber-300 transition-all active:scale-95"
            >
              ⚙️ 权限设置
            </button>
            <button
              type="button"
              onClick={handleDevTestNotification}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 px-2.5 py-1 text-xs font-semibold text-white transition-all shadow-xs"
            >
              🧪 5秒后发送测试通知
            </button>
          </div>
        </div>

        {/* 筛选栏 */}
        <FilterTabs currentFilter={filter} onFilterChange={setFilter} />

        {/* 任务列表（独立滚动区，底部导航栏固定不动） */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {/* 独立每日习惯打卡专区 */}
          <DailyRoutineSection
            routines={routines}
            filter={filter}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onUpdate={updateTodo}
          />

          {/* 独立阶段时限任务专区（默认折叠） */}
          <TimedSection
            todos={timedTodos}
            filter={filter}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onUpdate={updateTodo}
            highlightedTodoId={highlightedTodoId}
          />

          <TodoList
            key={dayKey}
            todos={normalTodos}
            filter={filter}
            hasOtherContent={routines.length > 0 || timedTodos.length > 0}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onUpdate={updateTodo}
          />
        </div>

        {/* 底部输入栏 */}
        <AddTodo ref={inputRef} onAdd={addTodo} />
      </div>

      {/* 撤销 toast */}
      {toast && (
        <div
          className="fixed bottom-28 left-1/2 z-10 -translate-x-1/2 animate-[fadeInUp_0.2s_ease-out]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-xl bg-[#2F3437] px-4 py-3 text-sm text-white shadow-lg">
            <span>{toast.message}</span>
            {toast.undoable && (
              <button
                type="button"
                onClick={handleUndo}
                className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
              >
                撤销
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
