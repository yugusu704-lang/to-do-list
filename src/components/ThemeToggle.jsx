import { useState, useRef, useEffect } from 'react';

// 浅色模式 Sun 图标
function SunIcon({ className = 'w-[19px] h-[19px]' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
function MoonIcon({ className = 'w-[19px] h-[19px]' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// 跟随系统 System 图标
function SystemIcon({ className = 'w-[19px] h-[19px]' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  );
}

// 日式巴川纸 Tomoe 图标（书本手帐折角纸意象）
function TomoeIcon({ className = 'w-[19px] h-[19px]' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6" />
      <path d="M9 11h4" />
    </svg>
  );
}

// 灰调波普 Pop 图标（复古四角星星）
function PopIcon({ className = 'w-[19px] h-[19px]' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export const THEME_OPTIONS = [
  {
    id: 'system',
    name: '跟随系统',
    desc: '自动匹配手机明暗',
    icon: SystemIcon,
    bg: '#F5F0EB',
    dot: '#2F3437',
  },
  {
    id: 'light',
    name: '经典浅色',
    desc: '柔和米白经典纸感',
    icon: SunIcon,
    bg: '#FFFFFF',
    dot: '#2563EB',
  },
  {
    id: 'dark',
    name: '经典深色',
    desc: '深邃纯黑夜间护眼',
    icon: MoonIcon,
    bg: '#121214',
    dot: '#3B82F6',
  },
  {
    id: 'tomoe',
    name: '日式巴川纸',
    desc: '暖骨白与松烟墨，抹茶悬浮底栏',
    icon: TomoeIcon,
    bg: '#F7F6F3',
    dot: '#346538',
  },
  {
    id: 'pop',
    name: '灰调复古波普',
    desc: '燕麦奶油底，工整墨线与硬投影',
    icon: PopIcon,
    bg: '#FAF7F2',
    dot: '#E26D5C',
  },
];

// 主题切换按钮组件（支持轻量弹窗菜单选择）
export default function ThemeToggle({ themeMode = 'system', onSelectTheme, onCycle }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // 点击外部关闭弹窗
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const currentTheme = THEME_OPTIONS.find((t) => t.id === themeMode) || THEME_OPTIONS[0];
  const CurrentIcon = currentTheme.icon;

  const handleSelect = (id) => {
    if (typeof onSelectTheme === 'function') {
      onSelectTheme(id);
    } else if (typeof onCycle === 'function') {
      onCycle();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`当前主题：${currentTheme.name}，点击切换`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`当前主题：${currentTheme.name}（点击展开主题列表）`}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border/80 bg-card text-text-secondary shadow-sm transition-all duration-150 hover:border-text-muted hover:text-text active:scale-90"
      >
        <CurrentIcon />
      </button>

      {/* 主题选择浮动菜单面板 */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          aria-label="主题选择菜单"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur-md z-50 animate-[fadeInUp_0.15s_ease-out]"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            选择主题风格
          </div>
          <div className="flex flex-col gap-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitem"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.id)}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors duration-150 ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* 预览色块小圆球 */}
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/80 shadow-2xs"
                      style={{ backgroundColor: opt.bg }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: opt.dot }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate leading-snug">{opt.name}</span>
                      <span className="truncate text-[10px] text-text-muted font-normal">
                        {opt.desc}
                      </span>
                    </div>
                  </div>

                  {/* 选中打勾 */}
                  {isSelected && (
                    <svg
                      className="w-4 h-4 shrink-0 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
