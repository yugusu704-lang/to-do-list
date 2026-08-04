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

// 顺延：dueAt 存在 + 未完成 + 日期早于今天 → 日期改为今天，时间保留
// 返回 { todos, rolledCount }；无顺延时返回原 todos 引用（供调用方跳过 setState）
export function rolloverOverdue(todos, now = new Date()) {
  const todayKey = getLocalDateKey(now);
  let rolledCount = 0;
  const next = todos.map((todo) => {
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
