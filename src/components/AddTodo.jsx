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
    <div className="liquid-glass-dock px-4 sm:px-5 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-2 sm:p-2.5 shadow-2xs backdrop-blur-xl transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-xs">
        {/* 顶部主输入行 + 提交按钮 */}
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRoutine ? '添加每日必做事项 (如: 每天吃钙片)...' : '添加新任务...'}
            autoComplete="off"
            className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[15px] text-text placeholder:text-text-muted outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className={`flex h-9 items-center justify-center gap-1 rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-150 active:scale-95 ${
              text.trim()
                ? 'bg-btn-main text-white shadow-xs hover:bg-btn-main-hover cursor-pointer'
                : 'bg-black/5 dark:bg-white/10 text-text-muted cursor-not-allowed opacity-50'
            }`}
          >
            <span>{isRoutine ? '添加每日必做' : '添加'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 底部属性快捷芯片栏 */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/60 dark:border-white/10">
          <DateButton value={dueAt} onChange={setDueAt} />

          {/* 每日必做开关 */}
          <button
            type="button"
            aria-label="每日必做"
            aria-pressed={isRoutine}
            onClick={() => setIsRoutine(!isRoutine)}
            className={`flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl border text-[12px] font-medium transition-all duration-200 active:scale-[0.97] ${
              isRoutine
                ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                : 'border-white/70 dark:border-white/10 bg-white/50 dark:bg-white/5 text-text-muted hover:border-text-secondary hover:text-text backdrop-blur-xs'
            }`}
          >
            <RepeatIcon className="w-3.5 h-3.5" />
            <span>每日</span>
          </button>

          {/* 地点输入 / 按钮 */}
          {showLocation ? (
            <div className="relative flex-1">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="输入地点..."
                autoFocus
                autoComplete="off"
                className="h-9 w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/60 dark:bg-white/10 px-2.5 text-[12px] text-text outline-none focus:border-primary transition-all backdrop-blur-xs"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLocation(true)}
              className="flex h-9 items-center justify-center gap-1 px-3 rounded-xl border border-white/70 dark:border-white/10 bg-white/50 dark:bg-white/5 text-[12px] text-text-muted transition-all duration-200 hover:border-text-secondary hover:text-text active:scale-[0.97] backdrop-blur-xs"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>地点</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
});

export default AddTodo;
