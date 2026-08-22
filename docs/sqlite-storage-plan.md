# SQLite 高容量本地数据存储升级计划

**Goal:** 将 App 底层数据持久化从 SharedPreferences 纯 JSON 字符串升级为 Android 原生 SQLite 关系型数据库，提供高容量存储、毫秒级索引检索、小组件原生直查与存量数据自动平滑迁移。
**Architecture:** 原生端由 `TodoDbHelper` 统一管理 SQLite 数据库与事务；`TodoStoragePlugin` 封装 CRUD 接口暴露给 React 前端；桌面小组件（`TodoWidgetProvider` & `TodoWidgetViewsFactory`）通过原生 SQL 索引直查今日待办；Web 开发端提供健壮的 localStorage 降级保证独立调试与 TDD 测试。
**Tech Stack:** Android SQLite (SQLiteOpenHelper + Transactions), Java, Capacitor 8 Bridge, React 19, Vitest.

---

## 数据库表设计 (Schema)

```sql
CREATE TABLE todos (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    due_at TEXT,
    location TEXT,
    category TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    deleted_at INTEGER
);

-- 核心复合索引：加速小组件和 App 今日/活跃任务秒级查询
CREATE INDEX idx_todos_active_due ON todos (completed, due_at, deleted_at);
CREATE INDEX idx_todos_created ON todos (created_at DESC);
```

---

## 任务清单

### Task 1: 建立 Android 原生 SQLite 数据库助手类 (`TodoDbHelper`)

**Objective:** 创建 `TodoDbHelper` 单例类，实现表结构初始化、索引创建、CRUD 操作、事务批量写入，以及自动从 SharedPreferences 迁移历史存量数据的逻辑。

**Files:**
- Create: `android/app/src/main/java/com/example/todolist/db/TodoDbHelper.java`

**Steps:**
1. 编写 `TodoDbHelper`，继承 `SQLiteOpenHelper`，定义 DB 名称 `todos.db`，版本号 `1`。
2. 在 `onCreate` 中执行建表与创建 `idx_todos_active_due`、`idx_todos_created` 索引 SQL。
3. 实现 `checkAndMigrateFromSharedPrefs(Context context)` 方法：若 DB 为空且 `todo_prefs.xml` 存在 `todos_json`，使用事务批量插入 SQLite 并记录日志。
4. 实现基础操作方法：
   - `getAllActiveTodos()`: 查询所有未被软删除的任务，按日期/创建时间排序返回 JSONArray / List。
   - `getTodayActiveTodos(long startOfDay, long endOfDay)`: 供小组件使用的极速 SQL 查询。
   - `insertOrUpdateTodos(JSONArray todos)`: 事务批量写入。
   - `setTodoCompleted(String id, boolean completed, long completedAt)`: 单条状态切换。
   - `softDeleteTodo(String id, long deletedAt)` / `hardDeleteTodo(String id)`: 删除任务。

---

### Task 2: 升级 Capacitor 存储插件 (`TodoStoragePlugin`)

**Objective:** 修改 `TodoStoragePlugin.java`，将原有的 `SharedPreferences` 读写全面切换为调用 `TodoDbHelper`，对外保持与前端通信协议一致并提供更高性能的批量读写与数据操作。

**Files:**
- Modify: `android/app/src/main/java/com/example/todolist/TodoStoragePlugin.java`

**Steps:**
1. 在 `TodoStoragePlugin` 初始化时调用 `TodoDbHelper.getInstance(getContext()).checkAndMigrateFromSharedPrefs(getContext())`。
2. 修改 `load(PluginCall call)`：从 `TodoDbHelper` 读取有效任务 JSON 列表并返回。
3. 修改 `save(PluginCall call)`：调用 `TodoDbHelper.insertOrUpdateTodos` 在事务中写入 SQLite，写入完成后触发 `TodoWidgetProvider.refreshAllWidgets(getContext())`。
4. 保留 `getAndClearFocusAdd()` 与 `setFocusAdd()` 逻辑。

---

### Task 3: 优化桌面小组件与工厂查询 (`TodoWidgetProvider` & `TodoWidgetViewsFactory`)

**Objective:** 让桌面小组件（4×2 和 4×3）直接使用 `TodoDbHelper` 的原生 SQL 索引查询，彻底摆脱旧方案中繁重的 JSON 字符串反序列化。

**Files:**
- Modify: `android/app/src/main/java/com/example/todolist/widget/TodoWidgetProvider.java`
- Modify: `android/app/src/main/java/com/example/todolist/widget/TodoWidgetViewsFactory.java`

**Steps:**
1. 修改 `TodoWidgetProvider.loadTodayTodos(Context)`：直接调用 `TodoDbHelper.getInstance(context).getTodayActiveTodos(...)`。
2. 修改 `TodoWidgetViewsFactory.loadTodayTodos()`：同样复用 `TodoDbHelper` 的直查方法。
3. 修改 `markCompleted(Context, String)`：调用 `TodoDbHelper.setTodoCompleted(...)`，并在动效结束后触发 DB 更新。

---

### Task 4: 前端适配与字段兼容扩展 (`useTodos.js` & 工具函数)

**Objective:** 扩展前端数据模型，支持 `notes`、`priority`、`updatedAt`、`deletedAt` 等新字段，保证与 SQLite 完整映射，并在本地 localStorage fallback 中同样保持兼容。

**Files:**
- Modify: `src/hooks/useTodos.js`
- Modify: `src/utils/rolloverOverdue.js`
- Test: `src/hooks/__tests__/useTodos.test.js`
- Test: `src/utils/__tests__/rolloverOverdue.test.js`

**Steps:**
1. 更新 `useTodos.js` 中的 `addTodo`，生成符合扩展 Schema 的对象（包含 `updatedAt`, `priority: 0`, `notes: null`, `deletedAt: null`）。
2. 在更新任务、切换完成、顺延过期任务时同步刷新 `updatedAt`。
3. 运行 Vitest 测试套件，确保现有全部 63 项测试无回归。

---

### Task 5: 全流程构建验证与真机/模拟器测试

**Objective:** 执行前端 build、Capacitor 同步及 Android 原生 Gradle 编译，验证 SQLite 数据库、数据自动迁移、小组件直查功能无任何编译或运行时错误。

**Files:**
- Test/Build: `npm run build`
- Sync: `npx cap sync android`
- Gradle: `cd android && ./gradlew assembleDebug`

**Steps:**
1. 运行 `npm run test` 确保 100% 测试通过。
2. 运行 `npm run build` 生成生产包。
3. 执行 `npx cap sync android` 同步。
4. 执行 Gradle 编译命令 `assembleDebug` 验证 Java 原生代码零编译报错。
