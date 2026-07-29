import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import TodoList from '../TodoList';

const mockTodos = [
  { id: '1', text: '任务一', completed: false, category: null, createdAt: Date.now(), dueAt: new Date().toISOString().slice(0, 16), location: null },
  { id: '2', text: '任务二', completed: true, category: null, createdAt: Date.now() - 86400000, dueAt: null, location: null },
];

describe('TodoList', () => {
  test('传入任务数组渲染对应数量的任务项', () => {
    render(
      <TodoList todos={mockTodos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText('任务一')).toBeInTheDocument();
    expect(screen.getByText('任务二')).toBeInTheDocument();
  });

  test('空数组显示 EmptyState', () => {
    render(
      <TodoList todos={[]} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText(/还没有任务/)).toBeInTheDocument();
  });

  test('有时间的任务按日期分组', () => {
    render(
      <TodoList todos={mockTodos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    // 有时间的任务应该显示"今天"分组
    expect(screen.getByText('今天')).toBeInTheDocument();
    // 无时间的任务应该显示"无日期"分组
    expect(screen.getByText('无日期')).toBeInTheDocument();
  });
});
