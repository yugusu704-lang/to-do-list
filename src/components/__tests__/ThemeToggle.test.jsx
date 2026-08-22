import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import ThemeToggle from '../ThemeToggle';

describe('ThemeToggle', () => {
  test('渲染 system 模式按钮', () => {
    render(<ThemeToggle themeMode="system" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /跟随系统/ })).toBeInTheDocument();
  });

  test('渲染 light 模式按钮', () => {
    render(<ThemeToggle themeMode="light" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /浅色模式/ })).toBeInTheDocument();
  });

  test('渲染 dark 模式按钮', () => {
    render(<ThemeToggle themeMode="dark" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /深色模式/ })).toBeInTheDocument();
  });

  test('点击按钮调用 onCycle 回调', () => {
    const onCycle = vi.fn();
    render(<ThemeToggle themeMode="system" onCycle={onCycle} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onCycle).toHaveBeenCalledTimes(1);
  });
});
