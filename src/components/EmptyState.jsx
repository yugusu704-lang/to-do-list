const messages = {
  all: { title: '还没有任务', subtitle: '添加一个开始管理你的时间' },
  active: { title: '所有任务都完成了', subtitle: '今天干得不错' },
  completed: { title: '还没有已完成的任务', subtitle: '完成一个任务试试' },
};

// 空状态占位组件
export default function EmptyState({ filter = 'all' }) {
  const { title, subtitle } = messages[filter];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 py-12 text-center select-none animate-[fadeInUp_0.3s_ease-out]">
      {/* 极简液态质感图符 */}
      <div className="liquid-glass-card flex h-14 w-14 items-center justify-center rounded-2xl mb-1 shadow-xs">
        {filter === 'completed' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-done">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : filter === 'active' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </div>

      <p className="text-[15px] font-semibold tracking-tight text-text">{title}</p>
      <p className="text-[13px] text-text-muted leading-relaxed max-w-[260px]">{subtitle}</p>
    </div>
  );
}
