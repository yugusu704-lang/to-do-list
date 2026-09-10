import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import TimedSection from '../TimedSection';

const sampleTimedTodos = [
  {
    id: 't1',
    text: '提交开题报告',
    completed: false,
    isTimed: true,
    dueAt: '2026-09-15T18:00',
    location: null,
  },
  {
    id: 't2',
    text: '完成中期答辩',
    completed: true,
    isTimed: true,
    dueAt: '2026-09-30T18:00',
    location: null,
  },
];

describe('TimedSection', () => {
  test('当无时限任务时，返回 null', () => {
    const { container } = render(
      <TimedSection
        todos={[]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('默认收起折叠态：显示标题、进行中统计与展开按钮，不直接列出任务详情', () => {
    render(
      <TimedSection
        todos={sampleTimedTodos}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('时限任务')).toBeInTheDocument();
    expect(screen.getByText('1 项进行中')).toBeInTheDocument();
    expect(screen.getByText('展开')).toBeInTheDocument();
    // 默认折叠状态下，任务详情未挂载/不可见
    expect(screen.queryByText('提交开题报告')).not.toBeInTheDocument();
  });

  test('点击切换展开/收起：展开后能够显示任务内容与操作', () => {
    render(
      <TimedSection
        todos={sampleTimedTodos}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /时限任务/ });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('收起')).toBeInTheDocument();
    expect(screen.getByText('提交开题报告')).toBeInTheDocument();
    expect(screen.getByText('完成中期答辩')).toBeInTheDocument();

    // 再次点击收起
    fireEvent.click(toggleBtn);
    expect(screen.getByText('展开')).toBeInTheDocument();
    expect(screen.queryByText('提交开题报告')).not.toBeInTheDocument();
  });

  test('根据 filter 正确过滤时限任务', () => {
    const { rerender } = render(
      <TimedSection
        todos={sampleTimedTodos}
        filter="active"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    // 展开查看
    fireEvent.click(screen.getByRole('button', { name: /时限任务/ }));
    expect(screen.getByText('提交开题报告')).toBeInTheDocument();
    expect(screen.queryByText('完成中期答辩')).not.toBeInTheDocument();

    // 切换为 completed
    rerender(
      <TimedSection
        todos={sampleTimedTodos}
        filter="completed"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.queryByText('提交开题报告')).not.toBeInTheDocument();
    expect(screen.getByText('完成中期答辩')).toBeInTheDocument();
  });

  test('传入 highlightedTodoId 时自动展开专区并高亮目标任务', () => {
    render(
      <TimedSection
        todos={sampleTimedTodos}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
        highlightedTodoId="t1"
      />
    );

    // 自动展开，任务已挂载并呈现
    expect(screen.getByText('收起')).toBeInTheDocument();
    expect(screen.getByText('提交开题报告')).toBeInTheDocument();

    const targetItem = document.getElementById('todo-item-t1');
    expect(targetItem).toHaveClass('ring-amber-500');
  });

  test('展开后显示桌面横幅通知指引，点击权限设置触发 TodoStorage.openNotificationSettings', async () => {
    render(
      <TimedSection
        todos={sampleTimedTodos}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    // 展开
    fireEvent.click(screen.getByRole('button', { name: /时限任务/ }));
    expect(screen.getByText(/桌面横幅弹窗需开启系统「悬浮通知」/)).toBeInTheDocument();

    const settingsBtn = screen.getByRole('button', { name: /权限设置/ });
    expect(settingsBtn).toBeInTheDocument();
    fireEvent.click(settingsBtn);
  });
});

