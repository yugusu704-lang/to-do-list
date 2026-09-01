import { useState, forwardRef } from 'react';
import DateButton from './DateButton';

// 循环/刷新图标 SVG
function RepeatIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// 添加任务表单组件（支持 ref 转发，供 widget 深度链接聚焦输入框）
const AddTodo = forwardRef(function AddTodo({ onAdd }, ref) {
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [location, setLocation] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({
      text: trimmed,
      dueAt: dueAt || null,
      location: location.trim() || null,
      isRoutine,
    });
    setText('');
    setDueAt('');
    setLocation('');
    setIsRoutine(false);
    setShowLocation(false);
  };

  return (
    <div className="border-t border-border/80 bg-card/40 backdrop-blur-md px-4 sm:px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {/* 任务内容输入 */}
        <input
          ref={ref}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isRoutine ? '添加每日必做事项 (如: 每天吃钙片)...' : '添加新任务...'}
          autoComplete="off"
          className="h-11 rounded-xl border border-border bg-card px-4 text-[14px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
        />

        {/* 日期按钮 + 地点按钮 + 每日必做切换 */}
        <div className="flex gap-2">
          <DateButton value={dueAt} onChange={setDueAt} />

          {/* 每日必做开关胶囊 */}
          <button
            type="button"
            aria-label="每日必做"
            aria-pressed={isRoutine}
            onClick={() => setIsRoutine(!isRoutine)}
            className={`flex h-10 items-center justify-center gap-1.5 px-3 rounded-xl border text-[13px] transition-all duration-200 active:scale-[0.97] ${
              isRoutine
                ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                : 'border-border bg-card text-text-muted hover:border-text-muted'
            }`}
          >
            <RepeatIcon />
            <span>每日</span>
          </button>

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
          className="h-11 rounded-xl bg-btn-main text-[15px] font-medium text-white transition-all duration-150 hover:bg-btn-main-hover active:scale-[0.97]"
        >
          {isRoutine ? '添加每日必做' : '添加'}
        </button>
      </form>
    </div>
  );
});

export default AddTodo;
