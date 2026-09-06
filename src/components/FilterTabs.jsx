const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

// 筛选标签组件（现代胶囊分段控制器，精致微投影与动态计数）
export default function FilterTabs({ currentFilter, onFilterChange, counts }) {
  return (
    <nav aria-label="任务筛选" className="px-4 sm:px-5 pb-1">
      <div className="flex rounded-2xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 p-1 backdrop-blur-xl shadow-2xs">
        {FILTERS.map(({ key, label }) => {
          const isActive = currentFilter === key;
          const count = counts?.[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'bg-white/85 dark:bg-white/15 text-primary shadow-xs font-semibold border border-white/80 dark:border-white/20 backdrop-blur-md'
                  : 'border border-transparent text-text-muted hover:text-text-secondary hover:bg-white/30 dark:hover:bg-white/5'
              }`}
            >
              <span>{label}</span>
              {typeof count === 'number' && (
                <span
                  className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-border/60 text-text-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
