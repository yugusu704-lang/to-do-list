// 浅色模式 Sun 图标
function SunIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// 深色模式 Moon 图标
function MoonIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// 跟随系统 System 图标（半明半暗圆圈）
function SystemIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  );
}

// 主题切换按钮组件
export default function ThemeToggle({ themeMode, onCycle }) {
  const label =
    themeMode === 'light'
      ? '浅色模式'
      : themeMode === 'dark'
        ? '深色模式'
        : '跟随系统';

  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`当前主题：${label}，点击切换`}
      title={`当前主题：${label}（点击切换）`}
      className="flex h-9 w-9 sm:h-9.5 sm:w-9.5 items-center justify-center rounded-2xl border border-border/70 bg-card/80 text-text-secondary shadow-2xs transition-all duration-150 hover:border-border hover:text-text hover:bg-card active:scale-90 backdrop-blur-xs"
    >
      {themeMode === 'light' && <SunIcon />}
      {themeMode === 'dark' && <MoonIcon />}
      {themeMode === 'system' && <SystemIcon />}
    </button>
  );
}
