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

  test('填写时间和地点后提交', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const textInput = screen.getByPlaceholderText(/添加新任务/);
    const datetimeInput = document.querySelector('input[type="datetime-local"]');
    const locationInput = screen.getByPlaceholderText(/地点/);

    fireEvent.change(textInput, { target: { value: '开会' } });
    fireEvent.change(datetimeInput, { target: { value: '2026-07-30T15:00' } });
    fireEvent.change(locationInput, { target: { value: '公司会议室' } });
    fireEvent.submit(textInput.closest('form'));

    expect(onAdd).toHaveBeenCalledWith({
      text: '开会',
      dueAt: '2026-07-30T15:00',
      location: '公司会议室',
    });
  });

  test('提交后所有输入框清空', () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);

    const textInput = screen.getByPlaceholderText(/添加新任务/);
    fireEvent.change(textInput, { target: { value: '买牛奶' } });
    fireEvent.submit(textInput.closest('form'));

    expect(textInput.value).toBe('');
  });
});
