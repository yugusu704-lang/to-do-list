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
    expect(screen.getByRole('button', { name: /经典浅色/ })).toBeInTheDocument();
  });

  test('渲染 dark 模式按钮', () => {
    render(<ThemeToggle themeMode="dark" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /经典深色/ })).toBeInTheDocument();
  });

  test('渲染 tomoe 模式按钮', () => {
    render(<ThemeToggle themeMode="tomoe" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /日式巴川纸/ })).toBeInTheDocument();
  });

  test('渲染 pop 模式按钮', () => {
    render(<ThemeToggle themeMode="pop" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /灰调复古波普/ })).toBeInTheDocument();
  });

  test('点击按钮展开菜单并支持选择主题', () => {
    const onSelectTheme = vi.fn();
    render(<ThemeToggle themeMode="system" onSelectTheme={onSelectTheme} />);

    // 点击主按钮展开主题菜单
    fireEvent.click(screen.getByRole('button', { name: /跟随系统/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // 点击选择日式巴川纸
    const tomoeItem = screen.getByRole('menuitem', { name: /日式巴川纸/ });
    fireEvent.click(tomoeItem);

    expect(onSelectTheme).toHaveBeenCalledWith('tomoe');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('未提供 onSelectTheme 时，点击菜单项后备调用 onCycle', () => {
    const onCycle = vi.fn();
    render(<ThemeToggle themeMode="system" onCycle={onCycle} />);

    fireEvent.click(screen.getByRole('button', { name: /跟随系统/ }));
    const darkItem = screen.getByRole('menuitem', { name: /经典深色/ });
    fireEvent.click(darkItem);

    expect(onCycle).toHaveBeenCalledTimes(1);
  });
});
