import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  test('渲染默认空状态提示', () => {
    render(<EmptyState filter="all" />);
    expect(screen.getByText(/还没有任务/)).toBeInTheDocument();
  });

  test('进行中筛选为空时显示不同提示', () => {
    render(<EmptyState filter="active" />);
    expect(screen.getByText(/所有任务都完成了/)).toBeInTheDocument();
  });

  test('已完成筛选为空时显示不同提示', () => {
    render(<EmptyState filter="completed" />);
    expect(screen.getByText(/还没有已完成的任务/)).toBeInTheDocument();
  });
});
