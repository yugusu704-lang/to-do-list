import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * 将字符串 ID（如 UUID）哈希为正 32 位整型，满足 Capacitor LocalNotifications ID 规范
 * @param {string} str
 * @returns {number}
 */
export function hashStringToId(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * 计算提醒触发时间：
 * 1. 距离截止 >= 3 天：提前第 3 天早晨 09:00 准时提醒
 * 2. 距离截止 < 3 天但截止仍在未来：次日早晨 09:00 补推一次（若次日 09:00 仍在截止前）
 * 3. 已经超期或不足以在次日早晨前触发：返回 null
 * 
 * @param {string|Date} dueAt
 * @param {Date} [now=new Date()]
 * @returns {Date|null}
 */
export function calculateReminderTime(dueAt, now = new Date()) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (isNaN(due.getTime())) return null;

  // 如果已经超时，不安排提醒
  if (due.getTime() <= now.getTime()) {
    return null;
  }

  // 正常策略：提前 3 天的早晨 09:00
  const threeDaysBeforeMorning = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate() - 3,
    9,
    0,
    0,
    0
  );

  // 如果提前 3 天的 09:00 还在当前时间之后，则在此时推送
  if (threeDaysBeforeMorning.getTime() > now.getTime()) {
    return threeDaysBeforeMorning;
  }

  // 边缘情况：创建时已不足 3 天（或错过了 3 天前 09:00）
  // 补推策略：在次日早晨 09:00 补推一次
  const nextMorning = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    9,
    0,
    0,
    0
  );

  // 必须确保次日 09:00 仍在截止时间之前（若任务在今晚或明早 8点截止，则不安排）
  if (nextMorning.getTime() < due.getTime()) {
    return nextMorning;
  }

  return null;
}

/**
 * 确保 Android 通知渠道已创建（仅 Android 原生环境有效）
 */
export async function ensureNotificationChannel() {
  try {
    if (typeof LocalNotifications.createChannel === 'function') {
      await LocalNotifications.createChannel({
        id: 'todo_deadline_channel',
        name: '时限任务提醒',
        description: '阶段时限任务临近截止提醒通知',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        vibration: true,
      });
    }
  } catch (e) {
    // 忽略非原生或不支持环境的异常
  }
}

/**
 * 为指定时限任务调度本地提醒通知
 * @param {Object} todo
 * @param {Date} [now=new Date()]
 * @returns {Promise<{id: number, at: Date}|null>}
 */
export async function scheduleTodoReminder(todo, now = new Date()) {
  if (!todo || !todo.id || !todo.isTimed || !todo.hasReminder || !todo.dueAt || todo.completed) {
    return null;
  }

  const reminderAt = calculateReminderTime(todo.dueAt, now);
  if (!reminderAt) {
    return null;
  }

  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== 'granted') {
      return null;
    }

    await ensureNotificationChannel();

    // 先取消旧的以防重复
    await cancelTodoReminder(todo.id);

    const id = hashStringToId(todo.id);
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: '时限任务即将截止',
          body: `「${todo.text}」距离截止还剩 3 天，请及时处理`,
          schedule: { at: reminderAt },
          extra: { todoId: todo.id },
          channelId: 'todo_deadline_channel',
        },
      ],
    });

    return { id, at: reminderAt };
  } catch (e) {
    // Web 环境或环境不可用时静默处理
    return null;
  }
}

/**
 * 取消指定任务的提醒通知
 * @param {string} todoId
 * @returns {Promise<void>}
 */
export async function cancelTodoReminder(todoId) {
  if (!todoId) return;
  try {
    const id = hashStringToId(todoId);
    await LocalNotifications.cancel({
      notifications: [{ id }],
    });
  } catch (e) {
    // 静默处理
  }
}

/**
 * 监听用户点击通知的落地动作
 * @param {(todoId: string) => void} onNotificationClick
 * @returns {Promise<() => void>} 取消监听函数
 */
export async function initNotificationListeners(onNotificationClick) {
  try {
    const handle = await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        const todoId = action.notification?.extra?.todoId;
        if (todoId && typeof onNotificationClick === 'function') {
          onNotificationClick(todoId);
        }
      }
    );
    return () => {
      try {
        handle?.remove();
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}
