# HANDOFF.md — 项目交接文档

> 生成时间：2026-07-30
> 开发环境：VS Code + Claude 插件
> 前期调试工具：Hermes Agent（已迁移至 VS Code）

---

## 一、项目概述

### 1.1 项目名称
**待办清单 (To-Do List)** — Android 桌面小组件待办应用

### 1.2 技术栈
| 层级 | 技术 |
|------|------|
| 前端框架 | React + Vite |
| 样式 | Tailwind CSS |
| 移动端框架 | Capacitor |
| 目标平台 | Android (API 26+) |
| 测试设备 | Xiaomi 14 (MIUI, Android 15) |
| 语言 | JavaScript (前端) + Java (Android 原生) |

### 1.3 仓库信息
- **GitHub**: https://github.com/yugusu704-lang/to-do-list
- **最新 Release**: v8（GitHub Releases 页面）
- **项目路径**: `D:\to-do-list`

### 1.4 核心功能
1. 待办任务 CRUD（创建、读取、更新、删除）
2. 任务支持：内容文字、截止时间（dueAt）、地点（location）
3. Android 桌面小组件（4×2 和 4×3 两种尺寸）
4. 小组件显示"今日待办"（只显示 dueAt 在今天的未完成任务）
5. 小组件内点击复选框可标记完成（完成后从小组件中移除）
6. SharedPreferences 统一数据源（Web 端 + 原生共享）

---

## 二、项目目录结构

```
D:\to-do-list\
├── CLAUDE.md                          # Claude 技术规范文档
├── DEVELOPMENT.md                     # 开发阶段指南（含 skill 方法论）
├── HANDOFF.md                         # 本文件 - 交接文档
├── package.json
├── vite.config.js                     # Vite 配置（含 base: './'）
├── capacitor.config.json              # Capacitor 配置
├── index.html                         # 入口 HTML
├── src/
│   ├── main.jsx                       # React 入口
│   ├── App.jsx                        # 主应用组件
│   ├── components/
│   │   ├── AddTodo.jsx                # 添加任务表单（含 DateButton）
│   │   ├── DateButton.jsx             # 日期选择器组件
│   │   ├── TodoList.jsx               # 任务列表
│   │   └── TodoItem.jsx               # 单条任务
│   ├── hooks/
│   │   └── useTodos.js                # 核心数据管理 Hook
│   ├── plugins/
│   │   └── todoStorage.js             # Capacitor 插件桥接
│   └── styles/
│       └── index.css                  # Tailwind CSS
├── android/
│   └── app/
│       ├── build.gradle               # Android 构建配置
│       └── src/main/
│           ├── AndroidManifest.xml    # 权限声明
│           ├── java/com/example/todolist/
│           │   ├── MainActivity.java
│           │   ├── TodoStoragePlugin.java  # SharedPreferences 读写插件
│           │   └── widget/
│           │       ├── TodoWidgetProvider.java      # 4×3 小组件 Provider
│           │       ├── TodoWidgetProviderLarge.java  # 4×2 小组件 Provider（继承自 4×3）
│           │       ├── TodoWidgetRefreshReceiver.java # 定时刷新广播
│           │       └── TodoWidgetHelper.java         # 辅助类
│           └── res/
│               ├── layout/
│               │   ├── widget_todo_4x2.xml    # 4×2 小组件布局
│               │   ├── widget_todo_4x3.xml    # 4×3 小组件布局
│               │   └── widget_task_item.xml   # 单条任务行布局
│               ├── drawable/
│               │   ├── widget_bg.xml          # 小组件背景
│               │   ├── ic_widget_add.xml      # 添加按钮图标
│               │   ├── ic_checkbox_checked.xml    # 已选中复选框（绿色圆+白色对勾）
│               │   ├── ic_checkbox_unchecked.xml  # 未选中复选框（空心圆）
│               │   ├── ic_check_white.xml         # 白色对勾矢量图
│               │   ├── ic_clock_12dp.xml          # 时钟图标
│               │   └── ic_location_12dp.xml       # 位置图标
│               ├── values/
│               │   ├── colors.xml             # 颜色定义
│               │   └── widget_colors.xml      # 小组件专用颜色
│               └── xml/
│                   └── todo_widget_info.xml   # 小组件元数据
├── skills/                            # 导出的 skill 文件（供 Claude 插件参考）
└── figma-reference/                   # Figma 设计参考文件
```

---

## 三、已解决的问题

### 3.1 APK 崩溃问题（v1-v6）

| 版本 | 问题 | 解决方案 |
|------|------|---------|
| v1-v3 | 缺少依赖/配置错误 | 修复 Capacitor 配置 |
| v4 | 插件注册方式错误 | 改用 `initialPlugins` 注册 |
| v5 | `colors.xml` 缺失 | 补充颜色资源文件 |
| v6 | WebView 加载失败 | 未解决（v7 修复路径问题） |

