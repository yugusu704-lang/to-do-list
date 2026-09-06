import { useState, useCallback, useEffect } from 'react';
import DateButton from './DateButton';

// 循环/每日图标 SVG
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

// 从 ISO datetime 字符串提取纯时间 HH:MM
function formatTime(dueAt) {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// 创建 ripple 效果
function createRipple(e, container) {
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  container.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}

// 单个任务项组件
export default function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDueAt, setEditDueAt] = useState(todo.dueAt || '');
  const [editLocation, setEditLocation] = useState(todo.location || '');
  const [editIsRoutine, setEditIsRoutine] = useState(Boolean(todo.isRoutine));

  // 当外部 todo 变更时同步本地编辑 state
  useEffect(() => {
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
    setEditIsRoutine(Boolean(todo.isRoutine));
  }, [todo]);

  const time = formatTime(todo.dueAt);

  const handleStartEdit = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
    setEditIsRoutine(Boolean(todo.isRoutine));
  }, [todo]);

  const handleSave = useCallback((e) => {
    if (e) e.preventDefault();
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (onUpdate) {
      onUpdate({
        id: todo.id,
        text: trimmed,
        dueAt: editDueAt || null,
        location: editLocation.trim() || null,
        isRoutine: editIsRoutine,
      });
    }
    setIsEditing(false);
  }, [editText, editDueAt, editLocation, editIsRoutine, onUpdate, todo.id]);

  const handleCancel = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsEditing(false);
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
    setEditIsRoutine(Boolean(todo.isRoutine));
  }, [todo]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  // 编辑模式视图
  // 编辑模式视图
  if (isEditing) {
    return (
      <div className="liquid-glass-card relative flex flex-col gap-3 rounded-2xl p-4 border border-primary/40">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="任务内容..."
          className="h-10 w-full rounded-xl border border-border/70 bg-white/60 dark:bg-white/5 px-3.5 text-[15px] text-text outline-none focus:border-primary focus:bg-white/80 dark:focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] transition-all duration-200 backdrop-blur-xs"
        />

        <div className="flex flex-wrap gap-2">
          <DateButton value={editDueAt} onChange={setEditDueAt} />

          {/* 编辑模式下的每日必做切换 */}
          <button
            type="button"
            aria-label="每日必做"
            aria-pressed={editIsRoutine}
            onClick={() => setEditIsRoutine(!editIsRoutine)}
            className={`flex h-10 items-center justify-center gap-1.5 px-3.5 rounded-xl border text-[13px] transition-all duration-200 active:scale-[0.97] ${
              editIsRoutine
                ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                : 'border-border/70 bg-white/50 dark:bg-white/5 text-text-muted hover:border-text-secondary hover:text-text backdrop-blur-xs'
            }`}
          >
            <RepeatIcon />
            <span>每日</span>
          </button>

          <input
            type="text"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="地点 (可选)..."
            className="h-10 min-w-[120px] flex-1 rounded-xl border border-border/70 bg-white/50 dark:bg-white/5 px-3.5 text-[13px] text-text outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] transition-all duration-200 backdrop-blur-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl px-3.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-white/60 dark:hover:bg-white/10 active:scale-95"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-btn-main px-4.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-btn-main-hover active:scale-95 shadow-xs"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  // 常规浏览视图（液态玻璃质感卡片）
  return (
    <div
      className={`liquid-glass-card group relative flex items-center gap-3 sm:gap-3.5 overflow-hidden rounded-2xl px-4 sm:px-4.5 py-3.5 active:scale-[0.99] ${
        todo.completed ? 'opacity-60 saturate-75' : ''
      }`}
    >
      {/* 圆圈复选框（水滴拟态交互） */}
      <button
        type="button"
        aria-label="切换完成状态"
        onClick={(e) => {
          e.stopPropagation();
          createRipple(e, e.currentTarget.closest('.ripple-container, [class*="rounded-2xl"]'));
          onToggle(todo.id);
        }}
        className={`flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90 ${
          todo.completed
            ? 'border-done bg-done shadow-2xs'
            : 'border-border/80 hover:border-done bg-white/60 dark:bg-white/5 backdrop-blur-xs'
        }`}
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`h-3 w-3 transition-all duration-200 ${
            todo.completed ? 'opacity-100 scale-100 animate-check-spring' : 'opacity-0 scale-50'
          }`}
        >
          <path d="M2 6l3 3 5-5" />
        </svg>
      </button>

      {/* 任务内容区 */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
        <div className="flex items-center gap-2">
          <span
            className={`break-words text-[15px] font-normal leading-snug tracking-normal transition-all duration-200 ${
              todo.completed ? 'text-text-muted line-through decoration-border' : 'text-text'
            }`}
          >
            {todo.text}
          </span>
          {/* 每日习惯标识胶囊 */}
          {todo.isRoutine && (
            <span className="inline-flex items-center gap-1 flex-shrink-0 rounded-lg bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20 backdrop-blur-xs">
              <RepeatIcon className="w-3 h-3" />
              <span>每日</span>
            </span>
          )}
        </div>

        {/* 次要信息栏（时间与地点，精致透光微芯片） */}
        {(time || todo.location) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
            {time && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/60 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-text-secondary border border-white/60 dark:border-white/10 backdrop-blur-xs shadow-2xs">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{time}</span>
              </span>
            )}
            {todo.location && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/60 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-text-secondary truncate max-w-[140px] sm:max-w-[220px] border border-white/60 dark:border-white/10 backdrop-blur-xs shadow-2xs">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{todo.location}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 右侧操作按钮区 */}
      <div className="flex flex-shrink-0 items-center gap-0.5 self-center pl-1">
        <button
          type="button"
          aria-label="编辑任务"
          onClick={handleStartEdit}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-all duration-150 hover:bg-white/60 dark:hover:bg-white/10 hover:text-primary active:scale-90"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="删除"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-all duration-150 hover:bg-danger/10 hover:text-danger active:scale-90"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
