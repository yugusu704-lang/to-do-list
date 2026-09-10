import { useState, forwardRef } from 'react';
import DateButton from './DateButton';
import TodoStorage from '../plugins/todoStorage';

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

// 提醒铃铛图标 SVG
function BellIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

// 添加任务表单组件（支持 ref 转发，供 widget 深度链接聚焦输入框）
const AddTodo = forwardRef(function AddTodo({ onAdd, themeMode }, ref) {
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [location, setLocation] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);
  const [isTimed, setIsTimed] = useState(false);
  const [hasReminder, setHasReminder] = useState(true);
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
      hasReminder: isTimed ? hasReminder : false,
    });
    setText('');
    setDueAt('');
    setLocation('');
    setIsRoutine(false);
    setIsTimed(false);
    setHasReminder(true);
    setShowLocation(false);
  };

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function') {
      try {
        window.navigator.vibrate(10);
      } catch {}
    }
  };

  const toggleRoutine = () => {
    triggerHaptic();
    const next = !isRoutine;
    setIsRoutine(next);
    if (next) setIsTimed(false);
  };

  const toggleTimed = () => {
    triggerHaptic();
    const next = !isTimed;
    setIsTimed(next);
    if (next) {
      setIsRoutine(false);
      setHasReminder(true);
    }
  };

  const handleToggleReminder = () => {
    triggerHaptic();
    setHasReminder(!hasReminder);
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await TodoStorage.openNotificationSettings();
    } catch {
      // 静默处理
    }
  };

  const placeholderText = isRoutine
    ? '添加每日必做事项 (如: 每天吃钙片)...'
    : isTimed
      ? '添加阶段时限任务 (如: 9月15日前完成期末论文)...'
      : '添加新任务...';

  const isTomoe = themeMode === 'tomoe';
  const isPop = themeMode === 'pop';

  // 悬浮式 FloatingNavigationCapsule (和风淡绿底板 + 1px 抹茶微边框 + 32dp 圆角)
  const containerClasses = isTomoe
    ? 'mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-[32px] border border-[#DCE8DC] bg-[#EDF3EC]/95 shadow-[0_8px_24px_rgba(52,101,56,0.08)] backdrop-blur-md px-4 sm:px-5 py-3.5 transition-all duration-300'
    : isPop
      ? 'border-t-2 border-[#2A2C2E] bg-card px-4 sm:px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-2px_0px_#2A2C2E]'
      : 'border-t border-border/80 bg-card/40 backdrop-blur-md px-4 sm:px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]';

  const inputClasses = isTomoe
    ? 'h-11 rounded-2xl border border-[#DCE8DC] bg-white/90 px-4 text-[14px] text-[#2C2C2A] placeholder-[#9E9D95] outline-none transition-all duration-200 focus:border-[#346538] focus:shadow-[0_0_0_3px_rgba(52,101,56,0.12)]'
    : isPop
      ? 'h-11 rounded-xl border-2 border-[#2A2C2E] bg-white px-4 text-[14px] font-medium text-[#2A2C2E] placeholder-[#7A7E82] outline-none shadow-[2px_2px_0px_#2A2C2E] transition-all duration-200 focus:border-[#E26D5C]'
      : 'h-11 rounded-xl border border-border bg-card px-4 text-[14px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]';

  const timedBtnClasses = isTomoe
    ? isTimed
      ? 'border border-[#DCE8DC] bg-white text-[#346538] font-semibold shadow-[0_2px_6px_rgba(52,101,56,0.12)] rounded-full'
      : 'border border-[#DCE8DC]/80 bg-[#EDF3EC] text-[#6E6D67] hover:bg-white/60 rounded-full'
    : isPop
      ? isTimed
        ? 'border-2 border-[#2A2C2E] bg-[#F2B84B] text-[#2A2C2E] font-bold shadow-[2px_2px_0px_#2A2C2E] rounded-xl'
        : 'border-2 border-[#2A2C2E] bg-card text-text shadow-[1px_1px_0px_#2A2C2E] rounded-xl'
      : isTimed
        ? 'border-orange-600 bg-orange-100 text-orange-950 dark:border-orange-500/80 dark:bg-orange-500/20 dark:text-orange-300 font-semibold shadow-xs rounded-xl'
        : 'border-border bg-card text-text-muted hover:border-text-muted rounded-xl';

  const reminderBtnClasses = isTomoe
    ? hasReminder
      ? 'border border-[#DCE8DC] bg-white text-[#346538] font-semibold shadow-[0_2px_6px_rgba(52,101,56,0.12)] rounded-full'
      : 'border border-[#DCE8DC]/80 bg-[#EDF3EC] text-[#6E6D67] line-through opacity-70 rounded-full'
    : isPop
      ? hasReminder
        ? 'border-2 border-[#2A2C2E] bg-[#E26D5C] text-white font-bold shadow-[2px_2px_0px_#2A2C2E] rounded-xl'
        : 'border-2 border-[#2A2C2E] bg-card text-text-muted line-through opacity-70 shadow-[1px_1px_0px_#2A2C2E] rounded-xl'
      : hasReminder
        ? 'border-orange-600 bg-orange-100 text-orange-950 dark:border-orange-500/80 dark:bg-orange-500/20 dark:text-orange-300 font-semibold shadow-xs rounded-xl'
        : 'border-border bg-card text-text-muted line-through opacity-70 hover:border-text-muted rounded-xl';

  const routineBtnClasses = isTomoe
    ? isRoutine
      ? 'border border-[#DCE8DC] bg-white text-[#346538] font-semibold shadow-[0_2px_6px_rgba(52,101,56,0.12)] rounded-full'
      : 'border border-[#DCE8DC]/80 bg-[#EDF3EC] text-[#6E6D67] hover:bg-white/60 rounded-full'
    : isPop
      ? isRoutine
        ? 'border-2 border-[#2A2C2E] bg-[#73A580] text-white font-bold shadow-[2px_2px_0px_#2A2C2E] rounded-xl'
        : 'border-2 border-[#2A2C2E] bg-card text-text shadow-[1px_1px_0px_#2A2C2E] rounded-xl'
      : isRoutine
        ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs rounded-xl'
        : 'border-border bg-card text-text-muted hover:border-text-muted rounded-xl';

  const locationBtnClasses = isTomoe
    ? 'flex h-10 shrink-0 whitespace-nowrap items-center justify-center rounded-full border border-[#DCE8DC] bg-[#EDF3EC] px-3 text-xs sm:text-[13px] text-[#6E6D67] transition-all duration-200 hover:bg-white/60 active:scale-[0.97]'
    : isPop
      ? 'flex h-10 shrink-0 whitespace-nowrap items-center justify-center rounded-xl border-2 border-[#2A2C2E] bg-card px-3 text-xs sm:text-[13px] font-bold text-text shadow-[1px_1px_0px_#2A2C2E] transition-all duration-200 hover:border-[#2A2C2E] active:translate-x-[1px] active:translate-y-[1px]'
      : 'flex h-10 shrink-0 whitespace-nowrap items-center justify-center rounded-xl border border-border bg-card px-3 text-xs sm:text-[13px] text-text-muted transition-all duration-200 hover:border-text-muted active:scale-[0.97]';

  const submitBtnClasses = isTomoe
    ? 'h-11 rounded-[24px] bg-[#346538] hover:bg-[#2B542F] text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(52,101,56,0.2)] transition-all duration-150 active:scale-[0.97]'
    : isPop
      ? 'h-11 rounded-xl bg-[#2A2C2E] hover:bg-[#1A1C1E] text-[15px] font-bold text-white border-2 border-[#2A2C2E] shadow-[2px_2px_0px_#2A2C2E] transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#2A2C2E]'
      : 'h-11 rounded-xl bg-btn-main text-[15px] font-medium text-white transition-all duration-150 hover:bg-btn-main-hover active:scale-[0.97]';

  return (
    <div className={containerClasses}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {/* 任务内容输入 */}
        <input
          ref={ref}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderText}
          autoComplete="off"
          className={inputClasses}
        />

        {/* 日期按钮 + 时限按钮 + 提前3天 + 每日必做 + 地点按钮（支持无缝横向滚动，永不折行挤压） */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <DateButton value={dueAt} onChange={setDueAt} />

          {/* 阶段时限开关胶囊 */}
          <button
            type="button"
            aria-label="阶段时限"
            aria-pressed={isTimed}
            onClick={toggleTimed}
            className={`flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-1.5 px-2.5 sm:px-3 border text-xs sm:text-[13px] transition-all duration-200 active:scale-[0.97] ${timedBtnClasses}`}
          >
            <HourglassIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">时限</span>
          </button>

          {/* 提前3天提醒开关胶囊（仅在激活时限时呈现） */}
          {isTimed && (
            <button
              type="button"
              aria-label="提前3天提醒"
              aria-pressed={hasReminder}
              onClick={handleToggleReminder}
              className={`flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-1.5 px-2.5 sm:px-3 border text-xs sm:text-[13px] transition-all duration-200 active:scale-[0.97] ${reminderBtnClasses}`}
            >
              <BellIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">3天前提醒</span>
            </button>
          )}

          {/* 每日必做开关胶囊 */}
          <button
            type="button"
            aria-label="每日必做"
            aria-pressed={isRoutine}
            onClick={toggleRoutine}
            className={`flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-1.5 px-2.5 sm:px-3 border text-xs sm:text-[13px] transition-all duration-200 active:scale-[0.97] ${routineBtnClasses}`}
          >
            <RepeatIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">每日</span>
          </button>

          {showLocation ? (
            <div className="relative flex items-center shrink-0 min-w-[110px] sm:min-w-[140px]">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="输入地点..."
                autoFocus
                autoComplete="off"
                className={isTomoe
                  ? 'h-10 w-full rounded-full border border-[#DCE8DC] bg-white px-3 pr-6 text-xs sm:text-[13px] text-[#2C2C2A] outline-none transition-all duration-200 focus:border-[#346538]'
                  : isPop
                    ? 'h-10 w-full rounded-xl border-2 border-[#2A2C2E] bg-white px-3 pr-6 text-xs sm:text-[13px] text-[#2A2C2E] outline-none shadow-[2px_2px_0px_#2A2C2E] transition-all duration-200 focus:border-[#E26D5C]'
                    : 'h-10 w-full rounded-xl border border-border bg-card px-3 pr-6 text-xs sm:text-[13px] text-text outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]'
                }
              />
              {location && (
                <button
                  type="button"
                  onClick={() => setLocation('')}
                  aria-label="清除地点"
                  className="absolute right-2 text-text-muted hover:text-text text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLocation(true)}
              className={locationBtnClasses}
            >
              <span className="whitespace-nowrap">{location ? location : '地点'}</span>
            </button>
          )}
        </div>

        {/* 时限任务提醒小贴士 */}
        {isTimed && (
          <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-orange-950/80 dark:text-orange-300/80">
            <span className="truncate">
              {hasReminder
                ? '⏰ 截止前3天早晨 09:00 将发送桌面横幅提醒'
                : '⏰ 已关闭提前3天桌面横幅提醒'}
            </span>
            <button
              type="button"
              onClick={handleOpenNotificationSettings}
              className="shrink-0 font-semibold text-orange-700 dark:text-orange-400 hover:underline"
            >
              悬浮权限设置 &gt;
            </button>
          </div>
        )}

        {/* 添加按钮 */}
        <button
          type="submit"
          className={submitBtnClasses}
        >
          {isRoutine ? '添加每日必做' : isTimed ? '添加时限任务' : '添加'}
        </button>
      </form>
    </div>
  );
});

export default AddTodo;

