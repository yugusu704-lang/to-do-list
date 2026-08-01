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

// 本地日期键 YYYY-MM-DD（字符串字典序 = 日期升序）
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 组内排序：按 dueAt 时间升序（时间更早的靠上）
function sortByDueTime(a, b) {
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
}

// 按日期键分组：无日期排最前，其余按日期键升序（字典序即日期升序，跨月/同月均正确）
function groupByDueDate(todos) {
  const groups = new Map(); // 日期键 -> { label, items }
  const noDate = [];

  todos.forEach((todo) => {
    const due = todo.dueAt ? new Date(todo.dueAt) : null;
    if (!due || isNaN(due.getTime())) {
      noDate.push(todo);
      return;
    }
    const dateKey = toDateKey(due);
    if (!groups.has(dateKey)) {
      groups.set(dateKey, { label: getDateLabel(due), items: [] });
    }
    groups.get(dateKey).items.push(todo);
  });

  // 组内按时间升序；无日期组保持原顺序（新添加的在前）
  groups.forEach((g) => g.items.sort(sortByDueTime));

  // 日期键升序 → 已过期/今天/明天/后天/未来日期按时间自然排列
  const dateSorted = [...groups.entries()].sort(([ka], [kb]) => ka.localeCompare(kb));

  // 同一标签只保留一个分组头，后续同标签桶按顺序拼接（合并多个"已过期"日期）
  const sorted = {};
  dateSorted.forEach(([, g]) => {
    if (!sorted[g.label]) sorted[g.label] = [];
    sorted[g.label].push(...g.items);
  });

  // 无日期任务固定在列表最顶部（仅当存在无日期任务时）
  if (noDate.length > 0) {
    return { '无日期': noDate, ...sorted };
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
    <div className="flex flex-1 flex-col gap-4 px-4 py-3">
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
