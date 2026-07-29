# 开发计划 — To-Do List 安卓 App

> 基于 `docs/requirements.md` 生成
> 日期：2026-07-29

---

## 总体策略

**自下而上，数据先行**：先实现数据层（Hook），再逐层搭建 UI 组件，最后组装完整页面。
**TDD 强制**：每个功能严格 RED → GREEN → REFACTOR。

---

## 设计方向（已确认）

**融合方案：分组 + 卡片**

| 元素 | 来源 | 说明 |
|------|------|------|
| 时间分组 | Variant C | 今天/明天/昨天自动分组，组标题 12px uppercase |
| 卡片样式 | Variant B | 白色圆角 12px 卡片，`box-shadow` + hover 上浮 |
| 完成色 | Variant C | 绿色 #16A34A（区别于主按钮蓝 #2563EB） |
| 筛选样式 | Variant A | 底线高亮，简洁不占空间 |
| 删除交互 | Variant A | hover 显示红色 × |

原型文件：`prototypes/variant-d/index.html`

---

## 任务拆解

### 任务 1：项目配置（已在阶段 3 完成）

**状态**：已完成（`npm init` + 依赖安装 + `vite.config.js` + `index.html`）

**已完成的文件**：
- `package.json` — 依赖已安装
- `vite.config.js` — Vite + Tailwind v4 + Vitest 配置
- `index.html` — 入口 HTML
- `src/styles/index.css` — Tailwind 入口 + `@theme` 颜色变量
- `src/setupTests.js` — 测试 setup

---

### 任务 2：数据层 — useTodos Hook

**文件**：
- `src/hooks/useTodos.js`
- `src/hooks/__tests__/useTodos.test.js`

**数据模型**：
```javascript
{
  id: string,           // crypto.randomUUID()
  text: string,
  completed: boolean,
  category: null,       // P1 阶段实现
  createdAt: number     // Date.now()
}
```

**测试用例（RED 先写）**：
1. `addTodo(text)` — 添加一条任务，验证 todos 数组长度和内容
2. `toggleTodo(id)` — 切换完成状态
3. `deleteTodo(id)` — 删除指定任务
4. `filter: all` — 返回全部任务
5. `filter: active` — 返回未完成任务
6. `filter: completed` — 返回已完成任务
7. localStorage 读写 — 模拟页面刷新后数据仍在

**实现要点**：
- 使用 `useReducer` 管理 todos 状态（action 类型清晰，便于后期扩展分类）
- localStorage 读写用 `try-catch` 包裹
- `useEffect` 监听 todos 变化写入 localStorage
- 导出 `FILTERS` 常量供 FilterTabs 使用

---

### 任务 3：组件 — EmptyState

**文件**：
- `src/components/EmptyState.jsx`
- `src/components/__tests__/EmptyState.test.jsx`

**测试用例**：
1. 渲染友好提示文字
2. 根据 filter 类型显示不同提示（全部为空 vs 已完成为空）

**实现**：
- 简单函数组件，接收 `filter` prop
- 居中显示文字，无图片

---

### 任务 4：组件 — AddTodo

**文件**：
- `src/components/AddTodo.jsx`
- `src/components/__tests__/AddTodo.test.jsx`

**测试用例**：
1. 输入文字后按回车，调用 `onAdd` 回调并传入文本
2. 空输入按回车，不调用回调
3. 提交后输入框清空
4. 按钮点击也能提交

**实现**：
- 受控输入框（`useState` 管理输入值）
- 回车和按钮两种提交方式
- `onAdd(text)` 回调

---

### 任务 5：组件 — TodoItem

**文件**：
- `src/components/TodoItem.jsx`
- `src/components/__tests__/TodoItem.test.jsx`

**测试用例**：
1. 渲染任务文字
2. 点击圆圈调用 `onToggle`
3. 完成态有 `line-through` 样式
4. hover/点击任务行，删除按钮可见（tap-to-reveal）
5. 点击删除按钮调用 `onDelete`

