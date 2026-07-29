const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

// 筛选标签组件（底线高亮风格）
export default function FilterTabs({ currentFilter, onFilterChange }) {
  return (
    <div className="flex border-b border-border px-5">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onFilterChange(key)}
          className={`border-b-2 px-4 py-2.5 text-[13px] font-medium tracking-wide transition-all duration-200 active:scale-[0.97] ${
            currentFilter === key
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
