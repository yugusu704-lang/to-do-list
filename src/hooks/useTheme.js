import { useState, useEffect, useCallback } from 'react';
import TodoStorage from '../plugins/todoStorage';

const STORAGE_KEY = 'theme_mode';

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

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

  // 应用 dark class 到 documentElement
  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 设置 Android 系统状态栏颜色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#121214' : '#F5F0EB');
    }
  }, [resolvedTheme]);

  // 三态循环切换：system -> light -> dark -> system
  const cycleTheme = useCallback(() => {
    setThemeMode((prev) => {
      let next;
      if (prev === 'system') {
        next = 'light';
      } else if (prev === 'light') {
        next = 'dark';
      } else {
        next = 'system';
      }

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
    cycleTheme,
  };
}
