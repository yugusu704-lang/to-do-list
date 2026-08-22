import { useState, useCallback, useEffect } from 'react';
import DateButton from './DateButton';

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

  // 当外部 todo 变更时同步本地编辑 state
  useEffect(() => {
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
  }, [todo]);

  const time = formatTime(todo.dueAt);

  const handleStartEdit = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
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
      });
    }
    setIsEditing(false);
  }, [editText, editDueAt, editLocation, onUpdate, todo.id]);

  const handleCancel = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsEditing(false);
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
  }, [todo]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  // 编辑模式视图
  if (isEditing) {
    return (
      <div className="relative flex flex-col gap-3 rounded-xl bg-card p-4 shadow-[var(--shadow-card-hover)] border border-primary/30 transition-all duration-200">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="任务内容..."
          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[15px] text-text outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.15)]"
        />

        <div className="flex gap-2">
          <DateButton value={editDueAt} onChange={setEditDueAt} />
          <input
            type="text"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="地点 (可选)..."
            className="h-10 flex-1 rounded-xl border border-border bg-card px-3 text-[13px] text-text outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.15)]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-btn-main px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-btn-main-hover active:scale-95"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  // 常规浏览视图（垂直居中对齐、左右均衡舒展）
  return (
    <div
      className={`group relative flex items-center gap-3 sm:gap-4 overflow-hidden rounded-xl bg-card px-4 sm:px-5 py-3.5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99] ${
        todo.completed ? 'opacity-60' : ''
      }`}
    >
      {/* 圆圈复选框（上下居中） */}
      <button
        type="button"
        aria-label="切换完成状态"
        onClick={(e) => {
          e.stopPropagation();
          createRipple(e, e.currentTarget.closest('.ripple-container, [class*="rounded-xl"]'));
          onToggle(todo.id);
        }}
        className={`flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90 ${
          todo.completed
            ? 'border-done bg-done'
            : 'border-border hover:border-done'
        }`}
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`h-3 w-3 transition-opacity duration-200 ${todo.completed ? 'opacity-100' : 'opacity-0'}`}
        >
          <path d="M2 6l3 3 5-5" />
        </svg>
      </button>

      {/* 任务内容区（文字不绑定编辑点击，防止滚动或浏览时误触） */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
        <span
          className={`break-words text-[15px] leading-snug tracking-normal transition-all duration-200 ${
            todo.completed ? 'text-text-muted line-through decoration-[#D6D3D1]' : 'text-text'
          }`}
        >
          {todo.text}
        </span>

        {/* 次要信息栏（时间与地点） */}
        {(time || todo.location) && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-text-muted">
            {time && (
              <span className="inline-flex items-center gap-1 font-medium text-text-secondary/80">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {time}
              </span>
            )}
            {time && todo.location && (
              <span className="text-[10px] text-[#D6D3D1]">•</span>
            )}
            {todo.location && (
              <span className="inline-flex items-center gap-1 truncate max-w-[140px] sm:max-w-[220px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {todo.location}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 右侧操作按钮区（上下边框正中垂直居中、尺寸调大 18px 图标、40px 触控区） */}
      <div className="flex flex-shrink-0 items-center gap-1 self-center pl-1">
        <button
          type="button"
          aria-label="编辑任务"
          onClick={handleStartEdit}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-all duration-150 hover:bg-black/5 hover:text-primary active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-all duration-150 hover:bg-red-50 hover:text-danger active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
