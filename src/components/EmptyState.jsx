import { useState } from 'react';

// 空状态消息
const messages = {
  all: { title: '还没有任务', subtitle: '添加一个待办事项开始吧' },
  active: { title: '所有任务都完成了！', subtitle: '休息一下吧' },
  completed: { title: '还没有已完成的任务', subtitle: '完成一个任务试试' },
};

// 勾选图标 SVG
function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted opacity-40">
      <path d="M4 12.5l5.5 5.5L20 7" />
    </svg>
  );
}

// 空状态占位组件
export default function EmptyState({ filter = 'all' }) {
  const { title, subtitle } = messages[filter];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
      <CheckIcon />
      <p className="text-base font-semibold text-text">{title}</p>
      <p className="text-sm text-text-muted">{subtitle}</p>
    </div>
  );
}
