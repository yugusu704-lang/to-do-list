import TodoItem from './TodoItem';
import EmptyState from './EmptyState';

// 从 dueAt (ISO datetime) 提取日期分组标签
function getDateLabel(dueAt) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (isNaN(due.getTime())) return null;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const diffDays = Math.floor((dueMidnight - todayMidnight) / 86400000);

  if (diffDays < 0) return '已过期';
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  // 超过 2 天显示具体日期
  return `${due.getMonth() + 1}月${due.getDate()}日`;
}

// 按日期分组，无日期排最后
function groupByDueDate(todos) {
  const groups = {};
  const noDate = [];

  todos.forEach((todo) => {
    const label = getDateLabel(todo.dueAt);
    if (label) {
      if (!groups[label]) groups[label] = [];
      groups[label].push(todo);
    } else {
      noDate.push(todo);
    }
  });

  // 排序：已过期 → 今天 → 明天 → 后天 → 更远日期 → 无日期
  const order = ['已过期', '今天', '明天', '后天'];
  const sorted = {};
  order.forEach((k) => {
    if (groups[k]) sorted[k] = groups[k];
  });
  // 按日期排序剩余分组
  const remaining = Object.entries(groups)
    .filter(([k]) => !order.includes(k))
    .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'));
  remaining.forEach(([k, v]) => {
    sorted[k] = v;
  });
  if (noDate.length > 0) {
    sorted['无日期'] = noDate;
  }

  return sorted;
}

// 任务列表组件（含日期分组）
export default function TodoList({ todos, filter, onToggle, onDelete }) {
  const filtered =
    filter === 'active'
      ? todos.filter((t) => !t.completed)
      : filter === 'completed'
        ? todos.filter((t) => t.completed)
        : todos;

  if (filtered.length === 0) {
    return <EmptyState filter={filter} />;
  }

  const groups = groupByDueDate(filtered);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
      {Object.entries(groups).map(([date, items]) => (
        <div key={date} className="flex flex-col gap-2">
          <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {date}
          </div>
          <div className="flex flex-col gap-2">
            {items.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
