import { useRef, useCallback } from 'react';

// 日历图标 SVG
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// 格式化日期显示
function formatDateLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

// 日期选择按钮组件（样式化按钮触发原生日期选择器）
export default function DateButton({ value, onChange }) {
  const inputRef = useRef(null);

  const handleClick = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    // 移除 hidden 样式，点击时显示原生控件
    input.style.position = 'static';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.opacity = '1';
    input.style.pointerEvents = 'auto';
    input.focus();
    // 触发原生选择器（支持的浏览器会打开 picker）
    if (typeof input.showPicker === 'function') {
      try { input.showPicker(); } catch { /* 静默处理 */ }
    }
  }, []);

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
    // 选择后恢复隐藏样式
    const input = inputRef.current;
    if (input) {
      input.style.position = 'absolute';
      input.style.width = '0';
      input.style.height = '0';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
    }
  }, [onChange]);

  const label = formatDateLabel(value);

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="datetime-local"
        value={value || ''}
        onChange={handleChange}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={handleClick}
        className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[13px] transition-all duration-200 hover:border-text-muted active:scale-[0.97] ${
          label ? 'text-text' : 'text-text-muted'
        }`}
      >
        <CalendarIcon />
        <span>{label || '添加日期'}</span>
      </button>
    </div>
  );
}
