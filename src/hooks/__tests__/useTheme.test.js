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

  test('五态循环切换：system -> light -> dark -> tomoe -> pop -> system', () => {
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
    expect(result.current.themeMode).toBe('tomoe');
    expect(localStorage.getItem('theme_mode')).toBe('tomoe');
    expect(document.documentElement.getAttribute('data-theme')).toBe('tomoe');

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.themeMode).toBe('pop');
    expect(localStorage.getItem('theme_mode')).toBe('pop');
    expect(document.documentElement.getAttribute('data-theme')).toBe('pop');

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.themeMode).toBe('system');
    expect(localStorage.getItem('theme_mode')).toBe('system');
  });

  test('通过 setTheme 直接切换到巴川纸与波普主题', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('tomoe');
    });
    expect(result.current.themeMode).toBe('tomoe');
    expect(document.documentElement.getAttribute('data-theme')).toBe('tomoe');
    expect(localStorage.getItem('theme_mode')).toBe('tomoe');

    act(() => {
      result.current.setTheme('pop');
    });
    expect(result.current.themeMode).toBe('pop');
    expect(document.documentElement.getAttribute('data-theme')).toBe('pop');
    expect(localStorage.getItem('theme_mode')).toBe('pop');
  });

  test('从 localStorage 恢复用户之前的主题设置', () => {
    localStorage.setItem('theme_mode', 'dark');
    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
