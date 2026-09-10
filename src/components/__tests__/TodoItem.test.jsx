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

  test('isRoutine 为 true 时显示专属“每日”徽标', () => {
    const routineTodo = { ...baseTodo, isRoutine: true };
    render(<TodoItem todo={routineTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('每日')).toBeInTheDocument();
  });

  test('编辑模式下可以切换“每日”属性并保存', () => {
    const onUpdate = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: /编辑任务/ }));

    const routineToggle = screen.getByRole('button', { name: /每日/ });
    fireEvent.click(routineToggle);

    fireEvent.click(screen.getByRole('button', { name: /保存/ }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      isRoutine: true,
    }));
  });

  test('isTimed 为 true 时显示专属“时限”徽标与完整日期+时间', () => {
    const timedTodo = {
      ...baseTodo,
      isTimed: true,
      dueAt: '2026-09-19T10:30',
    };
    render(<TodoItem todo={timedTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('时限')).toBeInTheDocument();
    // 应该包含 9月19日 和 10:30
    expect(screen.getByText(/9月19日\s*10:30/)).toBeInTheDocument();
  });

  test('isTimed 为 true 时渲染智能倒计时标签', () => {
    // 设置一个明显超期的时间和一个今天的时间
    const overdueTodo = {
      ...baseTodo,
      isTimed: true,
      dueAt: '2020-01-01T10:00',
    };
    render(<TodoItem todo={overdueTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('已超期')).toBeInTheDocument();
  });

  test('编辑模式下可以切换“时限”属性并保存', () => {
    const onUpdate = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: /编辑任务/ }));

    const timedToggle = screen.getByRole('button', { name: /阶段时限/ });
    fireEvent.click(timedToggle);

    fireEvent.click(screen.getByRole('button', { name: /保存/ }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      isTimed: true,
    }));
  });

  test('isTimed 为 true 且 hasReminder 为 true 时渲染已开启提醒标识', () => {
    const timedReminderTodo = {
      ...baseTodo,
      isTimed: true,
      hasReminder: true,
      dueAt: '2026-09-20T10:00',
    };
    render(<TodoItem todo={timedReminderTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByLabelText('已开启提醒')).toBeInTheDocument();
  });

  test('编辑模式下可以切换“3天前提醒”并保存', () => {
    const onUpdate = vi.fn();
    const timedTodo = {
      ...baseTodo,
      isTimed: true,
      hasReminder: true,
      dueAt: '2026-09-20T10:00',
    };
    render(<TodoItem todo={timedTodo} onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: /编辑任务/ }));

    const reminderBtn = screen.getByRole('button', { name: /提前3天提醒/ });
    expect(reminderBtn.getAttribute('aria-pressed')).toBe('true');

    // 切换关闭提醒
    fireEvent.click(reminderBtn);
    expect(reminderBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: /保存/ }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      isTimed: true,
      hasReminder: false,
    }));
  });

  test('isHighlighted 为 true 时渲染聚焦高亮样式', () => {
    const { container } = render(
      <TodoItem todo={baseTodo} onToggle={vi.fn()} onDelete={vi.fn()} isHighlighted={true} />
    );

    expect(container.firstChild).toHaveClass('ring-orange-500');
  });

  test('极端紧急倒计时（今天截止）渲染实心暖橙药丸高亮样式', () => {
    const today = new Date().toISOString();
    const urgentTodo = {
      id: 'urgent-1',
      text: '紧急汇报',
      completed: false,
      isTimed: true,
      dueAt: today,
    };

    render(<TodoItem todo={urgentTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);

    const badge = screen.getByText('今天截止');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-orange-500');
    expect(badge).toHaveClass('text-white');
  });
});

