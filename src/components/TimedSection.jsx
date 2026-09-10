import { useState, useEffect } from 'react';
import TodoItem from './TodoItem';

// 沙漏图标 SVG
function HourglassIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

// 折叠展开箭头 SVG
function ChevronIcon({ expanded, className = 'w-4 h-4' }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// 格式化最近截止日期提示
function formatNearestDue(dueAt) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const diffDays = Math.ceil((dueMidnight - todayMidnight) / 86400000);

  if (diffDays < 0) return '已超期';
  if (diffDays === 0) return '今天截止';
  if (diffDays === 1) return '明天截止';
  return `${due.getMonth() + 1}月${due.getDate()}日截止`;
}

// 独立阶段时限任务专区组件（默认折叠）
export default function TimedSection({
  todos = [],
  filter = 'all',
  onToggle,
  onDelete,
  onUpdate,
  highlightedTodoId = null,
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // 当传入高亮任务 ID（如点击通知唤起）时，自动展开专区并定位
  useEffect(() => {
    if (highlightedTodoId) {
      setIsCollapsed(false);
      const timer = setTimeout(() => {
        const el = document.getElementById(`todo-item-${highlightedTodoId}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedTodoId]);

  if (!todos || todos.length === 0) {
    return null;
  }

  // 排序：按 dueAt 升序排列（最紧急的排最前面）
  const sortedTodos = [...todos].sort((a, b) => {
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  const activeCount = sortedTodos.filter((t) => !t.completed).length;

  // 根据当前筛选 Tab 进行展示过滤
  const displayedTodos = sortedTodos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // 获取最近未完成任务的截止日期描述
  const nearestActive = sortedTodos.find((t) => !t.completed && t.dueAt);
  const nearestDueText = nearestActive ? formatNearestDue(nearestActive.dueAt) : null;

  return (
    <section aria-label="阶段时限任务专区" className="mb-4">
      <div className="rounded-2xl border border-amber-700/20 dark:border-amber-500/20 bg-amber-500/[0.03] p-3.5 sm:p-4 shadow-xs backdrop-blur-xs transition-all duration-200">
        {/* 专区顶栏：可点击触发展开/折叠 */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-400">
              <HourglassIcon className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-[15px] font-semibold tracking-tight text-text">
              时限任务
            </h2>
            <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300/60 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-300 dark:border-transparent">
              {activeCount > 0 ? `${activeCount} 项进行中` : '全部已完成'}
            </span>
            {nearestDueText && activeCount > 0 && (
              <span className="hidden sm:inline-flex text-xs font-medium text-amber-900/80 dark:text-amber-300/80">
                · {nearestDueText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-text-muted hover:text-text">
            <span>{isCollapsed ? '展开' : '收起'}</span>
            <ChevronIcon expanded={!isCollapsed} />
          </div>
        </button>

        {/* 展开后的时限任务列表 */}
        {!isCollapsed && (
          <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-amber-700/15 dark:border-amber-500/15">
            {displayedTodos.length === 0 ? (
              <div className="py-4 text-center text-xs text-text-muted">
                {filter === 'active' ? '没有未完成的时限任务' : filter === 'completed' ? '暂无已完成的时限任务' : '暂无时限任务'}
              </div>
            ) : (
              displayedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  isHighlighted={highlightedTodoId === todo.id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
