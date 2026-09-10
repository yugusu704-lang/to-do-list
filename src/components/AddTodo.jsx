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

// 时限/倒计时图标 SVG
function HourglassIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

// 添加任务表单组件（支持 ref 转发，供 widget 深度链接聚焦输入框）
const AddTodo = forwardRef(function AddTodo({ onAdd }, ref) {
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [location, setLocation] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);
  const [isTimed, setIsTimed] = useState(false);
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
      isTimed,
    });
    setText('');
    setDueAt('');
    setLocation('');
    setIsRoutine(false);
    setIsTimed(false);
    setShowLocation(false);
  };

  const toggleRoutine = () => {
    const next = !isRoutine;
    setIsRoutine(next);
    if (next) setIsTimed(false);
  };

  const toggleTimed = () => {
    const next = !isTimed;
    setIsTimed(next);
    if (next) setIsRoutine(false);
  };

  const placeholderText = isRoutine
    ? '添加每日必做事项 (如: 每天吃钙片)...'
    : isTimed
      ? '添加阶段时限任务 (如: 9月15日前完成期末论文)...'
      : '添加新任务...';

  return (
    <div className="border-t border-border/80 bg-card/40 backdrop-blur-md px-4 sm:px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {/* 任务内容输入 */}
        <input
          ref={ref}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderText}
          autoComplete="off"
          className="h-11 rounded-xl border border-border bg-card px-4 text-[14px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
        />

        {/* 日期按钮 + 时限按钮 + 每日必做 + 地点按钮 */}
        <div className="flex gap-2">
          <DateButton value={dueAt} onChange={setDueAt} />

          {/* 阶段时限开关胶囊 */}
          <button
            type="button"
            aria-label="阶段时限"
            aria-pressed={isTimed}
            onClick={toggleTimed}
            className={`flex h-10 items-center justify-center gap-1.5 px-3 rounded-xl border text-[13px] transition-all duration-200 active:scale-[0.97] ${
              isTimed
                ? 'border-amber-700/80 bg-amber-100 text-amber-900 dark:border-amber-500/80 dark:bg-amber-500/10 dark:text-amber-400 font-medium shadow-xs'
                : 'border-border bg-card text-text-muted hover:border-text-muted'
            }`}
          >
            <HourglassIcon />
            <span>时限</span>
          </button>

          {/* 每日必做开关胶囊 */}
          <button
            type="button"
            aria-label="每日必做"
            aria-pressed={isRoutine}
            onClick={toggleRoutine}
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
          {isRoutine ? '添加每日必做' : isTimed ? '添加时限任务' : '添加'}
        </button>
      </form>
    </div>
  );
});

export default AddTodo;

