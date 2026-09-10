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

// 提醒铃铛图标 SVG
function BellIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

// 提取并智能格式化时间与倒计时
function formatDeadlineInfo(dueAt, isTimed) {
  if (!dueAt) return { displayTime: null, countdownTag: null, isOverdue: false };
  const due = new Date(dueAt);
  if (isNaN(due.getTime())) return { displayTime: null, countdownTag: null, isOverdue: false };

  const timeStr = due.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (!isTimed) {
    return { displayTime: timeStr, countdownTag: null, isOverdue: false };
  }

  const month = due.getMonth() + 1;
  const day = due.getDate();
  const displayTime = `${month}月${day}日 ${timeStr}`;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const diffDays = Math.ceil((dueMidnight - todayMidnight) / 86400000);

  let countdownTag = null;
  let isOverdue = false;
  let isUrgent = false;
  if (diffDays < 0) {
    countdownTag = '已超期';
    isOverdue = true;
  } else if (diffDays === 0) {
    countdownTag = '今天截止';
    isUrgent = true;
  } else if (diffDays === 1) {
    countdownTag = '明天截止';
    isUrgent = true;
  } else {
    countdownTag = `剩余 ${diffDays} 天`;
  }

  return { displayTime, countdownTag, isOverdue, isUrgent };
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
export default function TodoItem({ todo, onToggle, onDelete, onUpdate, isHighlighted = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDueAt, setEditDueAt] = useState(todo.dueAt || '');
  const [editLocation, setEditLocation] = useState(todo.location || '');
  const [editIsRoutine, setEditIsRoutine] = useState(Boolean(todo.isRoutine));
  const [editIsTimed, setEditIsTimed] = useState(Boolean(todo.isTimed));
  const [editHasReminder, setEditHasReminder] = useState(Boolean(todo.hasReminder));

  // 当外部 todo 变更时同步本地编辑 state
  useEffect(() => {
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
    setEditIsRoutine(Boolean(todo.isRoutine));
    setEditIsTimed(Boolean(todo.isTimed));
    setEditHasReminder(Boolean(todo.hasReminder));
  }, [todo]);

  const { displayTime, countdownTag, isOverdue, isUrgent } = formatDeadlineInfo(todo.dueAt, todo.isTimed);

  const handleStartEdit = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
    setEditIsRoutine(Boolean(todo.isRoutine));
    setEditIsTimed(Boolean(todo.isTimed));
    setEditHasReminder(Boolean(todo.hasReminder));
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
        isTimed: editIsTimed,
        hasReminder: editIsTimed ? editHasReminder : false,
      });
    }
    setIsEditing(false);
  }, [editText, editDueAt, editLocation, editIsRoutine, editIsTimed, editHasReminder, onUpdate, todo.id]);

  const handleCancel = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsEditing(false);
    setEditText(todo.text);
    setEditDueAt(todo.dueAt || '');
    setEditLocation(todo.location || '');
    setEditIsRoutine(Boolean(todo.isRoutine));
    setEditIsTimed(Boolean(todo.isTimed));
    setEditHasReminder(Boolean(todo.hasReminder));
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

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <DateButton value={editDueAt} onChange={setEditDueAt} />

          {/* 阶段时限开关胶囊 */}
          <button
            type="button"
            aria-label="阶段时限"
            aria-pressed={editIsTimed}
            onClick={() => {
              const next = !editIsTimed;
              setEditIsTimed(next);
              if (next) {
                setEditIsRoutine(false);
                setEditHasReminder(true);
              }
            }}
            className={`flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl border text-xs sm:text-[13px] transition-all duration-200 active:scale-[0.97] ${
              editIsTimed
                ? 'border-orange-600 bg-orange-100 text-orange-950 dark:border-orange-500/80 dark:bg-orange-500/20 dark:text-orange-300 font-semibold shadow-xs'
                : 'border-border bg-card text-text-muted hover:border-text-muted'
            }`}
          >
            <HourglassIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">时限</span>
          </button>

          {/* 编辑模式下的提前3天提醒切换 */}
          {editIsTimed && (
            <button
              type="button"
              aria-label="提前3天提醒"
              aria-pressed={editHasReminder}
              onClick={() => setEditHasReminder(!editHasReminder)}
              className={`flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl border text-xs sm:text-[13px] transition-all duration-200 active:scale-[0.97] ${
                editHasReminder
                  ? 'border-orange-600 bg-orange-100 text-orange-950 dark:border-orange-500/80 dark:bg-orange-500/20 dark:text-orange-300 font-semibold shadow-xs'
                  : 'border-border bg-card text-text-muted line-through opacity-70 hover:border-text-muted'
              }`}
            >
              <BellIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">3天前提醒</span>
            </button>
          )}

          {/* 编辑模式下的每日必做切换 */}
          <button
            type="button"
            aria-label="每日必做"
            aria-pressed={editIsRoutine}
            onClick={() => {
              const next = !editIsRoutine;
              setEditIsRoutine(next);
              if (next) setEditIsTimed(false);
            }}
            className={`flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl border text-xs sm:text-[13px] transition-all duration-200 active:scale-[0.97] ${
              editIsRoutine
                ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                : 'border-border bg-card text-text-muted hover:border-text-muted'
            }`}
          >
            <RepeatIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">每日</span>
          </button>

          <input
            type="text"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="地点 (可选)..."
            className="h-10 shrink-0 min-w-[110px] sm:min-w-[130px] rounded-xl border border-border bg-card px-3 text-xs sm:text-[13px] text-text outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.15)]"
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
      id={`todo-item-${todo.id}`}
      className={`group relative flex items-center gap-3 sm:gap-4 overflow-hidden rounded-xl bg-card px-4 sm:px-5 py-3.5 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99] ${
        todo.completed ? 'opacity-60' : ''
      } ${
        isHighlighted ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-background bg-orange-500/10' : ''
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
        <div className="flex items-center gap-2">
          <span
            className={`break-words text-[15px] leading-snug tracking-normal transition-all duration-200 ${
              todo.completed ? 'text-text-muted line-through decoration-[#D6D3D1]' : 'text-text'
            }`}
          >
            {todo.text}
          </span>
          {/* 每日习惯标识胶囊 */}
          {todo.isRoutine && (
            <span className="inline-flex items-center gap-1 flex-shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
              <RepeatIcon className="w-3 h-3" />
              <span>每日</span>
            </span>
          )}
          {/* 阶段时限标识胶囊 */}
          {todo.isTimed && (
            <span className="inline-flex items-center gap-1 flex-shrink-0 rounded-md bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-950 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40">
              <HourglassIcon className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              <span>时限</span>
              {todo.hasReminder && (
                <span aria-label="已开启提醒" title="提前3天提醒已开启" className="ml-0.5 inline-flex items-center text-orange-700 dark:text-orange-300">
                  <BellIcon className="w-2.5 h-2.5" />
                </span>
              )}
            </span>
          )}
        </div>

        {/* 次要信息栏（时间、倒计时与地点） */}
        {(displayTime || todo.location) && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-text-muted">
            {displayTime && (
              <span className="inline-flex items-center gap-1 font-medium text-text-secondary/80">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {displayTime}
              </span>
            )}
            {countdownTag && (
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] ${
                  isOverdue
                    ? 'bg-red-50 text-red-700 font-bold border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
                    : isUrgent
                      ? 'bg-orange-500 text-white font-bold shadow-xs'
                      : 'bg-orange-50 text-orange-950 font-semibold border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30'
                }`}
              >
                {countdownTag}
              </span>
            )}
            {(displayTime || countdownTag) && todo.location && (
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
