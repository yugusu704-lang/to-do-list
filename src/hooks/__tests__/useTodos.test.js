import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import useTodos from '../useTodos';

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
});
