import TodoItem from './TodoItem';

// 循环/刷新图标 SVG
function RepeatIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// 独立每日习惯打卡专区组件
export default function DailyRoutineSection({
  routines = [],
  filter = 'all',
  onToggle,
  onDelete,
  onUpdate,
}) {
  if (!routines || routines.length === 0) {
    return null;
  }

  const totalCount = routines.length;
  const completedCount = routines.filter((r) => r.completed).length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const percent = Math.round((completedCount / totalCount) * 100);

  // 根据当前筛选 Tab 过滤显示的习惯
  const displayedRoutines = routines.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <section aria-label="每日必做专区" className="mb-4">
      <div className="liquid-glass-card rounded-3xl p-3.5 sm:p-4.5">
        {/* 专区顶栏：标题 + 进度胶囊 + 进度条 */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary border border-primary/20 shadow-2xs">
              <RepeatIcon className="w-4 h-4" />
            </div>
            <h2 className="text-[15px] font-semibold tracking-tight text-text">
              每日必做
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border ${
                isAllDone
                  ? 'bg-done/15 text-done border-done/30'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}
            >
              {isAllDone ? '今日已达成 🎉' : `${completedCount}/${totalCount} 完成`}
            </span>
          </div>

          {/* 微型平滑进度条 */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 sm:w-20 overflow-hidden rounded-full bg-white/60 dark:bg-white/10 p-0.5 border border-white/70 dark:border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isAllDone ? 'bg-done shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-text-muted">
              {percent}%
            </span>
          </div>
        </div>

        {/* 习惯列表 */}
        {displayedRoutines.length > 0 ? (
          <div className="flex flex-col gap-2 pt-3">
            {displayedRoutines.map((routine) => (
              <TodoItem
                key={routine.id}
                todo={routine}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-text-muted">
            {filter === 'active' ? '今日习惯已全部完成 ✨' : '暂无已完成的每日习惯'}
          </div>
        )}
      </div>
    </section>
  );
}
