import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import DailyRoutineSection from '../DailyRoutineSection';

const sampleRoutines = [
  {
    id: 'r1',
    text: '吃钙片',
    completed: false,
    isRoutine: true,
    dueAt: '2026-09-01T08:00',
    location: null,
  },
  {
    id: 'r2',
    text: '喝温水',
    completed: true,
    isRoutine: true,
    dueAt: null,
    location: null,
  },
];

describe('DailyRoutineSection', () => {
  test('当无每日习惯时，返回 null（优雅空态，不占位）', () => {
    const { container } = render(
      <DailyRoutineSection
        routines={[]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('渲染每日必做专区标题与进度状态', () => {
    render(
      <DailyRoutineSection
        routines={sampleRoutines}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('每日必做')).toBeInTheDocument();
    expect(screen.getByText('1/2 完成')).toBeInTheDocument();
    expect(screen.getByText('吃钙片')).toBeInTheDocument();
    expect(screen.getByText('喝温水')).toBeInTheDocument();
  });

  test('全完成时显示积极反馈徽标', () => {
    const allDone = sampleRoutines.map((r) => ({ ...r, completed: true }));
    render(
      <DailyRoutineSection
        routines={allDone}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/今日已达成/)).toBeInTheDocument();
  });

  test('支持打卡切换 onToggle', () => {
    const onToggle = vi.fn();
    render(
      <DailyRoutineSection
        routines={sampleRoutines}
        onToggle={onToggle}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    const toggleBtns = screen.getAllByRole('button', { name: /切换完成状态/ });
    fireEvent.click(toggleBtns[0]);
    expect(onToggle).toHaveBeenCalledWith('r1');
  });
});
