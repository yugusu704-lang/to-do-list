# To-Do List App — 分阶段开发指南

> 本文档是 CLAUDE.md 的配套文件，按阶段拆解开发任务。
> 每个阶段标注了所需的 Skill 及其方法论，Claude 应按顺序执行，每完成一个阶段再进入下一个。

---

## Skill × 阶段对照表

> 以下 Skill 需提前安装到 Claude 中（VS Code Claude 插件 → Skills 面板）。
> 来源：[mattpocock/skills](https://github.com/mattpocock/skills) + Hermes 内置 skill。

| Skill 名称 | 所属阶段 | 一句话说明 |
|------------|---------|-----------|
| `grill-me` | 阶段 0 | 入口触发器，用户说"grill me"时启动持续追问 |
| `grilling` | 阶段 0 | 逐条追问决策点，等确认后再继续，不猜不跳 |
| `plan` | 阶段 1 | 只写计划不写代码，输出可执行的 markdown 任务清单 |
| `sketch` | 阶段 2 | 纯 HTML 快速出 2-3 个页面原型变体，浏览器直接对比 |
| `claude-code` | 阶段 3、4 | 委派编码任务，写组件、跑命令、处理依赖 |
| `test-driven-development` | 阶段 4 | 强制 RED→GREEN→REFACTOR，先写测试再写功能 |
| `design-taste-frontend` | 阶段 5 | 反模板化设计，审查并消除"AI 默认脸" |
| `minimalist-ui` | 阶段 5 | 极简设计系统：暖白背景、扁平网格、无渐变无重阴影 |
| `systematic-debugging` | 阶段 6 | 4 阶段根因调试：复现→定位→根因→修复 |
| `requesting-code-review` | 阶段 7 | 提交前全面审查：安全扫描 + 质量检查 + 性能检查 |
| `external-skill-installation` | 阶段 8 | 手动安装依赖并逐步验证，确保每步可控可回溯 |

---

## 阶段总览

```
阶段 0  需求澄清          ← grill-me, grilling
阶段 1  开发计划          ← plan
阶段 2  UI 原型           ← sketch
阶段 3  项目初始化        ← claude-code
阶段 4  核心功能开发      ← claude-code, test-driven-development
阶段 5  UI 打磨          ← design-taste-frontend, minimalist-ui
阶段 6  调试与修复        ← systematic-debugging
阶段 7  代码审查          ← requesting-code-review
阶段 8  Capacitor 打包   ← external-skill-installation
```

---

## 阶段 0：需求澄清

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`grill-me`** | 入口触发器，当你说"grill me"时激活，自动调用 `grilling` |
| **`grilling`** | 核心方法：逐条追问，沿决策树每个分支走下去，逐个解决依赖关系。每个问题给出推荐答案，等你确认后再继续下一个。事实性问题自己查证，决策性问题必须问你。在双方达成共识之前不采取任何行动。 |

**目标**：在动手之前，把"做一个 to-do app"这个模糊想法锤成精确需求。

### 操作步骤

1. 对 Claude 说：`grill me — 我想做一个 to-do list 安卓 app`
2. Claude 会逐条追问以下决策点：

| 决策点 | 需要回答 |
|--------|-----------|
| 数据存在哪 | localStorage（离线）还是云端同步？ |
| 任务是否分类 | 简单列表 vs 分类/标签？ |
| 是否需要提醒 | 截止日期？本地通知？ |
| 删除方式 | 左滑？长按？点击 X？点击显示删除（tap-to-reveal）？ |
| 完成效果 | 划线？变灰？移到底部？ |
| 筛选方式 | Tab 切换？下拉筛选？ |
| 首次使用体验 | 引导页？直接进列表？ |

3. 每次只问一个问题，给出推荐答案，等你确认后继续下一个
4. 如果某个事实可以通过查看文件系统或工具确认，Claude 会自己查而不是问你
5. 所有决策确认后，输出一份**需求确认书**，存为 `docs/requirements.md`

### 产出物
```
D:\to-do-list\docs\requirements.md    # 需求确认书
```

### 阶段完成标志
- [ ] 需求确认书已写入文件
- [ ] 功能边界清晰（做什么、不做什么）
- [ ] 无未决问题

---

## 阶段 1：开发计划

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`plan`** | 只写计划不写代码。把需求拆成可执行的 markdown 计划，每个任务必须是"下一步就能做"的粒度，包含具体文件路径和代码方向。 |

**目标**：把需求拆成可执行的开发任务，明确文件结构和技术方案。

### 操作步骤

1. 对 Claude 说：`加载 plan skill，基于 docs/requirements.md 写一份开发计划`
2. Claude 会输出一份 markdown 计划，包含：
   - 任务拆解（按优先级 P0/P1/P2）
   - 文件结构图
   - 组件层级关系
   - 每个任务的预估步骤
3. 计划写完后你审阅确认，再进入下一阶段

### 产出物
```
D:\to-do-list\docs\plan.md    # 开发计划
```

### 阶段完成标志
- [ ] 计划文件已生成
- [ ] 每个任务都是"下一步就能做"的粒度
- [ ] 任务顺序合理（先数据层 → 再 UI → 再打包）

---

## 阶段 2：UI 原型

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`sketch`** | 不写业务代码，只用纯 HTML 快速生成 2-3 个完整页面的布局变体，每个变体是一个独立的 HTML 文件，可直接在浏览器中打开预览。目的是在写代码之前确定视觉方向，避免边写边改。 |

**目标**：不写代码，先用 HTML 快速做出 2-3 个布局变体，选定一个方向。

### 操作步骤

1. 对 Claude 说：`加载 sketch skill，帮我做 3 个 to-do app 的 UI 原型变体`
2. Claude 会生成 3 个独立的 HTML 文件，每个是一个完整页面
3. 在浏览器中打开对比，选定最喜欢的布局

### 设计方向参考

| 变体 | 风格 | 特点 |
|------|------|------|
| A | 经典列表 | 底部输入栏，任务卡片，圆角卡片 |
| B | 极简编辑 | 无卡片，纯文字列表，靠间距和颜色区分 |
| C | 卡片分组 | 按状态分组（进行中 / 已完成），每个组一个区块 |

### 产出物
```
D:\to-do-list\prototypes\variant-a.html
D:\to-do-list\prototypes\variant-b.html
D:\to-do-list\prototypes\variant-c.html
```

### 阶段完成标志
- [ ] 3 个原型文件可浏览器打开预览
- [ ] 已选定一个方向（或融合多个方案的元素）
- [ ] 布局、配色、交互方式基本确定

---

## 阶段 3：项目初始化

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`claude-code`** | 委派编码任务给 Claude，让它执行终端命令、写配置文件、安装依赖。 |

**目标**：搭建 React + Vite + Tailwind 项目骨架。

### 操作步骤

1. 对 Claude 说：`加载 claude-code skill，初始化一个 React + Vite + Tailwind v4 项目`
2. Claude 执行初始化命令并配置

### 初始化命令（参考）
```bash
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss @tailwindcss/vite \
  vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 需要检查的配置项

| 文件 | 检查点 |
|------|--------|
| `vite.config.js` | 确认 Tailwind v4 插件（`@tailwindcss/vite`）已配置，`test.environment` 设为 `jsdom` |
| `src/styles/index.css` | 确认 `@import "tailwindcss"` 和 `@theme` 颜色定义已添加 |
| `src/App.jsx` | 确认是干净的起始组件（删掉默认 logo 和计数器） |
| `index.html` | 确认 title 改为 "To-Do List" |

### 产出物
```
D:\to-do-list\          # 可运行的项目骨架
npm run dev 能正常启动    # localhost:5173 可访问
```

### 阶段完成标志
- [ ] `npm run dev` 无报错
- [ ] 浏览器打开 localhost:5173 显示空白页面（无 Vite 默认内容）
- [ ] Tailwind 类名生效（随便加个 `className="text-red-500"` 验证）

---

## 阶段 4：核心功能开发

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`claude-code`** | 委派编码任务，写组件、写 Hook、跑测试命令 |
| **`test-driven-development`** | 强制 RED → GREEN → REFACTOR 循环：先写一个失败的测试（RED），再写刚好让测试通过的最少代码（GREEN），最后重构优化但不改行为（REFACTOR）。不允许跳过测试直接写功能代码。 |

**目标**：实现 P0 功能，全程 TDD。

### 开发顺序

每个功能严格遵循 RED → GREEN → REFACTOR：

#### 4.1 数据层：useTodos Hook
```
测试先行：
  ✗ 添加任务
  ✗ 切换完成状态
  ✗ 删除任务
  ✗ 筛选（全部/进行中/已完成）
  ✗ localStorage 读写

实现：
  src/hooks/useTodos.js
  src/hooks/__tests__/useTodos.test.js
```

#### 4.2 组件层：自下而上
```
先做原子组件，再组合：

1. TodoItem.jsx       ← 单个任务项（显示、切换、tap-to-reveal 删除）
   测试：渲染文字、点击触发回调、完成态样式、hover/点击显示删除按钮

2. TodoList.jsx       ← 任务列表（map 渲染）
   测试：传入数组渲染对应数量、空数组显示空态

3. AddTodo.jsx        ← 输入框 + 提交
   测试：输入后回车调用回调、空输入不提交

4. FilterTabs.jsx     ← 筛选标签
   测试：点击切换高亮、触发筛选回调

5. App.jsx            ← 组装所有组件
   测试：端到端流程（添加 → 完成 → 删除 → 筛选）
```

#### 4.3 样式层：先功能后美化
```
此阶段只加最小样式保证可用：
  - 任务项有基本间距
  - 完成状态有划线
  - 输入框有基本边框
  - 不追求完美，阶段 5 再打磨
```

### 运行测试
```bash
npm run test          # 单次运行
npm run test:watch    # 监听模式（推荐开发时用）
```

### 阶段完成标志
- [ ] 所有 P0 功能可用（添加、完成、删除、筛选、持久化）
- [ ] 所有测试通过（`npm run test` 零失败）
- [ ] 手动测试无明显 bug
- [ ] 页面基础可用，不需要好看但能用

---

## 阶段 5：UI 打磨

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`design-taste-frontend`** | 反模板化设计：先审阅当前 UI，识别"AI 默认脸"（对称布局、均匀间距、千篇一律的卡片），然后用真实设计系统的原则重新设计——强调排版层级、留白节奏、色彩节制。 |
| **`minimalist-ui`** | 极简设计系统：暖色调单色系、字体对比、扁平 bento 网格、柔和粉彩。不用渐变、不用重阴影。所有元素遵循统一的间距和圆角规范。 |

**目标**：把"能用但丑"的界面变成"好看且好用"。

### 操作步骤

1. 对 Claude 说：`加载 design-taste-frontend 和 minimalist-ui skill，帮我打磨当前 UI`
2. Claude 会先审阅现有界面，再按设计规范逐项改进

### 打磨清单

| 区域 | 改进项 | 来源 Skill |
|------|--------|-----------|
| 整体 | 背景色换成暖白 #FAFAF9 | `minimalist-ui` |
| 顶部 | 标题用 20px semibold，加剩余计数 | `design-taste-frontend` |
| 任务项 | 圆圈用 20px 边框圆，点击动画 0.2s | `minimalist-ui` |
| 完成态 | 文字变灰 #D4D4D4 + 划线 transition | `minimalist-ui` |
| 输入框 | 底部固定，圆角 8px，阴影 subtle | `design-taste-frontend` |
| 筛选栏 | Tab 切换，选中态用主色底线 | `minimalist-ui` |
| 空状态 | 居中文字"还没有任务，添加一个吧" | `design-taste-frontend` |
| 删除 | 点击任务显示右侧红色删除按钮，0.15s 淡入 | `minimalist-ui` |

### 动效实现（纯 CSS，不引入动画库）
```css
/* 任务完成过渡 */
.todo-item { transition: all 0.2s ease-out; }
.todo-item.completed { color: #D4D4D4; text-decoration: line-through; }

/* 删除按钮淡入（tap-to-reveal） */
.todo-item .delete-btn { opacity: 0; width: 0; overflow: hidden; transition: all 0.15s ease-out; }
.todo-item:hover .delete-btn,
.todo-item.show-delete .delete-btn { opacity: 1; width: 28px; }

/* 新增淡入 */
.todo-item.new { animation: fadeInUp 0.2s ease-out; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } }
```

### 审美红线（禁止出现）
- ❌ 所有卡片长得一模一样
- ❌ 标题和正文没有字号/字重区分
- ❌ 整页只有一种灰（#f5f5f5）
- ❌ 渐变按钮、发光阴影、彩色背景
- ❌ 居中对齐一切

### 阶段完成标志
- [ ] UI 符合 CLAUDE.md 中的设计规范
- [ ] 无渐变、无重阴影、无花哨装饰
- [ ] 所有动效流畅不卡顿
- [ ] 在手机尺寸（375px 宽）下布局正常
- [ ] 肉眼看起来不像"AI 默认模板"

---

## 阶段 6：调试与修复

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`systematic-debugging`** | 遇到 bug 时禁止直接改代码。必须按 4 个阶段走：① 复现——写出最小触发步骤；② 定位——读报错、加断点、确认变量在哪一步偏离预期，读代码而不是猜；③ 根因——区分表面症状和根本原因，追问"为什么"直到源头；④ 修复——最小改动，跑测试确认无回归。 |

**目标**：系统性排查所有已知和潜在问题。

### 操作步骤

1. 对 Claude 说：`加载 systematic-debugging skill，帮我排查项目中的问题`
2. Claude 会按 4 阶段逐一排查

### 常见检查项

| 类别 | 检查点 |
|------|--------|
| 数据 | localStorage 满了怎么办？隐私模式下会报错吗？ |
| 边界 | 任务文字超长会溢出吗？空输入能提交吗？ |
| 状态 | 快速连续点击会出问题吗？筛选状态下删除会怎样？ |
| 兼容 | 安卓 WebView 下 CSS 动效正常吗？ |

### 调试记录模板

每次修 bug 都记录：
```markdown
## Bug #N：[简短标题]
- **复现步骤**：1. ... 2. ... 3. ...
- **表面症状**：...
- **根本原因**：...
- **修复方案**：...
- **回归测试**：写了什么测试防止再次出现
```

### 产出物
```
D:\to-do-list\docs\bug-log.md    # 已发现并修复的 bug 记录
```

### 阶段完成标志
- [ ] 所有已知 bug 已修复
- [ ] 边界情况已处理（空输入、超长文字、快速点击）
- [ ] 测试覆盖了修复的 bug（回归测试）
- [ ] bug-log.md 已记录

---

## 阶段 7：代码审查

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`requesting-code-review`** | 在提交代码前，对整个项目进行全面审查：安全扫描、质量检查、性能检查。列出所有问题并分级（严重/建议/可接受），逐一修复后再提交。 |

**目标**：提交前最终质量把关。

### 操作步骤

1. 对 Claude 说：`加载 requesting-code-review skill，审查当前项目`
2. Claude 会按以下维度逐项检查

### 检查清单

#### 安全性
- [ ] 无 `dangerouslySetInnerHTML`
- [ ] 无硬编码的敏感信息
- [ ] localStorage 数据有 try-catch 保护

#### 代码质量
- [ ] 无 `console.log` 残留
- [ ] 组件不超过 150 行
- [ ] 函数不超过 30 行
- [ ] 无未使用的变量和 import
- [ ] props 命名清晰（不用 `data`、`item`）

#### 测试
- [ ] 核心逻辑测试覆盖 100%
- [ ] 所有测试通过
- [ ] 无 skipped/pending 测试

#### 性能
- [ ] 无不必要的 re-render（React.memo 或 useMemo 如需要）
- [ ] 列表无 key 重复
- [ ] 无内存泄漏（useEffect 清理函数）

### 阶段完成标志
- [ ] 审查零严重问题
- [ ] 所有建议项已处理或明确标记为"可接受"
- [ ] 代码可以交付

---

## 阶段 8：Capacitor 打包

### 🔧 使用 Skill

| Skill | 作用 |
|-------|------|
| **`external-skill-installation`** | 安装每个依赖后立即验证是否生效，不一次性装完再测。遇到问题时手动 clone/配置而不是依赖自动化工具，确保每一步都可控可回溯。 |

**目标**：将 Web 应用打包为 Android APK。

### 前置条件
- [ ] Android Studio 已安装
- [ ] JDK 17 已安装
- [ ] Android SDK 已配置

### 操作步骤（每步验证）

```bash
# 第 1 步：构建生产版本（验证 dist/ 目录生成）
npm run build

# 第 2 步：安装 Capacitor 核心（验证 package.json 有依赖）
npm install @capacitor/core @capacitor/cli

# 第 3 步：初始化（验证 capacitor.config.js 生成）
npx cap init "Todo List" "com.example.todolist" --web-dir dist

# 第 4 步：添加 Android 平台（验证 android/ 目录生成）
npx cap add android

# 第 5 步：同步（验证 android/app/src/main/assets/public/ 有内容）
npx cap sync

# 第 6 步：打开 Android Studio
npx cap open android

# 第 7 步：在 Android Studio 中
#   Build → Build Bundle(s) / APK(s) → Build APK(s)
#   生成路径：android/app/build/outputs/apk/debug/app-debug.apk
```

### Capacitor 配置文件

```javascript
// capacitor.config.js
const config = {
  appId: 'com.example.todolist',
  appName: 'Todo List',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
```

### 后续迭代流程
```bash
# 每次改完代码后
npm run build && npx cap sync

# 如需原生功能（如通知）
npm install @capacitor/local-notifications
npx cap sync
```

### 常见问题排查
| 问题 | 排查方式 |
|------|---------|
| `cap sync` 报错 | 检查 `dist/` 目录是否存在，先 `npm run build` |
| Android Studio 打不开 | 检查 JAVA_HOME 环境变量是否指向 JDK 17 |
| APK 安装后白屏 | 检查 `capacitor.config.js` 的 `webDir` 是否为 `dist` |
| 样式在手机上异常 | 用 Chrome DevTools 远程调试安卓 WebView |

### 阶段完成标志
- [ ] APK 文件生成成功
- [ ] APK 安装到手机/模拟器后可正常运行
- [ ] 所有功能在安卓上正常工作
- [ ] 触摸交互（点击删除等）在真机上流畅

---

## 快速参考：每阶段的 Skill 加载指令

在 VS Code 中对 Claude 说：

| 阶段 | 指令 |
|------|------|
| 0 | `grill me — 我想做一个 to-do list 安卓 app` |
| 1 | `加载 plan skill，基于 docs/requirements.md 写开发计划` |
| 2 | `加载 sketch skill，做 3 个 to-do app 的 UI 原型` |
| 3 | `加载 claude-code skill，初始化 React + Vite + Tailwind 项目` |
| 4 | `加载 claude-code 和 test-driven-development skill，开始核心功能开发` |
| 5 | `加载 design-taste-frontend 和 minimalist-ui skill，打磨 UI` |
| 6 | `加载 systematic-debugging skill，排查项目问题` |
| 7 | `加载 requesting-code-review skill，审查代码` |
| 8 | `加载 external-skill-installation skill，打包安卓 APK` |

---

## 进度追踪

在每个阶段完成后，在下方打勾：

- [x] 阶段 0：需求澄清（`grill-me`, `grilling`）
- [x] 阶段 1：开发计划（`plan`）
- [x] 阶段 2：UI 原型（`sketch`）
- [x] 阶段 3：项目初始化（`claude-code`）
- [x] 阶段 4：核心功能开发（`claude-code`, `test-driven-development`）
- [x] 阶段 5：UI 打磨（`design-taste-frontend`, `minimalist-ui`）
- [x] 阶段 6：调试与修复（`systematic-debugging`）
- [x] 阶段 7：代码审查（`requesting-code-review`）
- [x] 阶段 8：Capacitor 打包（`external-skill-installation`）
