import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import useTheme from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('默认初始化为 system 模式', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeMode).toBe('system');
  });

  test('三态循环切换：system -> light -> dark -> system', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.themeMode).toBe('light');
    expect(localStorage.getItem('theme_mode')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.themeMode).toBe('dark');
    expect(localStorage.getItem('theme_mode')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.themeMode).toBe('system');
    expect(localStorage.getItem('theme_mode')).toBe('system');
  });

  test('从 localStorage 恢复用户之前的主题设置', () => {
    localStorage.setItem('theme_mode', 'dark');
    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