### 3.2 资源路径问题（v7）

**问题**: Vite 构建输出的资源路径为绝对路径 `/assets/xxx.js`，Capacitor 8 把文件放在 `assets/public/` 子目录，导致 WebView 找不到资源。

**解决**: 在 `vite.config.js` 中添加 `base: './'` 使用相对路径。

### 3.3 debuggable 启动卡死（v7）

**问题**: debug 版本默认 `debuggable = true`，导致小米设备启动时等待调试器。

**解决**: 在 `build.gradle` 的 `debug` buildType 中添加 `debuggable false`。

### 3.4 精确闹钟权限崩溃（v7）

**问题**: Android 12+ 要求 `SCHEDULE_EXACT_ALARM` 权限才能设置精确闹钟。

**解决**:
1. 在 `AndroidManifest.xml` 中添加权限声明
2. 在 `MainActivity.java` 中用 try-catch 保护 `scheduleNextAlarm()` 调用

### 3.5 小米 Launcher 小组件崩溃（v8）

**问题**: 小米桌面（MIUI Launcher）把标准 `CheckBox` 替换成了自己的 `HomeMIUIWidgetCheckBox`，不支持 RemoteViews 的 `setChecked()` 方法。

**解决**:
1. 将 `CheckBox` 改为 `ImageView`
2. 使用两个不同的 drawable 图片切换状态（`ic_checkbox_checked.xml` / `ic_checkbox_unchecked.xml`）
3. 在 Java 代码中用 `setImageViewResource()` 代替 `setBoolean("setChecked")`

### 3.6 refreshAllWidgets 访问权限（v8）

**问题**: `refreshAllWidgets()` 方法是 package-private，`TodoStoragePlugin` 在另一个包中无法访问。

**解决**: 改为 `public static`。

### 3.7 dueAt 解析问题（v8）

**问题**: Web 端 `datetime-local` 输入框返回 ISO 格式 `"2026-07-30T10:30"`（不带秒），Java 端解析格式不匹配。

**解决**: 支持两种格式：
- 不带秒: `"yyyy-MM-dd'T'HH:mm"`
- 带秒: `"yyyy-MM-dd'T'HH:mm:ss"`

### 3.8 小组件不显示任务（v8）

**问题**: `dueAt` 字段为 null 时任务被过滤掉。

**解决**: 如果没有设置 `dueAt`，使用 `createdAt` 作为默认值（注意：用户后来要求恢复为"没有时间的任务不显示"）。

---

## 四、当前状态（待修复）

### 4.1 小组件显示逻辑（核心待修复）

**用户最新要求**:
1. ✅ 小组件显示"今日待办"——只显示 dueAt 在今天的未完成任务
2. ✅ 每个任务显示：任务内容 + 时间 + 地点
3. ✅ 按时间顺序排列
4. ✅ 任务过多时可滑动显示
5. ✅ 完成后从小组件中移除
6. ❌ **没有时间标注的任务不要显示在小组件中**
7. ⚠️ 排版需要更美观清晰，字体需要更大更清晰

**当前问题**: 
- 用户创建了没有时间的任务，不应该显示在小组件中
- 需要确认：用户是否为任务设置了 dueAt（截止时间）？如果没设置，小组件会显示"今天没有待办任务"

### 4.2 小组件布局问题

当前 `widget_task_item.xml` 使用垂直布局（LinearLayout vertical），包含：
- 复选框（ImageView）
- 任务文字（16sp 加粗）
- 时间 + 地点行（13sp，带图标）

**待优化**:
- 排版间距可能需要调整
- 字体大小可能需要根据用户反馈微调

---

## 五、关键代码位置

### 5.1 数据模型

```javascript
// src/hooks/useTodos.js
const newTodo = {
  id: generateId(),           // 唯一 ID
  text: trimmed,              // 任务内容
  completed: false,           // 是否完成
  completedAt: null,          // 完成时间戳
  category: null,             // 分类（未使用）
  createdAt: Date.now(),      // 创建时间戳
  dueAt: dueAt || null,       // 截止时间（ISO 格式字符串 "2026-07-30T10:30" 或 null）
  location: location?.trim() || null,  // 地点
};
```

### 5.2 SharedPreferences 数据存储

```java
// TodoStoragePlugin.java
// 数据存储在: /data/data/com.example.todolist/shared_prefs/todo_prefs.xml
// Key: "todos_json"
// Value: JSON 数组字符串
```

### 5.3 小组件数据过滤逻辑

```java
// TodoWidgetProvider.java → loadTodayTodos()
// 过滤条件：
// 1. dueAt 存在且不为 null
// 2. dueAt 在今天 0:00 ~ 明天 0:00 之间
// 3. completed == false（未完成）
// 4. 如果 dueAt 为 null，使用 createdAt 作为默认值（待移除）
// 排序：按 dueAt 升序
```

