const messages = {
  all: '还没有任务，添加一个吧',
  active: '所有任务都完成了！',
  completed: '还没有已完成的任务',
};

// 空状态占位组件
export default function EmptyState({ filter = 'all' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-24">
      <div className="text-2xl text-text-muted opacity-40">&#10003;</div>
      <p className="text-sm tracking-wide text-text-muted">{messages[filter]}</p>
    </div>
  );
}
