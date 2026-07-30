import { useState } from 'react';

// 从 ISO datetime 字符串提取纯时间 HH:MM
function formatTime(dueAt) {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// 单个任务项组件（卡片样式 + 绿色完成态 + tap-to-reveal 删除）
export default function TodoItem({ todo, onToggle, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const time = formatTime(todo.dueAt);

  return (
    <div
      className={`group relative flex items-start gap-3.5 rounded-xl px-5 py-3.5 transition-all duration-200 hover:bg-[#F5F5F4] active:scale-[0.99] ${todo.completed ? 'opacity-60' : ''}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={() => setShowDelete((prev) => !prev)}
    >
      {/* 圆圈复选框 */}
      <button
        type="button"
        aria-label="切换完成状态"
        onClick={(e) => {
          e.stopPropagation();
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
          {/* 时间标签（右侧灰色小字） */}
          {time && (
            <span className="flex-shrink-0 text-xs text-text-muted">{time}</span>
          )}
        </div>
        {/* 地点（下方灰色小字） */}
        {todo.location && (
          <span className="truncate text-xs text-text-muted">{todo.location}</span>
        )}
      </div>

      {/* 删除按钮（tap-to-reveal） */}
      <button
        type="button"
        aria-label="删除"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(todo.id);
        }}
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-lg text-danger transition-all duration-150 hover:bg-[#FEF2F2] active:scale-90 ${
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
