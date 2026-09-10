import { useState, useEffect, useCallback } from 'react';
import TodoStorage from '../plugins/todoStorage';

const STORAGE_KEY = 'theme_mode';

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const THEME_MODES = ['system', 'light', 'dark', 'tomoe', 'pop'];

export default function useTheme() {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch {
      return 'system';
    }
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // 监听系统深色模式变更
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

  // 同步通知 Android 原生端（刷新桌面小组件）
  useEffect(() => {
    TodoStorage.setThemeMode({ themeMode }).catch(() => {});
  }, [themeMode]);

  // 应用 dark class 与 data-theme 属性到 documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.removeAttribute('data-theme');
    } else if (resolvedTheme === 'tomoe' || resolvedTheme === 'pop') {
      root.classList.remove('dark');
      root.setAttribute('data-theme', resolvedTheme);
    } else {
      // light / default
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
    }

    // 设置 Android 系统状态栏颜色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      let color = '#F5F0EB';
      if (resolvedTheme === 'dark') color = '#121214';
      else if (resolvedTheme === 'tomoe') color = '#F7F6F3';
      else if (resolvedTheme === 'pop') color = '#FAF7F2';
      metaThemeColor.setAttribute('content', color);
    }
  }, [resolvedTheme]);

  // 直接设置指定主题
  const setTheme = useCallback((next) => {
    if (!THEME_MODES.includes(next)) return;
    setThemeMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 静默
    }
  }, []);

  // 循环切换：system -> light -> dark -> tomoe -> pop -> system
  const cycleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const idx = THEME_MODES.indexOf(prev);
      const next = THEME_MODES[(idx + 1) % THEME_MODES.length];

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // 静默
      }
      return next;
    });
  }, []);

  return {
    themeMode,
    resolvedTheme,
    setTheme,
    cycleTheme,
  };
}
