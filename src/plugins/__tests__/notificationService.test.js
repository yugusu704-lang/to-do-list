import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateReminderTime,
  hashStringToId,
  scheduleTodoReminder,
  cancelTodoReminder,
  initNotificationListeners,
  scheduleDevTestReminder,
  ensureNotificationChannel,
  NOTIFICATION_CHANNEL_ID,
} from '../notificationService';
import { LocalNotifications } from '@capacitor/local-notifications';

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    schedule: vi.fn(),
    cancel: vi.fn(),
    addListener: vi.fn(),
    createChannel: vi.fn(),
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashStringToId', () => {
    it('generates a positive 32-bit integer for a given string id', () => {
      const id1 = hashStringToId('todo-abc-123');
      const id2 = hashStringToId('todo-abc-123');
      const id3 = hashStringToId('todo-xyz-999');

      expect(typeof id1).toBe('number');
      expect(Number.isInteger(id1)).toBe(true);
      expect(id1).toBeGreaterThanOrEqual(0);
      expect(id1).toBe(id2); // consistent
      expect(id1).not.toBe(id3);
    });
  });

  describe('calculateReminderTime', () => {
    it('returns null if dueAt is null, empty, or invalid', () => {
      expect(calculateReminderTime(null)).toBeNull();
      expect(calculateReminderTime('')).toBeNull();
      expect(calculateReminderTime('invalid-date')).toBeNull();
    });

    it('calculates 3 days before deadline at 09:00 AM when dueAt is >= 3 days away', () => {
      // Current: 2026-09-10 10:00:00
      const now = new Date(2026, 8, 10, 10, 0, 0);
      // Deadline: 2026-09-18 16:30:00 (8 days later)
      const dueAt = '2026-09-18T16:30:00';

      const reminder = calculateReminderTime(dueAt, now);
      expect(reminder).toBeInstanceOf(Date);
      expect(reminder.getFullYear()).toBe(2026);
      expect(reminder.getMonth()).toBe(8); // September (0-indexed 8)
      expect(reminder.getDate()).toBe(15); // 18 - 3 = 15
      expect(reminder.getHours()).toBe(9);
      expect(reminder.getMinutes()).toBe(0);
      expect(reminder.getSeconds()).toBe(0);
    });

    it('schedules next morning at 09:00 AM when created < 3 days before deadline and deadline is after tomorrow 09:00', () => {
      // Current: 2026-09-10 14:00:00
      const now = new Date(2026, 8, 10, 14, 0, 0);
      // Deadline: 2026-09-12 18:00:00 (2 days later, < 3 days)
      const dueAt = '2026-09-12T18:00:00';

      const reminder = calculateReminderTime(dueAt, now);
      expect(reminder).toBeInstanceOf(Date);
      // Next day: 2026-09-11 09:00:00
      expect(reminder.getFullYear()).toBe(2026);
      expect(reminder.getMonth()).toBe(8);
      expect(reminder.getDate()).toBe(11);
      expect(reminder.getHours()).toBe(9);
      expect(reminder.getMinutes()).toBe(0);
    });

    it('returns null if deadline is already past', () => {
      const now = new Date(2026, 8, 10, 14, 0, 0);
      const dueAt = '2026-09-09T18:00:00'; // Yesterday

      expect(calculateReminderTime(dueAt, now)).toBeNull();
    });

    it('returns null if task is due before next morning 09:00 (e.g. tonight)', () => {
      const now = new Date(2026, 8, 10, 14, 0, 0);
      const dueAt = '2026-09-10T23:00:00'; // Tonight

      expect(calculateReminderTime(dueAt, now)).toBeNull();
    });
  });

  describe('scheduleTodoReminder', () => {
    it('returns null and does not schedule if task is not timed or does not have reminder', async () => {
      const todo = {
        id: 'todo-1',
        text: 'Ordinary task',
        isTimed: false,
        hasReminder: false,
        dueAt: '2026-09-20T10:00',
      };
      const res = await scheduleTodoReminder(todo);
      expect(res).toBeNull();
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('returns null if reminder is disabled (hasReminder: false)', async () => {
      const todo = {
        id: 'todo-1',
        text: 'Timed without reminder',
        isTimed: true,
        hasReminder: false,
        dueAt: '2026-09-20T10:00',
      };
      const res = await scheduleTodoReminder(todo);
      expect(res).toBeNull();
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('returns null if task is already completed', async () => {
      const todo = {
        id: 'todo-1',
        text: 'Completed task',
        isTimed: true,
        hasReminder: true,
        completed: true,
        dueAt: '2026-09-20T10:00',
      };
      const res = await scheduleTodoReminder(todo);
      expect(res).toBeNull();
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('requests permission and schedules notification when conditions are met', async () => {
      LocalNotifications.checkPermissions.mockResolvedValue({ display: 'prompt' });
      LocalNotifications.requestPermissions.mockResolvedValue({ display: 'granted' });
      LocalNotifications.cancel.mockResolvedValue({});
      LocalNotifications.schedule.mockResolvedValue({});

      const now = new Date(2026, 8, 10, 10, 0, 0);
      const todo = {
        id: 'todo-timed-123',
        text: '期末论文提交',
        isTimed: true,
        hasReminder: true,
        completed: false,
        dueAt: '2026-09-18T16:00:00',
      };

      const res = await scheduleTodoReminder(todo, now);

      expect(LocalNotifications.checkPermissions).toHaveBeenCalled();
      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
      expect(LocalNotifications.cancel).toHaveBeenCalled();
      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: hashStringToId('todo-timed-123'),
            title: '时限任务即将截止',
            body: expect.stringContaining('期末论文提交'),
            extra: { todoId: 'todo-timed-123' },
            channelId: NOTIFICATION_CHANNEL_ID,
            foreground: true,
          }),
        ],
      });
      expect(res).not.toBeNull();
      expect(res.id).toBe(hashStringToId('todo-timed-123'));
    });

    it('does not schedule if permission is denied', async () => {
      LocalNotifications.checkPermissions.mockResolvedValue({ display: 'denied' });
      LocalNotifications.requestPermissions.mockResolvedValue({ display: 'denied' });

      const todo = {
        id: 'todo-timed-123',
        text: '期末论文提交',
        isTimed: true,
        hasReminder: true,
        completed: false,
        dueAt: '2026-09-18T16:00:00',
      };

      const res = await scheduleTodoReminder(todo);
      expect(res).toBeNull();
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });

  describe('cancelTodoReminder', () => {
    it('cancels notification with hashed id', async () => {
      LocalNotifications.cancel.mockResolvedValue({});
      await cancelTodoReminder('todo-999');

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: hashStringToId('todo-999') }],
      });
    });
  });

  describe('initNotificationListeners', () => {
    it('registers listener and triggers callback when action performed with extra.todoId', async () => {
      let listenerCallback;
      LocalNotifications.addListener.mockImplementation((eventName, cb) => {
        if (eventName === 'localNotificationActionPerformed') {
          listenerCallback = cb;
        }
        return Promise.resolve({ remove: vi.fn() });
      });

      const onNotificationClick = vi.fn();
      const unsub = await initNotificationListeners(onNotificationClick);

      expect(LocalNotifications.addListener).toHaveBeenCalledWith(
        'localNotificationActionPerformed',
        expect.any(Function)
      );

      // Simulate notification click
      listenerCallback({
        notification: {
          extra: { todoId: 'todo-clicked-1' },
        },
      });

      expect(onNotificationClick).toHaveBeenCalledWith('todo-clicked-1');

      if (typeof unsub === 'function') {
        unsub();
      }
    });
  });

  describe('ensureNotificationChannel', () => {
    it('creates notification channel with importance 5 and vibration enabled', async () => {
      LocalNotifications.createChannel.mockResolvedValue();
      await ensureNotificationChannel();

      expect(LocalNotifications.createChannel).toHaveBeenCalledWith({
        id: NOTIFICATION_CHANNEL_ID,
        name: '时限任务提醒',
        description: expect.stringContaining('悬浮横幅弹窗'),
        importance: 5,
        visibility: 1,
        vibration: true,
      });
    });
  });

  describe('scheduleDevTestReminder', () => {
    it('schedules a test notification 5 seconds in the future with channelId and foreground', async () => {
      LocalNotifications.checkPermissions.mockResolvedValue({ display: 'granted' });
      LocalNotifications.schedule.mockResolvedValue();

      const res = await scheduleDevTestReminder({ id: 'test-1', text: 'Test' });
      expect(res.success).toBe(true);
      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: hashStringToId('test-1'),
            channelId: NOTIFICATION_CHANNEL_ID,
            foreground: true,
          }),
        ],
      });
    });

    it('returns error when permission is not granted', async () => {
      LocalNotifications.checkPermissions.mockResolvedValue({ display: 'denied' });
      LocalNotifications.requestPermissions.mockResolvedValue({ display: 'denied' });

      const res = await scheduleDevTestReminder({ id: 'test-2', text: 'Test 2' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('未授予通知权限');
    });
  });
});
