import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import useTodos from '../useTodos';

// 本地今天日期键 YYYY-MM-DD（与 rolloverOverdue 同源逻辑，避免依赖系统时区差异）
function todayKey() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('添加一条任务（仅 text）', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: '买牛奶' });
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('买牛奶');
    expect(result.current.todos[0].completed).toBe(false);
    expect(result.current.todos[0].dueAt).toBeNull();
    expect(result.current.todos[0].location).toBeNull();
  });

  test('添加任务带时间和地点', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({
        text: '开会',
        dueAt: '2026-07-30T15:00',
        location: '公司会议室',
      });
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('开会');
    expect(result.current.todos[0].dueAt).toBe('2026-07-30T15:00');
    expect(result.current.todos[0].location).toBe('公司会议室');
  });

  test('切换任务完成状态', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: '买牛奶' });
    });

    const todoId = result.current.todos[0].id;

    act(() => {
      result.current.toggleTodo(todoId);
    });

    expect(result.current.todos[0].completed).toBe(true);
    expect(result.current.todos[0].completedAt).toBeTypeOf('number');

    act(() => {
      result.current.toggleTodo(todoId);
    });

    expect(result.current.todos[0].completed).toBe(false);
    expect(result.current.todos[0].completedAt).toBeNull();
  });

  test('删除任务', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: '买牛奶' });
      result.current.addTodo({ text: '写代码' });
    });

    expect(result.current.todos).toHaveLength(2);

    const idToDelete = result.current.todos[0].id;

    act(() => {
      result.current.deleteTodo(idToDelete);
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('买牛奶');
  });

  test('数据写入 localStorage', async () => {
    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    act(() => {
      result.current.addTodo({ text: '持久化测试', dueAt: '2026-07-30T10:00' });
    });

    // 等待异步保存完成
    await new Promise((r) => setTimeout(r, 50));

    const stored = JSON.parse(localStorage.getItem('todos'));
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('持久化测试');
    expect(stored[0].dueAt).toBe('2026-07-30T10:00');
  });

  test('从 localStorage 读取已有数据', async () => {
    localStorage.setItem('todos', JSON.stringify([
      { id: '1', text: '已有任务', completed: false, category: null, createdAt: Date.now(), dueAt: null, location: null },
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    // loadedPromise resolve 后 React 还需要一个 tick 来提交 state 更新
    await waitFor(() => expect(result.current.todos).toHaveLength(1));
    expect(result.current.todos[0].text).toBe('已有任务');
  });

  test('localStorage 存储损坏 JSON 时不崩溃', async () => {
    localStorage.setItem('todos', '{bad json!!!');

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    await waitFor(() => expect(result.current.todos).toEqual([]));
  });

  test('添加空字符串任务不创建条目', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: '' });
    });

    expect(result.current.todos).toHaveLength(0);
  });

  test('自动清理完成超过 30 天的任务', async () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem('todos', JSON.stringify([
      { id: '1', text: '旧任务', completed: true, completedAt: thirtyOneDaysAgo, category: null, createdAt: Date.now(), dueAt: null, location: null },
      { id: '2', text: '新任务', completed: false, completedAt: null, category: null, createdAt: Date.now(), dueAt: null, location: null },
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    // 完成超过 30 天的任务被自动清理
    await waitFor(() => expect(result.current.todos).toHaveLength(1));
    expect(result.current.todos[0].text).toBe('新任务');
  });

  test('不清理完成未满 30 天的任务', async () => {
    const twentyNineDaysAgo = Date.now() - 29 * 24 * 60 * 60 * 1000;
    localStorage.setItem('todos', JSON.stringify([
      { id: '1', text: '近期已完成', completed: true, completedAt: twentyNineDaysAgo, category: null, createdAt: Date.now(), dueAt: null, location: null },
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    await waitFor(() => expect(result.current.todos).toHaveLength(1));
  });

  test('无 completedAt 的旧数据不被自动清理', async () => {
    localStorage.setItem('todos', JSON.stringify([
      { id: '1', text: '旧格式任务', completed: true, category: null, createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000, dueAt: null, location: null },
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    // 无 completedAt 的旧数据保持兼容，不清理
    await waitFor(() => expect(result.current.todos).toHaveLength(1));
  });

  test('清除所有已完成任务并返回被清除的任务', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: '进行中' });
      result.current.addTodo({ text: '已完成1' });
      result.current.addTodo({ text: '已完成2' });
    });

    // todos 顺序: [已完成2, 已完成1, 进行中]
    act(() => {
      result.current.toggleTodo(result.current.todos[0].id); // 已完成2 → completed
      result.current.toggleTodo(result.current.todos[1].id); // 已完成1 → completed
    });

    let removed;
    act(() => {
      removed = result.current.clearCompleted();
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('进行中');
    expect(removed).toHaveLength(2);
  });

  test('撤销清除：restoreTodos 恢复被清除的任务', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: '进行中' });
      result.current.addTodo({ text: '已完成' });
    });

    // todos 顺序: [已完成, 进行中]
    act(() => {
      result.current.toggleTodo(result.current.todos[0].id); // 已完成 → completed
    });

    let removed;
    act(() => {
      removed = result.current.clearCompleted();
    });

    expect(result.current.todos).toHaveLength(1);

    act(() => {
      result.current.restoreTodos(removed);
    });

    expect(result.current.todos).toHaveLength(2);
  });

  // ---------- 自动顺延（rollover） ----------

  // 构造最小种子任务对象
  function seedTodo(overrides = {}) {
    return {
      id: 'seed-1',
      text: '种子任务',
      completed: false,
      completedAt: null,
      category: null,
      createdAt: Date.now(),
      dueAt: null,
      location: null,
      ...overrides,
    };
  }

  test('加载时顺延过期未完成的任务到今天，其余不动', async () => {
    localStorage.setItem('todos', JSON.stringify([
      seedTodo({ id: 'overdue', text: '过期任务', dueAt: '2020-08-06T09:00' }),
      seedTodo({ id: 'today', text: '今日任务', dueAt: `${todayKey()}T12:00` }),
      seedTodo({ id: 'done', text: '已完成过期', completed: true, completedAt: Date.now(), dueAt: '2020-08-06T09:00' }),
      seedTodo({ id: 'noDate', text: '无日期', dueAt: null }),
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;
    await waitFor(() => expect(result.current.todos).toHaveLength(4));

    // 过期未完成 → 日期变今天、时间保留
    const overdue = result.current.todos.find((t) => t.id === 'overdue');
    expect(overdue.dueAt).toBe(`${todayKey()}T09:00`);

    // 其余任务 unchanged（值未变）
    const today = result.current.todos.find((t) => t.id === 'today');
    const done = result.current.todos.find((t) => t.id === 'done');
    const noDate = result.current.todos.find((t) => t.id === 'noDate');
    expect(today.dueAt).toBe(`${todayKey()}T12:00`);
    expect(done.dueAt).toBe('2020-08-06T09:00'); // 已完成不顺延
    expect(noDate.dueAt).toBeNull();

    // 顺延计数 1（toast 依据）
    expect(result.current.lastRolloverCount).toBe(1);
  });

  test('无过期任务时 lastRolloverCount 为 0', async () => {
    localStorage.setItem('todos', JSON.stringify([
      seedTodo({ id: 'today', dueAt: `${todayKey()}T12:00` }),
      seedTodo({ id: 'noDate', dueAt: null }),
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;
    await waitFor(() => expect(result.current.todos).toHaveLength(2));

    expect(result.current.lastRolloverCount).toBe(0);
  });

  test('幂等：再次 rolloverOverdueTodos 返回 0 且状态不变', async () => {
    localStorage.setItem('todos', JSON.stringify([
      seedTodo({ id: 'overdue', dueAt: '2020-08-06T09:00' }),
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;
    await waitFor(() => expect(result.current.todos).toHaveLength(1));
    expect(result.current.lastRolloverCount).toBe(1);

    let count;
    act(() => {
      count = result.current.rolloverOverdueTodos();
    });
    expect(count).toBe(0);
    expect(result.current.todos[0].dueAt).toBe(`${todayKey()}T09:00`);
  });

  test('手动触发顺延并同步写入 localStorage', async () => {
    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    act(() => {
      result.current.addTodo({ text: '手动顺延', dueAt: '2020-08-06T15:30' });
    });

    let count;
    act(() => {
      count = result.current.rolloverOverdueTodos();
    });
    expect(count).toBe(1);
    expect(result.current.todos[0].dueAt).toBe(`${todayKey()}T15:30`);

    // 等待异步保存完成，localStorage 也应同步更新
    await new Promise((r) => setTimeout(r, 50));
    const stored = JSON.parse(localStorage.getItem('todos'));
    expect(stored[0].dueAt).toBe(`${todayKey()}T15:30`);
  });

  test('resyncFromNative 时顺延过期任务并更新计数', async () => {
    // 先正常加载（无种子），再写入过期种子后 resync 模拟原生端数据变化
    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;

    localStorage.setItem('todos', JSON.stringify([
      seedTodo({ id: 'overdue', dueAt: '2020-08-06T09:00' }),
    ]));

    await act(async () => {
      await result.current.resyncFromNative();
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].dueAt).toBe(`${todayKey()}T09:00`);
    expect(result.current.lastRolloverCount).toBe(1);
  });

  test('已完成过期任务 seed 不顺延，计数为 0', async () => {
    localStorage.setItem('todos', JSON.stringify([
      seedTodo({ id: 'done', completed: true, completedAt: Date.now(), dueAt: '2020-08-06T09:00' }),
    ]));

    const { result } = renderHook(() => useTodos());
    await result.current.loadedPromise;
    await waitFor(() => expect(result.current.todos).toHaveLength(1));

    expect(result.current.todos[0].dueAt).toBe('2020-08-06T09:00');
    expect(result.current.lastRolloverCount).toBe(0);
  });
});
