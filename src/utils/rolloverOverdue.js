// 本地日期键 YYYY-MM-DD（与 TodoList.jsx 的 toDateKey 逻辑一致）
export function getLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 将 dueAt 的日期部分改为 todayKey，保留原 HH:mm 时间；格式异常返回 null
function shiftDueAtToToday(dueAt, todayKey) {
  const tIndex = dueAt.indexOf('T');
  if (tIndex !== 10) return null; // 防御非 'YYYY-MM-DDTHH:mm'
  return `${todayKey}${dueAt.slice(tIndex)}`;
}

// 顺延与日常习惯跨天处理：
// 1. 日常习惯（isRoutine）：
//    - 若已完成，但完成日期早于今天（lastCompletedDate < todayKey），重置为未完成态迎新一天
//    - 若有 dueAt 且日期早于今天，更新 dueAt 日期为今天（保留时间）
// 2. 普通任务（!isRoutine）：
//    - dueAt 存在 + 未完成 + 日期早于今天 → 日期改为今天，时间保留
// 返回 { todos, rolledCount }；无变动时返回原 todos 引用（供调用方跳过 setState）
export function rolloverOverdue(todos, now = new Date()) {
  const todayKey = getLocalDateKey(now);
  let rolledCount = 0;
  const next = todos.map((todo) => {
    // 针对日常习惯 (isRoutine)
    if (todo.isRoutine) {
      let changed = false;
      let updatedTodo = todo;

      // 跨天重置：昨天或更早完成的习惯，今天重置为未完成
      if (todo.completed && (!todo.lastCompletedDate || todo.lastCompletedDate < todayKey)) {
        updatedTodo = {
          ...updatedTodo,
          completed: false,
          completedAt: null,
        };
        changed = true;
      }

      // 未完成或已重置的习惯，若设定了 dueAt 且日期早于今天，平滑更新为今天
      if (updatedTodo.dueAt) {
        const due = new Date(updatedTodo.dueAt);
        if (!isNaN(due.getTime()) && getLocalDateKey(due) < todayKey) {
          const shifted = shiftDueAtToToday(updatedTodo.dueAt, todayKey);
          if (shifted) {
            updatedTodo = { ...updatedTodo, dueAt: shifted };
            changed = true;
          }
        }
      }

      if (changed) {
        rolledCount += 1;
        return updatedTodo;
      }
      return todo;
    }

    // 针对普通待办任务
    if (todo.completed || !todo.dueAt) return todo;
    const due = new Date(todo.dueAt);
    if (isNaN(due.getTime())) return todo;
    if (getLocalDateKey(due) >= todayKey) return todo;
    const shifted = shiftDueAtToToday(todo.dueAt, todayKey);
    if (!shifted) return todo;
    rolledCount += 1;
    return { ...todo, dueAt: shifted };
  });
  return rolledCount > 0 ? { todos: next, rolledCount } : { todos, rolledCount: 0 };
}
