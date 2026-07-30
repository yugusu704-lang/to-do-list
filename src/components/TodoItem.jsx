import { useState, useCallback } from 'react';

// 从 ISO datetime 字符串提取纯时间 HH:MM
function formatTime(dueAt) {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// 创建 ripple 效果
function createRipple(e, container) {
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
export default function TodoItem({ todo, onToggle, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const time = formatTime(todo.dueAt);

  const handleClick = useCallback((e) => {
    createRipple(e, e.currentTarget);
    setShowDelete((prev) => !prev);
  }, []);

  return (
    <div
      className={`group relative flex items-start gap-3.5 overflow-hidden rounded-xl bg-card px-5 py-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99] ${todo.completed ? 'opacity-60' : ''}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={handleClick}
    >
      {/* 圆圈复选框 */}
      <button
        type="button"
        aria-label="切换完成状态"
        onClick={(e) => {
          e.stopPropagation();
          createRipple(e, e.currentTarget.closest('.ripple-container, [class*="rounded-xl"]'));
          onToggle(todo.id);
        }}
        className={`mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90 ${
          todo.completed
            ? 'border-done bg-done'
            : 'border-[#D6D3D1] hover:border-done'
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

      {/* 任务内容区 */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={`flex-1 truncate text-[15px] leading-snug transition-all duration-200 ${
              todo.completed ? 'text-text-muted line-through decoration-[#D6D3D1]' : 'text-text'
            }`}
          >
            {todo.text}
          </span>
          {time && (
            <span className="flex-shrink-0 text-xs text-text-muted">{time}</span>
          )}
        </div>
        {todo.location && (
          <span className="truncate text-xs text-text-muted">{todo.location}</span>
        )}
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        aria-label="删除"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(todo.id);
        }}
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-lg text-danger transition-all duration-150 hover:bg-red-50 active:scale-90 ${
          showDelete ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!showDelete}
        tabIndex={showDelete ? 0 : -1}
      >
        &times;
      </button>
    </div>
  );
}