### 5.4 小组件刷新机制

```java
// TodoWidgetRefreshReceiver.java
// 每日 0:00 定时刷新
// 调用: TodoWidgetProvider.refreshAllWidgets(context)
```

### 5.5 Capacitor 配置

```json
// capacitor.config.json
{
  "appId": "com.example.todolist",
  "appName": "待办清单",
  "webDir": "dist"
}
```

### 5.6 Vite 配置

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',  // 关键：使用相对路径，否则 Capacitor 8 找不到资源
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
});
```

### 5.7 Android 构建配置

```groovy
// android/app/build.gradle
android {
    buildTypes {
        debug {
            debuggable false  // 关键：避免小米设备启动卡死
        }
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 六、已知陷阱和注意事项

### 6.1 小米设备特殊处理

1. **CheckBox 不兼容**: 小米 Launcher 替换了标准 CheckBox，必须用 ImageView + drawable 切换
2. **debuggable 启动卡死**: debug 版本必须设置 `debuggable false`
3. **精确闹钟权限**: Android 12+ 需要 `SCHEDULE_EXACT_ALARM` 权限，且需要 try-catch 保护

### 6.2 Capacitor 8 路径问题

- Vite 构建输出路径为绝对路径 `/assets/xxx.js`
- Capacitor 8 把文件放在 `assets/public/` 子目录
- 必须在 `vite.config.js` 中设置 `base: './'`

### 6.3 RemoteViews 限制

- 只支持有限的控件类型（TextView, ImageView, Button, LinearLayout 等）
- 不支持自定义 View
- `addView()` 只能添加到 `LinearLayout` 容器
- 不支持 `setPadding()` 等部分方法

### 6.4 数据格式

- `dueAt` 在 Web 端存储为 ISO 格式字符串 `"2026-07-30T10:30"`
- `createdAt` 存储为时间戳数字 `1753881600000`
- SharedPreferences 中存储为 JSON 数组字符串

### 6.5 ADB 调试

```bash
# ADB 路径
C:\Users\long\AppData\Local\Android\Sdk\platform-tools\adb.exe

# 安装 APK
adb install -r D:\to-do-list\android\app\build\outputs\apk\debug\app-debug.apk

# 启动 App
adb shell am start -n com.example.todolist/.MainActivity

# 查看日志
adb logcat -d | grep -E "(com.example.todolist|FATAL|Exception)"

# 查看进程
adb shell ps | grep com.example.todolist
```

### 6.6 Gradle 构建

```bash
cd D:\to-do-list\android
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew assembleDebug
```

---

## 七、后续待办

### 7.1 立即修复

1. **移除 createdAt 默认值逻辑**: 没有时间的任务不应显示在小组件中
2. **确认用户数据**: 检查用户是否为任务设置了 dueAt
3. **排版优化**: 根据用户反馈调整字体大小和间距

### 7.2 功能完善

1. **滑动显示**: 当前使用 `LinearLayout` + `addView()`，如果任务过多可能需要改用 `ListView`（RemoteViews 支持）
2. **小组件点击交互**: 点击小组件空白区域打开 App
3. **小组件刷新**: 每日 0:00 自动刷新（已实现，待验证）

### 7.3 代码质量

1. **单元测试**: 使用 Vitest 编写前端测试
2. **代码审查**: 检查安全性和性能
3. **文档完善**: 更新 README.md

---

## 八、构建和部署流程

### 8.1 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建前端
npm run build

# 复制到 Android 项目
npx cap copy android
```

### 8.2 Android 构建

```bash
cd android
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew assembleDebug
```

### 8.3 部署到设备

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.example.todolist/.MainActivity
```

### 8.4 发布到 GitHub

```bash
# 提交更改
git add -A
git commit -m "fix: 描述"
git push origin master

# 创建 Release
gh release create v9 app-v9.apk --title "v9 - 标题" --notes "发布说明"
```

---

## 九、参考文档

### 9.1 项目内文档

- `CLAUDE.md`: Claude 技术规范
- `DEVELOPMENT.md`: 开发阶段指南（含 skill 方法论）
- `skills/`: 导出的 skill 文件（11 个）

### 9.2 外部参考

- [Capacitor 文档](https://capacitorjs.com/docs)
- [Android App Widgets](https://developer.android.com/develop/ui/views/appwidgets)
- [RemoteViews](https://developer.android.com/reference/android/widget/RemoteViews)
- [Vite 配置](https://vitejs.dev/config/)

---

## 十、联系方式

- **GitHub**: yugusu704-lang
- **项目仓库**: https://github.com/yugusu704-lang/to-do-list

---

**注意**: 本文档由 Hermes Agent 自动生成，用于在 VS Code + Claude 插件中继续开发。如有疑问，请参考项目内文档或外部参考链接。
