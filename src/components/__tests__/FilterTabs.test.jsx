import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import FilterTabs from '../FilterTabs';

describe('FilterTabs', () => {
  test('渲染三个筛选标签', () => {
    render(<FilterTabs currentFilter="all" onFilterChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /全部/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /进行中/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /已完成/ })).toBeInTheDocument();
  });

  test('当前选中标签有高亮样式', () => {
    render(<FilterTabs currentFilter="active" onFilterChange={vi.fn()} />);

    const activeBtn = screen.getByRole('button', { name: /进行中/ });
    expect(activeBtn).toHaveClass('text-primary');
  });

  test('点击标签调用 onFilterChange', () => {
    const onFilterChange = vi.fn();
    render(<FilterTabs currentFilter="all" onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByRole('button', { name: /已完成/ }));

    expect(onFilterChange).toHaveBeenCalledWith('completed');
  });
});
