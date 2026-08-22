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

  test('点击编辑按钮进入编辑模式', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /编辑任务/ }));
    expect(screen.getByDisplayValue('测试任务')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /取消/ })).toBeInTheDocument();
  });

  test('点击任务文字不进入编辑模式（防止误触）', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByText('测试任务'));
    expect(screen.queryByDisplayValue('测试任务')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /保存/ })).not.toBeInTheDocument();
  });

  test('在编辑模式下修改内容并保存调用 onUpdate', () => {
    const onUpdate = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={onUpdate} />);

    // 点击编辑按钮进入编辑
    fireEvent.click(screen.getByRole('button', { name: /编辑任务/ }));

    // 修改文字
    const input = screen.getByDisplayValue('测试任务');
    fireEvent.change(input, { target: { value: '已修改的任务' } });

    // 点击保存
    fireEvent.click(screen.getByRole('button', { name: /保存/ }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      text: '已修改的任务',
    }));
  });

  test('点击取消按钮退出编辑模式且不触发 onUpdate', () => {
    const onUpdate = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: /编辑任务/ }));
    const input = screen.getByDisplayValue('测试任务');
    fireEvent.change(input, { target: { value: '不想保存的修改' } });

    fireEvent.click(screen.getByRole('button', { name: /取消/ }));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('测试任务')).toBeInTheDocument();
  });
});
