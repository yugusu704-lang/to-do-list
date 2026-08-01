import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import TodoList from '../TodoList';

const mockTodos = [
  { id: '1', text: '任务一', completed: false, category: null, createdAt: Date.now(), dueAt: new Date().toISOString().slice(0, 16), location: null },
  { id: '2', text: '任务二', completed: true, category: null, createdAt: Date.now() - 86400000, dueAt: null, location: null },
];

// 固定未来日期：保证跨月/同月排序稳定，且与运行日期无关（2099 年恒为"未来日期"分组）
const SEP_30 = '2099-09-30T09:00';
const OCT_01 = '2099-10-01T09:00';
const OCT_02 = '2099-10-02T09:00';
// 固定过去日期（2020 年恒为"已过期"），用于验证多个过期日期合并为一个分组
const PAST_AUG_06 = '2020-08-06T09:00';
const PAST_AUG_11 = '2020-08-11T09:00';

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

  test('跨月任务按日期严格升序（9月30日在10月1日上方）', () => {
    const todos = [
      // 数组中先添加 10月1日，后添加 9月30日 → 渲染顺序应仍为 9月30日在上
      { id: 'oct', text: '十月一日任务', completed: false, category: null, createdAt: Date.now(), dueAt: OCT_01, location: null },
      { id: 'sep', text: '九月三十日任务', completed: false, category: null, createdAt: Date.now() - 1000, dueAt: SEP_30, location: null },
    ];

    render(
      <TodoList todos={todos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    // 修复前：localeCompare 会把 "10月1日" 排在 "9月30日" 之前
    const items = screen.getAllByText(/任务$/);
    expect(items[0]).toHaveTextContent('九月三十日任务');
    expect(items[1]).toHaveTextContent('十月一日任务');
  });

  test('无日期任务排在最顶部（在"今天"分组上方）', () => {
    const todos = [
      { id: 'nodate', text: '无日期任务', completed: false, category: null, createdAt: Date.now(), dueAt: null, location: null },
      { id: 'today', text: '今日任务', completed: false, category: null, createdAt: Date.now() - 1000, dueAt: new Date().toISOString().slice(0, 16), location: null },
    ];

    render(
      <TodoList todos={todos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    // 修复前：无日期分组被追加在列表最底部
    const items = screen.getAllByText(/任务$/);
    expect(items[0]).toHaveTextContent('无日期任务');
    expect(items[1]).toHaveTextContent('今日任务');
  });

  test('多个"已过期"日期合并为一个分组，内部按日期升序', () => {
    const todos = [
      // 较近的过期任务先添加，更早的过期任务后添加 → 渲染顺序应仍为更早的在上
      { id: 'recent', text: '较近过期任务', completed: false, category: null, createdAt: Date.now(), dueAt: PAST_AUG_11, location: null },
      { id: 'older', text: '更早过期任务', completed: false, category: null, createdAt: Date.now() - 1000, dueAt: PAST_AUG_06, location: null },
    ];

    render(
      <TodoList todos={todos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    // 两个过期日期应合并到同一个"已过期"分组头下（只渲染一次）
    const headers = screen.getAllByText('已过期');
    expect(headers).toHaveLength(1);
    // 分组内部按日期升序：更早过期（8月6日）在上
    const items = screen.getAllByText(/任务$/);
    expect(items[0]).toHaveTextContent('更早过期任务');
    expect(items[1]).toHaveTextContent('较近过期任务');
  });

  test('无日期置顶，且多个未来日期分组按时间升序', () => {
    const todos = [
      // 打乱添加顺序：无日期 → 10月2日 → 9月30日 → 10月1日
      { id: 'nodate', text: '待定任务', completed: false, category: null, createdAt: Date.now(), dueAt: null, location: null },
      { id: 'd62', text: '十月二日任务', completed: false, category: null, createdAt: Date.now() - 1000, dueAt: OCT_02, location: null },
      { id: 'd60', text: '九月三十日任务', completed: false, category: null, createdAt: Date.now() - 2000, dueAt: SEP_30, location: null },
      { id: 'd61', text: '十月一日任务', completed: false, category: null, createdAt: Date.now() - 3000, dueAt: OCT_01, location: null },
    ];

    render(
      <TodoList todos={todos} filter="all" onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    // 渲染顺序应为：无日期 → 9月30日 → 10月1日 → 10月2日
    const items = screen.getAllByText(/任务$/);
    expect(items[0]).toHaveTextContent('待定任务');
    expect(items[1]).toHaveTextContent('九月三十日任务');
    expect(items[2]).toHaveTextContent('十月一日任务');
    expect(items[3]).toHaveTextContent('十月二日任务');
  });
});
