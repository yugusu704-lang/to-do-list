# To-Do List 安卓 App — Claude 开发指南

## 项目概述

一个简洁的 To-Do List 安卓应用，使用 React + Vite 构建前端，通过 Capacitor 打包为 Android APK。

**目标用户**：个人日常任务管理
**核心原则**：功能简单、界面干净、体验流畅

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18+ | 函数组件 + Hooks |
| 构建工具 | Vite | 快速热更新 |
| 样式方案 | Tailwind CSS v4 | className 直接写在 JSX 中 |
| 状态管理 | useState / useReducer | 无需 Redux，简单场景够用 |
| 数据持久化 | localStorage | 浏览器本地存储，无需后端 |
| 打包方案 | Capacitor | Web → Android APK |

---

## 目录结构

```
D:\to-do-list\
├── CLAUDE.md                  # 本文件，Claude 开发指南
├── DEVELOPMENT.md             # 分阶段开发指南
├── index.html                 # 入口 HTML
├── package.json
├── vite.config.js             # Vite + Vitest 配置
├── capacitor.config.js        # Capacitor 配置
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx               # React 入口
│   ├── App.jsx                # 根组件
│   ├── components/
│   │   ├── TodoList.jsx       # 任务列表组件
│   │   ├── TodoItem.jsx       # 单个任务项
│   │   ├── AddTodo.jsx        # 添加任务输入框
│   │   ├── FilterTabs.jsx     # 筛选标签（全部/进行中/已完成）
│   │   └── EmptyState.jsx     # 空状态占位图
│   ├── hooks/
│   │   └── useTodos.js        # Todo 数据逻辑（增删改查 + localStorage）
│   └── styles/
│       └── index.css          # 全局样式（Tailwind 入口）
└── android/                   # Capacitor 生成的安卓项目（勿手动编辑）
```

---

## 核心功能清单

### P0（必须实现）
- [ ] 添加任务（输入框 + 回车/按钮提交）
- [ ] 完成/取消完成（点击切换，划线效果）
- [ ] 删除任务（点击任务显示删除按钮，tap-to-reveal）
- [ ] 数据持久化（localStorage，关闭再打开不丢失）
- [ ] 筛选视图（全部 / 进行中 / 已完成）

### P1（锦上添花）
- [ ] 编辑任务（点击任务文字进入编辑模式）
- [ ] 拖拽排序（可选，dnd-kit 或 react-beautiful-dnd）
- [ ] 任务计数（显示剩余未完成数量）
- [ ] 清除已完成（一键清除所有已完成任务）
- [ ] 自定义分类（用户创建分类，任务归属某个分类，筛选栏增加分类 Tab）

### P2（不做）
- ❌ 用户登录/注册
- ❌ 后端 API / 云同步
- ❌ 分类/标签系统
- ❌ 截止日期/提醒通知

---

## UI 设计规范

遵循 **极简编辑风格**，核心原则：

### 配色
```
背景色：    #FAFAF9（暖白）
卡片色：    #FFFFFF
主文字：    #1C1917（深石板灰）
次要文字：  #78716C（暖灰）
主色调：    #2563EB（蓝色，用于按钮/高亮/筛选底线）
完成色：    #16A34A（绿色，圆圈填充完成态）
危险色：    #DC2626（红色，仅用于删除按钮）
```

### 排版
- 字体：系统默认（`-apple-system, system-ui, sans-serif`）
- 标题：18-20px，font-semibold
- 正文：15-16px，font-normal
- 行高：1.5
- 不使用渐变、不用重阴影、不用圆角超过 12px

### 布局
- 单列布局，最大宽度 480px 居中
- 任务卡片间距 8px
- 整体左右 padding 16px
- 底部固定添加栏（类似 iOS 待办事项样式）

### 动效
- 任务完成：0.2s ease-out 圆圈变绿填充 + 文字变灰划线
- 任务删除：0.15s 向左滑出
- 新增任务：0.2s 从下方淡入
- 所有动效用 CSS transition，不引入动画库

### 交互
- 点击任务圆圈 = 切换完成状态
- 点击任务文字 = 进入编辑模式（P1）
- 点击/悬停任务 = 右侧显示删除按钮（tap-to-reveal）
- 底部输入框回车 = 添加任务
- 空状态显示友好提示文字，不显示图片

