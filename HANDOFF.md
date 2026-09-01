# HANDOFF.md — 项目完整交接文档

> **生成时间**：2026-09-01（基于全量代码扫描，由 Antigravity AI 生成）
> **当前版本**：v27（`.apk-version` 文件）
> **开发环境**：VS Code + Antigravity / Claude 插件
> **测试设备**：Xiaomi 14（MIUI, Android 15, API 34+）

---

## 目录

1. [项目概述](#一项目概述)
2. [技术栈与依赖](#二技术栈与依赖)
3. [完整目录结构](#三完整目录结构)
4. [架构设计](#四架构设计)
5. [核心模块详解](#五核心模块详解)
6. [数据流与存储](#六数据流与存储)
7. [Android 小组件系统](#七android-小组件系统)
8. [已解决的技术难题](#八已解决的技术难题)
9. [版本更新历史](#九版本更新历史)
10. [已知问题与待优化](#十已知问题与待优化)
11. [构建与发布流程](#十一构建与发布流程)
12. [调试手册](#十二调试手册)
13. [后续开发建议](#十三后续开发建议)
14. [参考文档](#十四参考文档)

---

## 一、项目概述

### 1.1 项目名称
**待办清单（To-Do List）** — Android 个人日常任务管理 App + 桌面小组件

### 1.2 核心目标
- 个人使用的极简任务管理工具
- 原生体验的 Android 桌面小组件（可直接在桌面查看并完成今日任务）
- 离线优先，无需账号，数据本地存储

### 1.3 仓库信息
- **GitHub**：https://github.com/yugusu704-lang/to-do-list
- **本地路径**：`D:\to-do-list`
- **主分支**：`master`
- **当前版本**：v27

### 1.4 已实现功能清单

| 功能 | 状态 | 引入版本 |
|------|------|---------|
| 任务 CRUD（增删改查） | ✅ | v1 |
| 任务持久化（SQLite） | ✅ | v17 |
| SharedPreferences → SQLite 自动迁移 | ✅ | v17 |
| 桌面小组件（4×2 + 4×3） | ✅ | v8 |
| 小组件 ListView 垂直滚动 | ✅ | v12 |
| 小组件 checkbox 点击标记完成 | ✅ | v12 |
| 小组件标记完成淡出动效 | ✅ | v22+ |
| 小组件「+」按钮深度链接到 App 添加框 | ✅ | v12+ |
| 小组件每日 0:00 自动刷新 | ✅ | v12 |
| 小组件主题跟随 App（浅/深色/系统） | ✅ | v22+ |
| 按日期分组显示（今天/明天/后天/已过期） | ✅ | v10+ |
| 组内按截止时间升序 | ✅ | v15 |
| 过期任务自动顺延到今天（0:00 触发） | ✅ | v16+ |
| 任务就地编辑（铅笔按钮触发，防误触） | ✅ | v18/v21 |
| 清除已完成 + 撤销 Toast | ✅ | v16+ |
| 底部导航栏固定（不随列表滚动） | ✅ | v15 |
| 深色模式（App + 小组件联动） | ✅ | v22+ |
| 三态主题切换（浅色/深色/跟随系统） | ✅ | v22+ |
| 自动清理 30 天以上已完成任务 | ✅ | v10+ |
| 长文字自动折行（App + 小组件） | ✅ | v19 |

---

## 二、技术栈与依赖

### 2.1 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| React | ^19.2.8 | 函数组件 + Hooks，无 Redux |
| Vite | ^8.1.5 | 构建工具，配置 `base: './'` 供 Capacitor 8 使用 |
| Tailwind CSS | ^4.3.3 | v4 版本，使用 `@tailwindcss/vite` 插件集成 |
| Vitest | ^4.1.10 | 单元测试框架 |
| @testing-library/react | ^16.3.2 | 组件测试库 |
| jsdom | ^30.0.1 | 测试 DOM 环境 |

### 2.2 原生层

| 技术 | 版本 | 说明 |
|------|------|------|
| Capacitor | ^8.4.2 | Web → Android APK 桥接层 |
| @capacitor/android | ^8.4.2 | Android 平台支持 |
| @capacitor/app | ^8.1.1 | 应用生命周期事件（appStateChange） |
| Java | JDK 17 | Android 原生代码语言 |
| Android SDK | API 34+ | 目标平台，minSdk 22 |
| SQLite | 系统内置 | 通过 `android.database.sqlite` 原生访问 |

### 2.3 构建工具链

```
Node.js → Vite → dist/ → npx cap sync → android/ → Gradle → APK
```

**npm 脚本速查**：

```bash
npm run dev           # 启动开发服务器（localhost:5173）
npm run build         # 构建前端（输出 dist/）
npm run test          # 单次跑全部测试
npm run test:watch    # 监听模式（开发时推荐）
npm run build:apk     # 一键构建 debug APK（vite build + cap sync + gradlew）
npx cap sync          # 同步 Web 资源到 Android
```

---

## 三、完整目录结构

```
D:\to-do-list\
├── .apk-version                        # 当前 APK 版本号（纯文本，当前值: 27）
├── .gitignore
├── CLAUDE.md                           # Claude AI 开发规范（设计、TDD、代码风格）
├── DEVELOPMENT.md                      # 8 阶段开发流程指南（需求→打包）
├── HANDOFF.md                          # 本文件 - 项目交接文档
├── README.md                           # 项目简介
├── WIDGET_DEVELOPMENT.md               # 小组件开发专项文档
├── capacitor.config.json               # Capacitor 配置（appId, appName, webDir）
├── index.html                          # Web 入口 HTML
├── package.json                        # 依赖 + 脚本
├── vite.config.js                      # Vite 配置（base: './', Vitest 配置）
│
├── docs/
│   ├── requirements.md                 # 需求确认书（2026-07-29）
│   ├── plan.md                         # 开发计划文档
│   └── sqlite-storage-plan.md         # v17 SQLite 重构方案
│
├── src/
│   ├── main.jsx                        # React 入口（挂载 App 到 #root）
│   ├── setupTests.js                   # Vitest 测试配置（引入 jest-dom）
│   ├── App.jsx                         # 根组件（生命周期、主题、Toast）
│   │
│   ├── components/
│   │   ├── AddTodo.jsx                 # 添加任务表单（forwardRef 支持聚焦）
│   │   ├── DateButton.jsx              # 日期时间选择器（datetime-local 封装）
│   │   ├── EmptyState.jsx              # 空状态占位组件
│   │   ├── FilterTabs.jsx              # 筛选标签（全部/进行中/已完成）
│   │   ├── ThemeToggle.jsx             # 主题切换按钮（Sun/Moon/System 图标）
│   │   ├── TodoItem.jsx                # 单条任务（查看态 + 编辑态 + Ripple）
│   │   ├── TodoList.jsx                # 任务列表（按日期分组 + 组内时间排序）
│   │   └── __tests__/
│   │
│   ├── hooks/
│   │   ├── useTodos.js                 # 核心数据 Hook（CRUD + 持久化 + 顺延 + 清理）
│   │   ├── useTheme.js                 # 主题 Hook（三态循环 + 原生同步）
│   │   └── __tests__/
│   │
│   ├── plugins/
│   │   └── todoStorage.js              # Capacitor 插件桥接（含 Web fallback）
│   │
│   ├── styles/
│   │   └── index.css                   # Tailwind CSS 入口（@import tailwindcss + @theme）
│   │
│   └── utils/
│       ├── rolloverOverdue.js          # 过期任务顺延工具函数
│       └── __tests__/
│
└── android/
    ├── build-debug.bat                 # Windows debug APK 构建脚本
    ├── build-release.bat               # Windows release APK 构建脚本
    ├── keystore/
    │   └── release.keystore            # 签名密钥（⚠️ 不提交 Git，务必备份！）
    │
    └── app/src/main/
        ├── AndroidManifest.xml         # 权限声明 + Service/Receiver 注册
        │
        ├── java/com/example/todolist/
        │   ├── MainActivity.java       # BridgeActivity（back 键 + 深度链接处理）
        │   ├── TodoStoragePlugin.java  # Capacitor 插件（load/save/theme/focusAdd）
        │   │
        │   ├── db/
        │   │   └── TodoDbHelper.java   # SQLite 单例（建表/索引/迁移/CRUD/小组件查询）
        │   │
        │   └── widget/
        │       ├── TodoWidgetProvider.java       # 4×2 Provider（主逻辑 + 完成动效）
        │       ├── TodoWidgetProviderLarge.java   # 4×3 Provider（继承 4×2）
        │       ├── TodoWidgetViewsFactory.java    # ListView RemoteViews 数据适配器
        │       ├── TodoWidgetViewsService.java    # RemoteViewsService（创建工厂）
        │       ├── TodoWidgetTheme.java           # 主题适配助手（浅/深色/系统）
        │       └── TodoWidgetRefreshReceiver.java # 每日 0:00 定时刷新广播接收器
        │
        └── res/
            ├── layout/
            │   ├── widget_todo_4x2.xml      # 4×2 小组件布局
            │   ├── widget_todo_4x3.xml      # 4×3 小组件布局
            │   └── widget_task_item.xml     # 单条任务行（checkbox、时间、地点）
            ├── drawable/                    # 图标资源（浅/深色各一套）
            ├── values/
            │   └── widget_colors.xml        # 小组件颜色定义（含深色模式）
            └── xml/
                ├── widget_todo_4x2_info.xml
                └── widget_todo_4x3_info.xml
```

---

## 四、架构设计

### 4.1 整体架构图

```
┌──────────────────────────────────────────────┐
│           React Web App（Vite）               │
│                                              │
│  App.jsx                                     │
│  ├── useTodos Hook ──→ TodoStorage.load/save │
│  ├── useTheme Hook ──→ TodoStorage.setTheme  │
│  ├── TodoList → TodoItem（查看/编辑）         │
│  └── AddTodo（forwardRef 支持深度链接聚焦）   │
└─────────────────┬────────────────────────────┘
                  │ Capacitor Bridge（JSI/WebView）
┌─────────────────▼────────────────────────────┐
│         TodoStoragePlugin（Java）             │
│  load()           → TodoDbHelper.getAllActiveTodosJson() │
│  save()           → TodoDbHelper.syncTodos() + refreshAllWidgets() │
│  setThemeMode()   → SharedPrefs + refreshAllWidgets() │
│  getAndClearFocusAdd() → SharedPrefs 一次性消费 │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│           TodoDbHelper（SQLite 单例）          │
│  数据库文件：todos.db                         │
│  表：todos（12 列 + 2 复合索引）              │
│  checkAndMigrateFromSharedPrefs() — 一次性迁移 │
│  getAllActiveTodosJson()                       │
│  syncTodos()（全量 UPSERT + 清理）             │
│  setTodoCompleted()（小组件专用）              │
│  getTodayActiveTodosForWidget()               │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│        Android Widget System                  │
│  refreshAllWidgets()                          │
│  └── updateWidget(id)                         │
│       ├── setRemoteAdapter（绑定 ListView）    │
│       ├── setPendingIntentTemplate（点击模板） │
│       └── notifyAppWidgetViewDataChanged()    │
│            → TodoWidgetViewsFactory           │
│               └── getViewAt() per row         │
│                   ├── SQLite 直查今日任务      │
│                   ├── TodoWidgetTheme（主题）  │
│                   └── completingRows（动效）   │
└──────────────────────────────────────────────┘
```

### 4.2 数据写入流

```
用户操作（添加/切换/删除）
  → React setState（乐观更新，立即生效）
  → useEffect 触发 saveTodosAsync()
  → TodoStorage.save({ data: JSON.stringify(todos) })
  → TodoStoragePlugin.save() → TodoDbHelper.syncTodos()
  → TodoWidgetProvider.refreshAllWidgets()（小组件同步刷新）
```

### 4.3 主题系统流

```
useTheme Hook（三态循环：system → light → dark → system）
  → TodoStorage.setThemeMode({ themeMode })
  → SharedPrefs 持久化 "theme_mode"
  → TodoWidgetProvider.refreshAllWidgets()
     → TodoWidgetTheme.applyThemeToWidget()
        → 读 SharedPrefs + 系统 UI Mode → 选择配色方案
```

---

## 五、核心模块详解

### 5.1 `App.jsx` — 根组件

**职责**：
- 组装所有子组件，处理全局生命周期
- 监听 `appStateChange`：回到前台时调用 `resyncFromNative()` 全量重载（处理小组件操作导致的数据变化）
- 0:00 跨天定时器：重置日期分组 key + 调用 `rolloverOverdueTodos()`
- 冷启动检查 `focus_add` 标记（小组件「+」按钮深度链接到输入框）
- 管理 Toast：清除已完成撤销（可撤销）+ 顺延通知（不可撤销），3 秒自动消失

### 5.2 `useTodos.js` — 核心数据 Hook

| 方法 | 说明 |
|------|------|
| `addTodo({ text, dueAt, location })` | 添加任务，生成 UUID，prepend 到列表头部 |
| `toggleTodo(id)` | 切换完成状态，记录 `completedAt` |
| `updateTodo({ id, text, dueAt, location, notes, priority })` | 就地编辑 |
| `deleteTodo(id)` | 从列表过滤移除（硬删，不软删） |
| `clearCompleted()` | 清除所有已完成，返回被删任务（供撤销） |
| `restoreTodos(restored)` | 撤销清除，prepend 回列表 |
| `rolloverOverdueTodos()` | 顺延过期未完成任务的 dueAt 到今天（保留时间） |
| `resyncFromNative()` | 回到前台时从 SQLite 全量重载（处理小组件修改） |

**启动时序**：
1. `loadTodosAsync()` → 优先读 SQLite（含存量迁移检查），fallback localStorage
2. `autoClean()` → 过滤 30 天以上已完成任务
3. `rolloverOverdue()` → 顺延过期未完成任务
4. `setTodos()` → 触发渲染

### 5.3 `todoStorage.js` — Capacitor 插件桥接

| JS 方法 | 原生实现 | Web fallback |
|---------|----------|-------------|
| `load()` | `TodoDbHelper.getAllActiveTodosJson()` | `localStorage.getItem('todos')` |
| `save({ data })` | `TodoDbHelper.syncTodos()` | `localStorage.setItem('todos', data)` |
| `setThemeMode({ themeMode })` | SharedPrefs + `refreshAllWidgets()` | `localStorage.setItem('theme_mode', ...)` |
| `getThemeMode()` | SharedPrefs 读取 | `localStorage.getItem('theme_mode')` |
| `getAndClearFocusAdd()` | SharedPrefs 一次性消费 | `return { focus: false }` |

### 5.4 `TodoDbHelper.java` — SQLite 单例

**数据库路径**：`/data/data/com.example.todolist/todos.db`

**建表 SQL**：

```sql
CREATE TABLE todos (
  id           TEXT PRIMARY KEY,
  text         TEXT NOT NULL,
  completed    INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  due_at       TEXT,           -- ISO "2026-07-30T10:30"（无秒）
  location     TEXT,
  category     TEXT,           -- 预留（未使用）
  priority     INTEGER NOT NULL DEFAULT 0,  -- 预留（未使用）
  notes        TEXT,           -- 预留（未使用）
  deleted_at   INTEGER         -- 预留（软删未落地）
);
-- 加速小组件查询的复合索引
CREATE INDEX idx_todos_active_due ON todos (completed, due_at, deleted_at);
CREATE INDEX idx_todos_created ON todos (created_at DESC);
```

**核心方法**：
- `checkAndMigrateFromSharedPrefs()` — 冷启动时一次性迁移旧数据，通过 `migrated_to_sqlite_v1` flag 防重复
- `syncTodos(JSONArray)` — 全量 UPSERT（`CONFLICT_REPLACE`）+ 删除不在列表中的记录（事务保护）
- `getTodayActiveTodosForWidget(todayStart, todayEnd, completingIds)` — 小组件专用，返回今日未完成任务，按时间升序

### 5.5 数据模型（JS 端完整结构）

```javascript
{
  id: string,            // crypto.randomUUID() 或时间戳 fallback
  text: string,          // 任务内容
  completed: boolean,    // 是否完成
  completedAt: number | null, // 完成时间戳（ms）
  createdAt: number,     // 创建时间戳（ms）
  updatedAt: number,     // 最后修改时间戳（ms）
  dueAt: string | null,  // 截止时间 ISO "2026-07-30T10:30"
  location: string | null, // 地点
  category: null,        // 预留字段（当前未使用）
  priority: 0,           // 预留字段（当前未使用，整数）
  notes: null,           // 预留字段（当前未使用）
  deletedAt: null,       // 预留字段（软删除尚未落地）
}
```

---

## 六、数据流与存储

### 6.1 存储层次

```
SQLite (todos.db)              ← 主存储（v17 起），支持百万级记录
  │ 一次性迁移（冷启动检测）
SharedPreferences (todo_prefs.xml)
  ├── focus_add (boolean)       ← 小组件「+」触发聚焦标记（一次性消费）
  ├── theme_mode (string)       ← 主题模式（system/light/dark）
  └── migrated_to_sqlite_v1 (bool) ← 迁移完成标记，防重复
  │ Web 环境 fallback
localStorage (浏览器)           ← 开发环境调试用
```

### 6.2 dueAt 时间格式规范

> **重要**：前端存储为 `"YYYY-MM-DDTHH:mm"`（无秒），Java 端兼容解析：

```java
// TodoDbHelper.parseDueAtStr()
if (str.split(":").length == 2) {   // HH:mm → 无秒格式
    sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm", ...);
} else {                             // HH:mm:ss → 有秒格式
    sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", ...);
}
```

### 6.3 小组件与 App 数据同步

**设计原则**：小组件直接读写 SQLite，不经过 JS 层。

- **App → 小组件**：`saveTodosAsync()` → `syncTodos()` → `refreshAllWidgets()`（自动）
- **小组件 → App**：小组件标记完成 → 直接更新 SQLite → App 回到前台 → `appStateChange` → `resyncFromNative()`（全量重载）

---

## 七、Android 小组件系统

### 7.1 完整调用链

```
用户在 App 内操作
  → TodoStoragePlugin.save()
  → refreshAllWidgets()
  → updateWidget(widgetId)
      ├── setRemoteAdapter(ListView, ServiceIntent)
      ├── setPendingIntentTemplate(ClickTemplate)
      ├── applyThemeToWidget()
      └── notifyAppWidgetViewDataChanged()
           → TodoWidgetViewsFactory.onDataSetChanged()
           → loadTodayTodos()（SQLite 直查）
           → getViewAt(position)
               ├── 渲染文字/时间/地点
               ├── applyThemeToTaskItem()（主题+动效 alpha）
               └── setOnClickFillInIntent（携带 todo_id）
```

### 7.2 完成动效（3 帧淡出）

```java
// TodoWidgetProvider.completingRows: ConcurrentHashMap<String id, Float alpha>
// 帧1 (0ms)   alpha=1.0f → 任务仍在列表，显示绿色 checkbox
// 帧2 (150ms) alpha=0.45f → 半透明
// 帧3 (280ms) alpha=0.12f → 几乎不可见
// 移除(380ms) completingRows.remove(id) → refreshAllWidgets() → 任务消失
```

### 7.3 点击事件（Android 14+ 合规方案）

```java
// Provider：FLAG_MUTABLE（模板需要 fillIn 合并 extras）
Intent templateIntent = new Intent(context, TodoWidgetProvider.class);
templateIntent.setAction(ACTION_COMPLETE);
templateIntent.setPackage(context.getPackageName());  // 显式 Intent
views.setPendingIntentTemplate(R.id.widget_task_container,
    PendingIntent.getBroadcast(context, 0, templateIntent,
        FLAG_UPDATE_CURRENT | FLAG_MUTABLE));

// Factory getViewAt()：checkbox 和根视图都需要单独设置 fillInIntent
Intent fillInIntent = new Intent();
fillInIntent.putExtra("todo_id", item.id);
v.setOnClickFillInIntent(R.id.widget_task_item_root, fillInIntent);
v.setOnClickFillInIntent(R.id.task_checkbox, fillInIntent);  // ← 缺少会导致 checkbox 点击失效
```

### 7.4 每日 0:00 自动刷新

```java
// TodoWidgetRefreshReceiver
// AlarmManager.setExactAndAllowWhileIdle()（穿透 Doze 模式）
// 触发时间：每日 0:00 + 5 秒缓冲
// 触发后：refreshAllWidgets()
// 权限要求：AndroidManifest 声明 SCHEDULE_EXACT_ALARM，代码用 try-catch 保护
```

### 7.5 主题系统

```java
// TodoWidgetTheme.isDarkMode()
// "dark"   → 强制深色
// "light"  → 强制浅色
// "system" → 读取 Configuration.UI_MODE_NIGHT_MASK

// 浅色：背景 widget_bg_light，主文字 #2F3437，次要文字 #78716C
// 深色：背景 widget_bg_dark，主文字 #F4F4F5，次要文字 #A1A1AA
```

---

## 八、已解决的技术难题

### 8.1 Vite + Capacitor 8 白屏问题

- **症状**：APK 安装后白屏
- **根因**：Vite 默认绝对路径 `/assets/xxx.js`，Capacitor 8 将文件放在 `assets/public/` 子目录，路径不匹配
- **解决**：`vite.config.js` 添加 `base: './'`

### 8.2 小米设备启动卡死

- **症状**：debug APK 安装后 App 长时间黑屏
- **根因**：debug buildType 默认 `debuggable = true`，MIUI 会等待调试器连接
- **解决**：`android/app/build.gradle` 中 `debug { debuggable false }`

### 8.3 小米 Launcher 不兼容标准 CheckBox

- **症状**：小组件崩溃
- **根因**：MIUI Launcher 将 CheckBox 替换为私有 `HomeMIUIWidgetCheckBox`，不支持 `setChecked()`
- **解决**：改用 `ImageView` + 两套 drawable 切换（`ic_checkbox_checked` / `ic_checkbox_unchecked_light/_dark`）

### 8.4 Android 14+ PendingIntent 崩溃

- **症状**：小组件 checkbox 点击崩溃
- **根因**：API 34 禁止「隐式 Intent + FLAG_MUTABLE」组合
- **解决**：模板 PendingIntent 使用显式 Intent（含 `setPackage()`）+ `FLAG_MUTABLE`；不需要 fillIn 的用 `FLAG_IMMUTABLE`

### 8.5 ListView 中 setOnClickPendingIntent 失效

- **症状**：小组件任务行点击无响应
- **根因**：`setOnClickPendingIntent` 在 ListView item 中不可靠（RemoteViews 限制）
- **解决**：标准模式：`setPendingIntentTemplate` + `setOnClickFillInIntent`（checkbox 和根视图均需设置）

### 8.6 SharedPreferences → SQLite 存量迁移（v17）

- **背景**：SharedPreferences 存单一大 JSON，IPC 限制下容量不足
- **迁移策略**：
  1. 冷启动检查 `migrated_to_sqlite_v1` 标记
  2. 未迁移则从 SharedPrefs 读旧 JSON → 批量事务 UPSERT 到 SQLite
  3. 写入迁移标记，之后永远不再执行
- **保障**：容量从数百条扩展至百万级，老用户数据零丢失

### 8.7 精确闹钟权限崩溃（Android 12+）

- **解决**：`AndroidManifest.xml` 声明 `SCHEDULE_EXACT_ALARM`，调用处加 `try-catch (SecurityException)`

---

## 九、版本更新历史

| 版本 | 时间 | 核心变更 |
|------|------|---------|
| v1~v6 | 早期 | APK 崩溃修复（Capacitor 配置/依赖/颜色资源） |
| v7 | — | Vite `base: './'`；`debuggable false`；精确闹钟权限 |
| v8 | — | 小米 CheckBox 兼容；`refreshAllWidgets` 改为 public static；dueAt 双格式解析 |
| v12 | — | 小组件 ListView 滚动（RemoteViewsFactory）；checkbox 点击修复；Android 14+ PendingIntent 合规 |
| v14 | — | 签名密钥统一（覆盖安装保留数据） |
| v15 | 2026-08-01 | 底部导航栏固定；组内按截止时间升序 |
| v17 | 2026-08-22 | SQLite 重构（TodoDbHelper 单例）；存量自动迁移；容量突破 |
| v18 | 2026-08-22 | 任务就地编辑（铅笔按钮） |
| v19 | 2026-08-22 | 长文字折行（App 移除 truncate；小组件 maxLines=3） |
| v20 | 2026-08-22 | 卡片垂直居中；操作按钮 40×40px 触控区 |
| v21 | 2026-08-22 | 编辑防误触（文字区域不再触发编辑，仅铅笔按钮） |
| v22+ | — | 深色模式（App + 小组件联动）；三态主题；小组件完成淡出动效 |
| v27 | 当前 | 最新版本 |

---

## 十、已知问题与待优化

### 10.1 功能缺口

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 任务拖拽排序 | P1 | 可用 `dnd-kit`，需新增 `order` 字段 |
| 小组件任务行点击打开 App 对应任务 | P1 | 需 Deep Link（intent-filter + hash 参数滚动定位） |
| 备注字段（notes）UI | P2 | 数据模型和 `updateTodo` API 已支持，差编辑/显示 UI |
| 优先级（priority）UI | P2 | 数据模型已有字段，未使用 |
| 软删除真正落地 | P2 | `deleted_at` 字段已存在，JS 端 `deleteTodo` 仍为硬删 |
| 任务提醒通知 | P2 | 需 `@capacitor/local-notifications` |
| 任务分类/标签 | P2 | 数据模型已预留 `category` 字段 |

### 10.2 代码质量问题

| 问题 | 位置 | 建议 |
|------|------|------|
| 测试覆盖不足 | `__tests__/` 较稀少 | 补充 TodoItem、TodoList、AddTodo 的组件测试 |
| `loadTodayTodos` 逻辑重复 | `TodoWidgetProvider` + `TodoWidgetViewsFactory` | Provider 中的那份可删除，统一由 Factory 加载 |
| `clearCompleted` stale closure | `useTodos.js:176` | 可改用 `useRef` 规避 |
| `CLAUDE.md` 数据存储说明过时 | `CLAUDE.md:20` | 仍写 localStorage，应更新为 SQLite |

### 10.3 性能注意事项

- `syncTodos()` 每次保存执行全量 UPSERT + 删除，任务量大（1000+）时可改为增量同步
- 静态 `completingRows` Map 在进程重启后会清空（无副作用，属于正常行为）

---

## 十一、构建与发布流程

### 11.1 日常开发循环

```bash
# 前端开发
npm run dev

# 提交前跑测试
npm run test

# 构建并同步到 Android
npm run build && npx cap sync

# 安装到设备
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.example.todolist/.MainActivity
```

### 11.2 一键构建 debug APK

```bash
npm run build:apk
# 等价于: vite build && npx cap sync android && android\build-debug.bat
```

### 11.3 release APK 构建

```bash
# Windows（在项目根目录）
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd android
gradlew assembleRelease
# 产物：android/app/build/outputs/apk/release/app-release.apk
```

### 11.4 发布到 GitHub

```bash
# 1. 递增版本号
echo 28 > .apk-version

# 2. 提交代码
git add -A
git commit -m "feat: v28 - 功能描述"
git push origin master

# 3. 构建 release APK
cd android && gradlew assembleRelease

# 4. 创建 GitHub Release
gh release create v28 android/app/build/outputs/apk/release/app-release.apk \
  --title "v28 - 标题" \
  --notes "发布说明"
```

### 11.5 ⚠️ 签名密钥规范（极其重要）

| 项目 | 说明 |
|------|------|
| 密钥文件 | `android/keystore/release.keystore` |
| Git 状态 | **不提交**（已在 `.gitignore`） |
| 重要性 | 所有构建均使用此密钥，签名变更 = 覆盖安装失败 = 用户数据断层 |
| 换电脑 | 必须手动拷贝密钥文件，否则新签名无法升级旧版 |
| 备份 | **请务必备份到网盘/安全位置，密钥丢失无法恢复** |
| 密钥信息 | alias: `androiddebugkey`，口令: `android` |

### 11.6 升级数据验证（每次发布前必做）

```bash
# 手机有旧版和任务数据 → 覆盖安装新版 → 确认数据完整
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.example.todolist/.MainActivity
```

---

## 十二、调试手册

### 12.1 ADB 常用命令

```bash
# ADB 路径（本机）
C:\Users\long\AppData\Local\Android\Sdk\platform-tools\adb.exe

# 安装 APK
adb install -r <apk路径>

# 启动 App
adb shell am start -n com.example.todolist/.MainActivity

# 查看崩溃日志
adb logcat -d | grep -E "(FATAL|AndroidRuntime|Exception)" | grep -v "libsensor"

# 实时查看 App 日志（Tag 过滤）
adb logcat -s TodoWidget TodoDbHelper TodoStorage

# 查看进程 PID
adb shell pidof com.example.todolist

# 强制停止 App（重现冷启动场景）
adb shell am force-stop com.example.todolist
```

### 12.2 SQLite 数据检查

```bash
# 进入设备 Shell（需 debuggable 版本或 root）
adb shell
run-as com.example.todolist
sqlite3 databases/todos.db

# 常用查询
SELECT id, text, completed, due_at, deleted_at FROM todos ORDER BY created_at DESC LIMIT 20;
SELECT COUNT(*) FROM todos WHERE deleted_at IS NULL AND completed = 0;
SELECT COUNT(*) FROM todos;  -- 总记录数（含已删）
```

### 12.3 问题排查对照表

| 症状 | 排查方向 |
|------|---------|
| APK 安装后白屏 | `vite.config.js` 是否有 `base: './'` |
| 小米设备启动卡死 | `build.gradle` 的 `debug { debuggable false }` |
| 小组件不显示任务 | 任务是否有 `dueAt` 且在今天；SQLite 数据是否正确 |
| 小组件点击无响应 | `setPendingIntentTemplate` + `setOnClickFillInIntent` 是否均配置（含 checkbox） |
| 安装后立即崩溃 | `adb logcat` 查 `AndroidRuntime`，定位具体行号 |
| 升级后数据丢失 | 签名密钥是否一致（`release.keystore`） |
| 小组件不更新 | `refreshAllWidgets()` 是否被调用；精确闹钟权限是否已授予 |
| 主题不同步 | SharedPrefs `theme_mode` 是否正确写入；小组件是否触发了 `refreshAllWidgets()` |

### 12.4 Gradle 构建（Windows）

```bash
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd android

# debug
gradlew assembleDebug

# release
gradlew assembleRelease

# 安装到设备
gradlew installDebug
```

---

## 十三、后续开发建议

> 基于对当前代码库的全量分析，按价值/工作量综合评估排序。

### 🔴 高优先级（强烈建议尽快落地）

#### 1. 补全单元测试
**现状**：仅有 `useTodos.test.js`、`useTheme.test.js`、`rolloverOverdue` 测试，组件测试几乎为零。

**建议补充**：
- `TodoItem`：编辑态切换（铅笔按钮）、保存/取消、Enter/Escape 键盘事件
- `TodoList`：日期分组正确性（今天/明天/已过期/无日期）
- `AddTodo`：空输入防提交、`dueAt` 和 `location` 联动

**工具已就绪**：Vitest + @testing-library/react + jsdom，无需额外配置。

#### 2. 更新 `CLAUDE.md` 过时内容
`CLAUDE.md` 中"数据持久化"一节仍写 `localStorage`，实际已是 SQLite（v17 起）。若 AI 工具读到过时内容会走错方向，建议同步更新。

#### 3. 消除重复的 `loadTodayTodos` 逻辑
`TodoWidgetProvider.java` 中的 `loadTodayTodos()` 方法与 `TodoWidgetViewsFactory.java` 中的逻辑几乎相同，属于冗余代码。建议删除 Provider 中的那份，让 Provider 仅做「触发更新」，数据加载统一由 Factory 负责。

---

### 🟡 中优先级（有余力时推进）

#### 4. 软删除真正落地
**现状**：数据库有 `deleted_at` 字段，但 `deleteTodo()` 仍为硬删（从列表过滤）。

**改动方案**：
1. `useTodos.deleteTodo()` → 不从数组移除，改为设置 `deletedAt: Date.now()`
2. `useTodos.js` 渲染时过滤 `!todo.deletedAt`
3. `syncTodos()` 已能处理带 `deletedAt` 的记录

**收益**：支持删除撤销、历史记录、数据归档统计。

#### 5. 小组件任务行点击打开 App 对应任务
**改动方案**：
1. `AndroidManifest.xml` 添加 Deep Link intent-filter
2. `TodoWidgetViewsFactory.getViewAt()` 增加「打开 App」的 fillInIntent（区别于「完成」的 fillInIntent）
3. 前端通过 URL hash `#todo-{id}` 实现滚动定位

#### 6. 备注字段（notes）UI 实现
数据模型和 `updateTodo` API 已完整支持 `notes`，只差编辑态 UI（多行 textarea）和显示 UI（折叠/展开）。工作量小，价值高。

---

### 🟢 低优先级（长期规划）

#### 7. 增量同步替代全量 syncTodos
当任务量达到数千条时，`syncTodos()` 全量 UPSERT + DELETE 性能会下降。可实现：
- 前端 diff：对比上次保存快照，仅发送变更条目
- 原生端：分别调用 `insertOrUpdateTodos`（新增/修改）和 `softDeleteTodo`（删除）

#### 8. 任务拖拽排序
- 前端：`dnd-kit`（轻量，支持触摸拖拽）
- 数据模型：新增 `order` 字段（整数）
- SQLite：新增列，查询排序改为 `ORDER BY order ASC`

#### 9. 任务提醒通知
- 安装 `@capacitor/local-notifications`
- 设置 `dueAt` 时注册本地通知
- 需要 `AndroidManifest.xml` 申请通知权限

#### 10. 任务分类/标签
- 数据模型已有 `category` 字段，可直接扩展
- FilterTabs 增加分类 Tab
- 添加任务时显示分类选择器

---

### 开发工作流建议

#### 功能开发节奏
1. **先写测试**（RED）→ 实现功能（GREEN）→ 重构优化（REFACTOR）
2. **前端先验证**：在 `npm run dev` 浏览器环境下确认功能正确，再打 APK 测原生层
3. **小组件改动**单独验证：需要完整构建 APK（`npm run build:apk`），无法在浏览器中测试

#### Git 提交规范
```
feat: 新功能
fix: Bug 修复
style: UI 调整（不影响功能）
refactor: 代码重构（不改行为）
test: 测试
docs: 文档更新
chore: 构建/工具链
```
版本号格式：`v{N}`，与 `.apk-version` 文件同步递增。

#### AI 辅助开发注意事项
- 开始任务前，让 AI 先读 `CLAUDE.md` + `HANDOFF.md`
- 给 AI 的首要指令：**不修改 `android/keystore/` 和 `build.gradle` 的签名配置**
- 本项目使用 `.agents/skills/` 下的 Skills 工作流，可使用 `/grill-me`、`/plan`、`/boost` 等斜杠命令

---

## 十四、参考文档

### 14.1 项目内文档

| 文件 | 内容 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | 设计规范、TDD 流程、AI 开发守则 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 8 阶段开发流程（需求→打包） |
| [WIDGET_DEVELOPMENT.md](WIDGET_DEVELOPMENT.md) | Android 小组件开发专项文档 |
| [docs/requirements.md](docs/requirements.md) | 原始需求确认书 |
| [docs/sqlite-storage-plan.md](docs/sqlite-storage-plan.md) | v17 SQLite 重构方案 |

### 14.2 外部参考

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android App Widgets 指南](https://developer.android.com/develop/ui/views/appwidgets)
- [RemoteViews API](https://developer.android.com/reference/android/widget/RemoteViews)
- [RemoteViewsService API](https://developer.android.com/reference/android/widget/RemoteViewsService)
- [Vite 配置文档](https://vitejs.dev/config/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Vitest 文档](https://vitest.dev/)

---

## 联系方式

- **GitHub**：yugusu704-lang
- **项目仓库**：https://github.com/yugusu704-lang/to-do-list

---

*本文档由 Antigravity AI 于 2026-09-01 基于代码库全量扫描生成。若代码有重大更新，请同步维护对应章节，尤其是版本更新历史（第九章）和已知问题（第十章）。*
