import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import TodoItem from '../TodoItem';

const baseTodo = {
  id: '1',
  text: '测试任务',
  completed: false,
  category: null,
  createdAt: Date.now(),
  dueAt: null,
  location: null,
};

describe('TodoItem', () => {
  test('渲染任务文字', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('测试任务')).toBeInTheDocument();
  });

  test('点击圆圈调用 onToggle', () => {
    const onToggle = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={onToggle} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /切换完成状态/ }));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  test('完成态有划线样式', () => {
    const completedTodo = { ...baseTodo, completed: true };
    render(<TodoItem todo={completedTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('测试任务')).toHaveClass('line-through');
  });

  test('点击删除按钮调用 onDelete', () => {
    const onDelete = vi.fn();
    const { container } = render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={onDelete} />);

    // 先 hover 显示删除按钮
    fireEvent.mouseEnter(container.firstChild);
    const deleteBtn = screen.getByRole('button', { name: /删除/ });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith('1');
  });

  test('有时间时显示纯时间', () => {
    const todoWithTime = { ...baseTodo, dueAt: '2026-07-30T15:00' };
    render(<TodoItem todo={todoWithTime} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  test('有地点时显示地点文字', () => {
    const todoWithLocation = { ...baseTodo, location: '公司会议室' };
    render(<TodoItem todo={todoWithLocation} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('公司会议室')).toBeInTheDocument();
  });

  test('无时间时不显示时间标签', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByText(/^\d{2}:\d{2}$/)).not.toBeInTheDocument();
  });
});