**实现**：
- 接收 props：`todo`, `onToggle`, `onDelete`
- 白色圆角 12px 卡片，`box-shadow: 0 1px 3px rgba(0,0,0,0.04)`
- hover 卡片上浮 + 阴影加深
- 左侧圆圈（`<button>` 可点击），完成态变绿 #16A34A 填充
- 任务文字（完成态加 `line-through` + 灰色 #A8A29E）
- 右侧日期标签（来自分组）
- 右侧删除按钮（默认隐藏，hover 或 `showDelete` 状态显示）
- 桌面端用 CSS `:hover`，移动端用点击切换 `showDelete` 状态

---

### 任务 6：组件 — FilterTabs

**文件**：
- `src/components/FilterTabs.jsx`
- `src/components/__tests__/FilterTabs.test.jsx`

**测试用例**：
1. 渲染三个 Tab（全部/进行中/已完成）
2. 点击 Tab 调用 `onFilterChange`
3. 当前选中 Tab 有高亮样式

**实现**：
- 接收 props：`currentFilter`, `onFilterChange`
- 使用 `FILTERS` 常量渲染 Tab
- 选中态：主色底线或背景色区分

---

### 任务 7：组件 — TodoList

**文件**：
- `src/components/TodoList.jsx`
- `src/components/__tests__/TodoList.test.jsx`

**测试用例**：
1. 传入任务数组，渲染对应数量的 TodoItem
2. 空数组时显示 EmptyState
3. 每个 TodoItem 的 `onToggle`/`onDelete` 正确传递

**实现**：
- 接收 props：`todos`, `onToggle`, `onDelete`, `filter`
- 列表用 `<ul>` 渲染
- 空状态切换 EmptyState

---

### 任务 8：组装 — App.jsx + 全局样式

**文件**：
- `src/App.jsx`
- `src/main.jsx`
- `src/components/__tests__/App.test.jsx`（可选集成测试）

**组装逻辑**：
```
App
├── 标题 + 任务计数
├── FilterTabs（currentFilter, onFilterChange）
├── TodoList
│   ├── groupByDate(filteredTodos) → 按今天/明天/昨天分组
│   ├── 每组：GroupLabel + TodoItem[]
│   └── 空状态：EmptyState
└── AddTodo（onAdd）— 底部固定
```

**测试**：
1. 完整流程：添加任务 → 切换完成 → 删除 → 切换筛选

**全局样式**（`src/styles/index.css`）：
- 已有 `@theme` 颜色变量
- 确保 `body` 背景色、字体、行高正确

---

## 开发顺序

```
任务 2  useTodos Hook     ← 最核心，所有组件依赖它
  ↓
任务 3  EmptyState        ← 最简单的组件，热身
  ↓
任务 4  AddTodo           ← 独立组件，不依赖其他组件
  ↓
任务 5  TodoItem          ← 核心交互组件
  ↓
任务 6  FilterTabs        ← 独立组件
  ↓
任务 7  TodoList          ← 组合 TodoItem + EmptyState
  ↓
任务 8  App.jsx           ← 最终组装
```

每个任务完成后运行 `npm run test` 确认全部通过再进入下一个。

---

## 文件清单（最终）

```
src/
├── main.jsx
├── App.jsx
├── hooks/
│   ├── useTodos.js
│   └── __tests__/
│       └── useTodos.test.js
├── components/
│   ├── TodoList.jsx
│   ├── TodoItem.jsx
│   ├── AddTodo.jsx
│   ├── FilterTabs.jsx
│   ├── EmptyState.jsx
│   └── __tests__/
│       ├── TodoList.test.jsx
│       ├── TodoItem.test.jsx
│       ├── AddTodo.test.jsx
│       ├── FilterTabs.test.jsx
│       └── EmptyState.test.jsx
└── styles/
    └── index.css
```

---

## 风险与对策

| 风险 | 对策 |
|------|------|
| localStorage 在隐私模式下可能不可用 | try-catch 包裹，降级为内存存储 |
| tap-to-reveal 在移动端触摸体验不佳 | 移动端用点击切换状态（不依赖 hover） |
| Tailwind v4 自定义颜色不生效 | 用 `@theme` 定义 CSS 变量，Tailwind 4 原生支持 |
| Vitest jsdom 环境缺少 API | 只测纯逻辑和 DOM 渲染，不测浏览器特有 API |
