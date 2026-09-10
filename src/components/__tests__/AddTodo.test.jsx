import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import AddTodo from '../AddTodo';

describe('AddTodo', () => {
  test('输入文字后按回车调用 onAdd', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const input = screen.getByPlaceholderText(/添加新任务/);
    fireEvent.change(input, { target: { value: '买牛奶' } });
    fireEvent.submit(input.closest('form'));

    expect(onAdd).toHaveBeenCalledWith({
      text: '买牛奶',
      dueAt: null,
      location: null,
      isRoutine: false,
      isTimed: false,
      hasReminder: false,
    });
  });

  test('空输入不调用 onAdd', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const input = screen.getByPlaceholderText(/添加新任务/);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form'));

    expect(onAdd).not.toHaveBeenCalled();
  });

  test('选择日期后提交带时间', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const textInput = screen.getByPlaceholderText(/添加新任务/);
    // DateButton 内部的 datetime-local input
    const datetimeInput = document.querySelector('input[type="datetime-local"]');

    fireEvent.change(textInput, { target: { value: '开会' } });
    fireEvent.change(datetimeInput, { target: { value: '2026-07-30T15:00' } });
    fireEvent.submit(textInput.closest('form'));

    expect(onAdd).toHaveBeenCalledWith({
      text: '开会',
      dueAt: '2026-07-30T15:00',
      location: null,
      isRoutine: false,
      isTimed: false,
      hasReminder: false,
    });
  });

  test('填写地点后提交带地点', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const textInput = screen.getByPlaceholderText(/添加新任务/);

    // 点击"地点"按钮显示地点输入框
    fireEvent.click(screen.getByText('地点'));
    const locationInput = screen.getByPlaceholderText(/输入地点/);

    fireEvent.change(textInput, { target: { value: '开会' } });
    fireEvent.change(locationInput, { target: { value: '公司会议室' } });
    fireEvent.submit(textInput.closest('form'));

    expect(onAdd).toHaveBeenCalledWith({
      text: '开会',
      dueAt: null,
      location: '公司会议室',
      isRoutine: false,
      isTimed: false,
      hasReminder: false,
    });
  });

  test('点击每日按钮后提交带 isRoutine: true 且 isTimed: false', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const textInput = screen.getByPlaceholderText(/添加新任务/);
    const routineBtn = screen.getByRole('button', { name: /每日/ });

    fireEvent.click(routineBtn);
    fireEvent.change(textInput, { target: { value: '吃钙片' } });
    fireEvent.submit(textInput.closest('form'));

    expect(onAdd).toHaveBeenCalledWith({
      text: '吃钙片',
      dueAt: null,
      location: null,
      isRoutine: true,
      isTimed: false,
      hasReminder: false,
    });
  });

  test('点击时限按钮后提交带 isTimed: true, hasReminder: true 且与每日互斥', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const routineBtn = screen.getByRole('button', { name: /每日/ });
    const timedBtn = screen.getByRole('button', { name: /阶段时限/ });

    // 先点击每日，再点击时限，验证互斥
    fireEvent.click(routineBtn);
    expect(routineBtn.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(timedBtn);
    expect(timedBtn.getAttribute('aria-pressed')).toBe('true');
    expect(routineBtn.getAttribute('aria-pressed')).toBe('false');

    const textInput = screen.getByPlaceholderText(/添加阶段时限任务/);
    fireEvent.change(textInput, { target: { value: '完成毕业论文' } });
    fireEvent.submit(textInput.closest('form'));

    expect(onAdd).toHaveBeenCalledWith({
      text: '完成毕业论文',
      dueAt: null,
      location: null,
      isRoutine: false,
      isTimed: true,
      hasReminder: true,
    });
  });

  test('激活时限时可点击切换关闭提醒', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const timedBtn = screen.getByRole('button', { name: /阶段时限/ });
    fireEvent.click(timedBtn);

    const reminderBtn = screen.getByRole('button', { name: /提前3天提醒/ });
    expect(reminderBtn.getAttribute('aria-pressed')).toBe('true');

    // 点击关闭提醒
    fireEvent.click(reminderBtn);
    expect(reminderBtn.getAttribute('aria-pressed')).toBe('false');

    const textInput = screen.getByPlaceholderText(/添加阶段时限任务/);
    fireEvent.change(textInput, { target: { value: '完成大作业' } });
    fireEvent.submit(textInput.closest('form'));

    expect(onAdd).toHaveBeenCalledWith({
      text: '完成大作业',
      dueAt: null,
      location: null,
      isRoutine: false,
      isTimed: true,
      hasReminder: false,
    });
  });

  test('提交后所有输入框、每日状态与时限状态重置清空', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const timedBtn = screen.getByRole('button', { name: /阶段时限/ });
    fireEvent.click(timedBtn);

    const textInput = screen.getByPlaceholderText(/添加阶段时限任务/);
    fireEvent.change(textInput, { target: { value: '买牛奶' } });
    fireEvent.submit(textInput.closest('form'));

    expect(textInput.value).toBe('');
    expect(timedBtn.getAttribute('aria-pressed')).toBe('false');
  });
});
