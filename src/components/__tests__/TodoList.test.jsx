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

  test('同一天的任务按时间升序排列（时间更早的在上层）', () => {
    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
    const todos = [
      { id: 'late', text: '晚任务', completed: false, category: null, createdAt: Date.now(), dueAt: new Date(baseDate.getTime() + 4 * 3600000).toISOString(), location: null },
      { id: 'early', text: '早任务', completed: false, category: null, createdAt: Date.now() - 1000, dueAt: baseDate.toISOString(), location: null },
      { id: 'mid', text: '中任务', completed: false, category: null, createdAt: Date.now() - 2000, dueAt: new Date(baseDate.getTime() + 2 * 3600000).toISOString(), location: null },
    ];

    render(
      <TodoList todos={todos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    const items = screen.getAllByText(/任务$/);
    // 渲染顺序应为：早任务 → 中任务 → 晚任务
    expect(items[0]).toHaveTextContent('早任务');
    expect(items[1]).toHaveTextContent('中任务');
    expect(items[2]).toHaveTextContent('晚任务');
  });

  test('无日期任务保持原顺序（新添加的在前）', () => {
    const todos = [
      { id: 'newer', text: '新任务', completed: false, category: null, createdAt: Date.now() + 1000, dueAt: null, location: null },
      { id: 'older', text: '旧任务', completed: false, category: null, createdAt: Date.now(), dueAt: null, location: null },
    ];

    render(
      <TodoList todos={todos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    const items = screen.getAllByText(/任务$/);
    expect(items[0]).toHaveTextContent('新任务');
    expect(items[1]).toHaveTextContent('旧任务');
  });
});
