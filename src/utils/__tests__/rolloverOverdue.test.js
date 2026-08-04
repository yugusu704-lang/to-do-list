import { describe, test, expect } from 'vitest';
import { rolloverOverdue, getLocalDateKey } from '../rolloverOverdue';

// 固定"今天"：2026-08-04 本地时间 10:00，todayKey = '2026-08-04'
const NOW = new Date(2026, 7, 4, 10, 0);

// 构造最小任务对象（仅保留顺延逻辑用到的字段）
function makeTodo(overrides = {}) {
  return {
    id: 't1',
    text: '任务',
    completed: false,
    dueAt: null,
    ...overrides,
  };
}

describe('getLocalDateKey', () => {
  test('输出 YYYY-MM-DD 且月/日补零', () => {
    expect(getLocalDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(getLocalDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  test('取本地日期（不跨时区偏移）', () => {
    // 2026-08-04 23:30 本地时间仍是 08-04
    expect(getLocalDateKey(new Date(2026, 7, 4, 23, 30))).toBe('2026-08-04');
  });
});

describe('rolloverOverdue', () => {
  test('过期未完成任务顺延到今天，保留原时间', () => {
    const todo = makeTodo({ dueAt: '2020-08-06T09:00' });
    const { todos, rolledCount } = rolloverOverdue([todo], NOW);
    expect(todos[0].dueAt).toBe('2026-08-04T09:00');
    expect(rolledCount).toBe(1);
  });

  test('今天到期的任务不顺延', () => {
    const todo = makeTodo({ dueAt: '2026-08-04T23:59' });
    const result = rolloverOverdue([todo], NOW);
    expect(result.rolledCount).toBe(0);
    expect(result.todos[0]).toBe(todo); // 返回原引用
  });

  test('未来任务不顺延', () => {
    const future = makeTodo({ id: 'f1', dueAt: '2026-08-05T08:00' });
    const farFuture = makeTodo({ id: 'f2', dueAt: '2099-09-30T09:00' });
    const { todos, rolledCount } = rolloverOverdue([future, farFuture], NOW);
    expect(rolledCount).toBe(0);
    expect(todos[0]).toBe(future);
    expect(todos[1]).toBe(farFuture);
  });

  test('已完成 + 过期的任务不顺延（需求 7）', () => {
    const todo = makeTodo({ completed: true, dueAt: '2020-08-06T09:00' });
    const { todos, rolledCount } = rolloverOverdue([todo], NOW);
    expect(rolledCount).toBe(0);
    expect(todos[0]).toBe(todo);
  });

  test('无 dueAt 的任务不顺延（需求 5）', () => {
    const todo = makeTodo({ dueAt: null });
    const { todos, rolledCount } = rolloverOverdue([todo], NOW);
    expect(rolledCount).toBe(0);
    expect(todos[0]).toBe(todo);
  });

  test('多天前过期直接顺延到今天，不逐天累积（需求 2）', () => {
    const todo = makeTodo({ dueAt: '2020-08-06T15:30' });
    const { todos, rolledCount } = rolloverOverdue([todo], NOW);
    expect(rolledCount).toBe(1);
    expect(todos[0].dueAt).toBe('2026-08-04T15:30');
  });

  test('混合数组只顺延过期未完成者，其余不变', () => {
    const overdue = makeTodo({ id: 'o', dueAt: '2020-08-06T09:00' });
    const today = makeTodo({ id: 't', dueAt: '2026-08-04T12:00' });
    const noDate = makeTodo({ id: 'n', dueAt: null });
    const doneOverdue = makeTodo({ id: 'd', completed: true, dueAt: '2020-08-06T09:00' });
    const { todos, rolledCount } = rolloverOverdue([overdue, today, noDate, doneOverdue], NOW);
    expect(rolledCount).toBe(1);
    expect(todos[0].dueAt).toBe('2026-08-04T09:00');
    expect(todos[1]).toBe(today);
    expect(todos[2]).toBe(noDate);
    expect(todos[3]).toBe(doneOverdue);
  });

  test('无效日期字符串不崩溃不顺延', () => {
    const todo = makeTodo({ dueAt: 'not-a-date' });
    const { todos, rolledCount } = rolloverOverdue([todo], NOW);
    expect(rolledCount).toBe(0);
    expect(todos[0]).toBe(todo);
  });

  test('幂等：对顺延结果再跑一次，返回相同引用且 count=0', () => {
    const todo = makeTodo({ dueAt: '2020-08-06T09:00' });
    const first = rolloverOverdue([todo], NOW);
    expect(first.rolledCount).toBe(1);

    const second = rolloverOverdue(first.todos, NOW);
    expect(second.rolledCount).toBe(0);
    expect(second.todos).toBe(first.todos);
  });

  test('多个过期任务各自保留原时间', () => {
    const a = makeTodo({ id: 'a', dueAt: '2020-08-06T09:00' });
    const b = makeTodo({ id: 'b', dueAt: '2020-08-06T23:30' });
    const { todos, rolledCount } = rolloverOverdue([a, b], NOW);
    expect(rolledCount).toBe(2);
    expect(todos[0].dueAt).toBe('2026-08-04T09:00');
    expect(todos[1].dueAt).toBe('2026-08-04T23:30');
  });

  test('边界：昨天 23:59 顺延，今天 00:00 不动', () => {
    const yesterday = makeTodo({ id: 'y', dueAt: '2026-08-03T23:59' });
    const todayStart = makeTodo({ id: 's', dueAt: '2026-08-04T00:00' });
    const { todos, rolledCount } = rolloverOverdue([yesterday, todayStart], NOW);
    expect(rolledCount).toBe(1);
    expect(todos[0].dueAt).toBe('2026-08-04T23:59');
    expect(todos[1]).toBe(todayStart);
  });

  test('跨年边界：12月31日顺延到次年1月1日', () => {
    const todo = makeTodo({ dueAt: '2025-12-31T23:59' });
    const newYear = new Date(2026, 0, 1, 8, 0);
    const { todos, rolledCount } = rolloverOverdue([todo], newYear);
    expect(rolledCount).toBe(1);
    expect(todos[0].dueAt).toBe('2026-01-01T23:59');
  });

  test('纯函数性：原数组和未顺延项不被改写', () => {
    const overdue = makeTodo({ id: 'o', dueAt: '2020-08-06T09:00' });
    const today = makeTodo({ id: 't', dueAt: '2026-08-04T12:00' });
    const original = [overdue, today];
    const snapshot = [overdue, today];

    rolloverOverdue(original, NOW);

    expect(original).toEqual(snapshot);
    expect(overdue.dueAt).toBe('2020-08-06T09:00'); // 原对象未被 mutate
    expect(today.dueAt).toBe('2026-08-04T12:00');
  });

  test('格式防御：dueAt 无 T 分隔符不顺延', () => {
    const todo = makeTodo({ dueAt: '20200806T0900' });
    const { todos, rolledCount } = rolloverOverdue([todo], NOW);
    expect(rolledCount).toBe(0);
    expect(todos[0]).toBe(todo);
  });

  test('无过期任务时返回原数组引用', () => {
    const today = makeTodo({ dueAt: '2026-08-04T12:00' });
    const noDate = makeTodo({ dueAt: null });
    const original = [today, noDate];
    const result = rolloverOverdue(original, NOW);
    expect(result.rolledCount).toBe(0);
    expect(result.todos).toBe(original); // 严格相等：原引用
  });
});
