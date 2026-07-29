import { useState } from 'react';

// 添加任务表单组件（任务内容 + 时间 + 地点）
export default function AddTodo({ onAdd }) {
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({
      text: trimmed,
      dueAt: dueAt || null,
      location: location.trim() || null,
    });
    setText('');
    setDueAt('');
    setLocation('');
  };

  return (
    <div className="sticky bottom-0 border-t border-border bg-bg/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="添加新任务..."
          autoComplete="off"
          className="rounded-xl border border-border bg-card px-4 py-3 text-[15px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] text-text-secondary outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="地点（选填）"
            autoComplete="off"
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#2F3437] px-5 py-3 text-[15px] font-medium text-white transition-all duration-150 hover:bg-[#1a1d1f] active:scale-[0.97]"
        >
          添加
        </button>
      </form>
    </div>
  );
}
