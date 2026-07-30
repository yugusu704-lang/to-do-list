const messages = {
  all: { title: '还没有任务', subtitle: '添加一个开始管理你的时间' },
  active: { title: '所有任务都完成了', subtitle: '今天干得不错' },
  completed: { title: '还没有已完成的任务', subtitle: '完成一个任务试试' },
};

// 空状态占位组件
export default function EmptyState({ filter = 'all' }) {
  const { title, subtitle } = messages[filter];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-20">
      {/* 装饰圆环 */}
      <div className="relative mb-2">
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-[#D6D3D1] opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-text-muted opacity-50"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      </div>
      <p className="text-center text-[15px] font-medium text-text-secondary">{title}</p>
      <p className="text-center text-[13px] text-text-muted">{subtitle}</p>
    </div>
  );
}