### 数据模型（为 P1 分类功能预留）
```javascript
// 任务对象结构
{
  id: string,           // 唯一 ID（crypto.randomUUID()）
  text: string,         // 任务内容
  completed: boolean,   // 是否完成
  category: string,     // 分类（P1 实现，默认 null）
  createdAt: number     // 创建时间戳
}
```

---

## 开发流程（TDD 强制）

严格遵循 **RED → GREEN → REFACTOR** 循环：

### 1. RED：先写失败的测试
```jsx
// 示例：useTodos.test.js
test('添加一条任务', () => {
  const { result } = renderHook(() => useTodos());
  act(() => result.current.addTodo('买牛奶'));
  expect(result.current.todos).toHaveLength(1);
  expect(result.current.todos[0].text).toBe('买牛奶');
});
```

### 2. GREEN：写最少代码让测试通过
```jsx
// 只实现刚好让测试通过的逻辑，不加多余功能
```

### 3. REFACTOR：重构，保持测试绿色
```jsx
// 提取函数、重命名变量、简化逻辑，但不改行为
```

### 测试工具
- 测试框架：Vitest（与 Vite 天然集成）
- 组件测试：@testing-library/react
- 匹配器：@testing-library/jest-dom（`toBeInTheDocument` 等）
- DOM 环境：jsdom（在 `vite.config.js` 的 `test.environment` 中配置）
- Hook 测试：renderHook
- 运行命令：`npm run test`

---

## 调试规范（4 阶段根因法）

遇到 bug 时，**禁止直接改代码**，按以下步骤走：

### 阶段 1：复现
- 写一个最小复现步骤
- 确认 bug 是否稳定触发

### 阶段 2：定位
- 读报错信息，从上往下看第一个 `at` 指向的项目文件
- 用 `console.log` 或断点确认变量在哪个时刻偏离预期
- **读相关代码，不要猜**

### 阶段 3：根因
- 区分"表面症状"和"根本原因"
- 问自己：为什么这个变量会是这个值？上游哪里传错了？

### 阶段 4：修复
- 只改引起 bug 的最小代码
- 修完后跑测试确认没有引入新问题
- 删除调试用的 console.log

---

## 代码提交检查清单

每次 commit 前自查：

- [ ] 所有测试通过（`npm run test` 无报错）
- [ ] 无 `console.log` 残留（除了有意保留的错误日志）
- [ ] 无硬编码的魔法数字（提取为常量）
- [ ] 组件不超过 150 行（超过就拆分）
- [ ] 函数不超过 30 行
- [ ] 所有 props 有合理命名（不用 `data`、`item` 这种模糊名）
- [ ] Tailwind 类名按 布局 → 间距 → 样式 → 响应 顺序排列

---

## Capacitor 打包步骤

前端开发完成后再执行，不要一开始就加 Capacitor。

```bash
# 1. 构建生产版本
npm run build

# 2. 初始化 Capacitor
npm init @capacitor/app
npx cap add android

# 3. 同步 Web 资源到安卓项目
npx cap sync

# 4. 打开 Android Studio 编译
npx cap open android
# 在 Android Studio 中 Build → Build APK

# 5. 后续每次改代码后
npm run build && npx cap sync
```

### Capacitor 注意事项
- `capacitor.config.js` 中 `webDir` 指向 `dist`
- Android minSdkVersion 设为 22（Android 5.1+）
- 不要手动编辑 `android/` 目录下的文件，全部通过 Capacitor CLI 管理
- 需要安装 Android Studio + JDK 17

---

## 命令速查

```bash
npm run dev          # 启动开发服务器（localhost:5173）
npm run build        # 构建生产版本
npm run test         # 运行测试
npm run test:watch   # 监听模式跑测试
npm run preview      # 预览生产构建
npx cap sync         # 同步到 Capacitor
npx cap open android # 打开 Android Studio
```

---

## 给 Claude 的指令

1. **先读这个文件**，理解项目全貌再动手
2. **每次只做一个功能**，做完跑通测试再继续
3. **不要引入额外依赖**，除非本文件明确列出或确实必要
4. **样式用 Tailwind className**，不要写单独的 CSS 文件（`index.css` 除外）
5. **组件用函数式写法**，不用 class 组件
6. **中文注释**，关键逻辑处加注释
7. **遇到不确定的需求**，停下来问，不要自己猜
8. **禁止使用 AI 生成的默认样式**，所有 UI 必须符合上面的设计规范
