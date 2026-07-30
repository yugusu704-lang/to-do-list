import { useState, forwardRef } from 'react';
import DateButton from './DateButton';

// 添加任务表单组件（支持 ref 转发，供 widget 深度链接聚焦输入框）
const AddTodo = forwardRef(function AddTodo({ onAdd }, ref) {
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [location, setLocation] = useState('');
  const [showLocation, setShowLocation] = useState(false);

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
    setShowLocation(false);
  };

  return (
    <div className="border-t border-border-light px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {/* 任务内容输入 */}
        <input
          ref={ref}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="添加新任务..."
          autoComplete="off"
          className="h-11 rounded-xl border border-border bg-card px-4 text-[14px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
        />

        {/* 日期按钮 + 地点按钮 */}
        <div className="flex gap-2">
          <DateButton value={dueAt} onChange={setDueAt} />

          {showLocation ? (
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="输入地点..."
              autoFocus
              autoComplete="off"
              className="h-10 flex-1 rounded-xl border border-border bg-card px-3 text-[13px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowLocation(true)}
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-[13px] text-text-muted transition-all duration-200 hover:border-text-muted active:scale-[0.97]"
            >
              地点
            </button>
          )}
        </div>

        {/* 添加按钮 */}
        <button
          type="submit"
          className="h-11 rounded-xl bg-[#2F3437] text-[15px] font-medium text-white transition-all duration-150 hover:bg-[#1a1d1f] active:scale-[0.97]"
        >
          添加
        </button>
      </form>
    </div>
  );
});

export default AddTodo;
