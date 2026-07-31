# HANDOFF.md — 项目交接文档

> 生成时间：2026-07-31（v14 更新）
> 开发环境：VS Code + Claude 插件
> 测试设备：Xiaomi 14 (MIUI, Android 15, API 34+)

---

## 一、项目概述

### 1.1 项目名称
**待办清单 (To-Do List)** — Android 桌面小组件待办应用

### 1.2 技术栈
| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + Vite | React 18+ / Vite 8.x |
| 样式 | Tailwind CSS | v4 |
| 移动端框架 | Capacitor | 8.4.2 |
| 目标平台 | Android (API 34+) | Android 14+ |
| 测试设备 | Xiaomi 14 (MIUI, Android 15) | — |
| 语言 | JavaScript (前端) + Java (Android 原生) | JDK 17 |

### 1.3 仓库信息
- **GitHub**: https://github.com/yugusu704-lang/to-do-list
- **最新 Release**: v14（GitHub Releases 页面）
- **项目路径**: `D:\to-do-list`
- **当前分支**: `master`

### 1.4 核心功能
1. 待办任务 CRUD（创建、读取、更新、删除）
2. 任务支持：内容文字、截止时间（dueAt）、地点（location）
3. Android 桌面小组件（4×2 和 4×3 两种尺寸）
4. 小组件显示"今日待办"（只显示 dueAt 在今天的未完成任务）
5. 小组件支持**垂直滚动浏览**（v12 新增，ListView + RemoteViewsService）
6. 小组件内点击复选框可标记完成（完成后从小组件中移除）
7. SharedPreferences 统一数据源（Web 端 + 原生共享）
8. 按日期分组显示（今天/明天/后天/具体日期/已过期）
9. 自动清理 30 天以上已完成任务

---

## 二、项目目录结构

```
D:\to-do-list\
├── CLAUDE.md                          # Claude 技术规范文档
├── DEVELOPMENT.md                     # 开发阶段指南
├── HANDOFF.md                         # 本文件 - 交接文档
├── package.json
├── vite.config.js                     # Vite 配置（含 base: './'）
├── capacitor.config.json              # Capacitor 配置
├── index.html                         # 入口 HTML
├── src/
│   ├── main.jsx                       # React 入口
│   ├── App.jsx                        # 主应用组件（生命周期、数据同步）
│   ├── components/
│   │   ├── AddTodo.jsx                # 添加任务表单（含 DateButton）
│   │   ├── DateButton.jsx             # 日期选择器组件
│   │   ├── FilterTabs.jsx             # 筛选标签（全部/进行中/已完成）
│   │   ├── EmptyState.jsx             # 空状态占位
│   │   ├── TodoList.jsx               # 任务列表（按日期分组）
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
│           ├── AndroidManifest.xml    # 权限声明 + Service 注册
│           ├── java/com/example/todolist/
│           │   ├── MainActivity.java
│           │   ├── TodoStoragePlugin.java  # SharedPreferences 读写插件
│           │   └── widget/
│           │       ├── TodoWidgetProvider.java         # 4x2 小组件 Provider
│           │       ├── TodoWidgetProviderLarge.java     # 4x3 小组件 Provider（子类）
│           │       ├── TodoWidgetViewsFactory.java      # ListView 数据适配器（v12 新增）
│           │       ├── TodoWidgetViewsService.java      # RemoteViewsService（v12 新增）
│           │       └── TodoWidgetRefreshReceiver.java   # 定时刷新广播
│           └── res/
│               ├── layout/
│               │   ├── widget_todo_4x2.xml    # 4x2 小组件布局（ListView）
│               │   ├── widget_todo_4x3.xml    # 4x3 小组件布局（ListView）
│               │   └── widget_task_item.xml   # 单条任务行布局
│               ├── drawable/
│               │   ├── widget_bg.xml          # 小组件背景
│               │   ├── ic_widget_add.xml      # 添加按钮图标
│               │   ├── ic_checkbox_checked.xml    # 已选中复选框
│               │   ├── ic_checkbox_unchecked.xml  # 未选中复选框
│               │   ├── ic_clock_12dp.xml          # 时钟图标
│               │   └── ic_location_12dp.xml       # 位置图标
│               ├── values/
│               │   └── widget_colors.xml      # 小组件颜色（含深色模式）
│               └── xml/
│                   ├── widget_todo_4x2_info.xml
│                   └── widget_todo_4x3_info.xml
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

### 3.9 小组件无法滚动（v12）

**问题**: 小组件使用 `LinearLayout` + `addView()` 显示任务，无法滚动，超出可视区域的任务被直接裁切。

**解决**:
1. 将 `LinearLayout` 替换为 `ListView`
2. 新增 `TodoWidgetViewsFactory`（RemoteViewsFactory 实现）
3. 新增 `TodoWidgetViewsService`（RemoteViewsService）
4. Provider 改用 `setRemoteAdapter()` 绑定 ListView

### 3.10 小组件 checkbox 点击失效（v12）

**问题**: ListView 中的 `setOnClickPendingIntent` 不可靠，点击无响应。

**解决**: 改用 `setPendingIntentTemplate` + `setFillInIntent` 标准模式：
- Provider 设置模板 PendingIntent（显式 Intent + FLAG_IMMUTABLE）
- Factory 通过 `setOnClickFillInIntent` 携带 todo_id

### 3.11 Android 14+ PendingIntent 崩溃（v12）

**问题**: `setPendingIntentTemplate` 使用隐式 Intent + `FLAG_MUTABLE`，Android 14（API 34）禁止此组合，导致崩溃。崩溃发生在 `TodoStoragePlugin.save()` → `refreshAllWidgets()` → `updateWidget()` 时，每次保存数据都会崩溃。

**解决**:
1. 改为**显式 Intent**（设置 ComponentName + Package）
2. 使用 `FLAG_IMMUTABLE` 替代 `FLAG_MUTABLE`

---

## 四、当前状态（v12）

### 4.1 已完成的功能

| 功能 | 状态 |
|------|------|
| 任务 CRUD | ✅ 完成 |
| 数据持久化（SharedPreferences） | ✅ 完成 |
| 桌面小组件（4x2 + 4x3） | ✅ 完成 |
| 小组件滚动浏览 | ✅ 完成（v12） |
| 小组件 checkbox 标记完成 | ✅ 完成（v12 修复） |
| 小组件每日午夜刷新 | ✅ 完成 |
| 按日期分组显示 | ✅ 完成 |
| 自动清理 30 天以上已完成任务 | ✅ 完成 |
| Android 14+ 兼容性 | ✅ 完成（v12 修复） |

### 4.2 待优化

- 小组件排版可能需要根据用户反馈微调
- 深色模式适配（小组件已支持，App 侧待实现）
- 拖拽排序任务
- 正式发布签名配置（keystore）

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
// TodoWidgetViewsFactory.java → loadTodayTodos()（同逻辑）
// 过滤条件：
// 1. dueAt 存在且不为 null
// 2. dueAt 在今天 0:00 ~ 明天 0:00 之间
// 3. completed == false（未完成）
// 排序：按 dueAt 升序
```

### 5.4 小组件架构（v12）

```
TodoWidgetProvider.updateWidget()
  → setRemoteAdapter(R.id.widget_task_container, serviceIntent)  // 绑定 ListView
  → setPendingIntentTemplate(...)                                 // 点击模板（显式 Intent）
  → notifyAppWidgetViewDataChanged()                              // 触发数据刷新

TodoWidgetViewsService.onGetViewFactory()
  → 返回 TodoWidgetViewsFactory 实例

TodoWidgetViewsFactory.getViewAt(position)
  → 创建 RemoteViews（widget_task_item.xml）
  → setOnClickFillInIntent(root, intent)  // 携带 todo_id
```

### 5.5 小组件刷新机制

```java
// TodoWidgetRefreshReceiver.java
// 每日 0:00 定时刷新（AlarmManager.setExactAndAllowWhileIdle）
// 调用: TodoWidgetProvider.refreshAllWidgets(context)
```

### 5.6 Vite 配置（重要）

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',  // 关键：使用相对路径，否则 Capacitor 8 找不到资源
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

### 6.3 Android 14+ PendingIntent 限制（v12 新增）

- **禁止**: 隐式 Intent + `FLAG_MUTABLE`
- **必须**: 显式 Intent（设置 ComponentName + Package）+ `FLAG_IMMUTABLE`
- 崩溃发生在 `PendingIntent.getBroadcast()` 调用处

### 6.4 ListView + RemoteViewsFactory 注意事项

- `setOnClickPendingIntent` 在 ListView 行中**不可靠**
- **必须**使用 `setPendingIntentTemplate` + `setFillInIntent` 模式
- `setFillInIntent` 需要目标视图设置 `focusable="true"` 和 `clickable="true"`
- 根视图需要有 `android:id`（如 `widget_task_item_root`）

### 6.5 数据格式

- `dueAt` 在 Web 端存储为 ISO 格式字符串 `"2026-07-30T10:30"`
- `createdAt` 存储为时间戳数字 `1753881600000`
- SharedPreferences 中存储为 JSON 数组字符串

### 6.6 ADB 调试

```bash
# ADB 路径
C:\Users\long\AppData\Local\Android\Sdk\platform-tools\adb.exe

# 安装 APK
adb install -r D:\to-do-list\android\app\build\outputs\apk\debug\app-debug.apk

# 启动 App
adb shell am start -n com.example.todolist/.MainActivity

# 查看崩溃日志
adb logcat -d | grep -E "(FATAL|AndroidRuntime|Exception)" | grep -v "libsensor"

# 查看进程
adb shell pidof com.example.todolist
```

### 6.7 Gradle 构建

```bash
cd D:\to-do-list\android
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew assembleDebug
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew installDebug
```

---

## 七、后续待办

### 7.1 功能完善

1. **拖拽排序**: 可考虑 dnd-kit 或 react-beautiful-dnd
2. **小部件点击交互**: 点击任务行打开 App 对应任务
3. **深色模式**: App 侧适配（小部件已支持 widget_colors.xml 深色模式）
4. ~~**正式发布签名**~~: ✅ 已在 v14 完成（统一签名，升级不丢数据）

### 7.2 代码质量

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
```

### 8.2 Android 构建

```bash
# 同步 Web 资源到 Android
npx cap sync

# 构建 debug APK
cd android
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew assembleDebug
```

### 8.3 部署到设备

```bash
# 安装
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 启动
adb shell am start -n com.example.todolist/.MainActivity
```

### 8.4 发布到 GitHub

> ⚠️ **签名密钥约定（v14 起强制）**
> - 密钥文件：`android/keystore/release.keystore`（**不提交 Git**，公开仓库严禁泄露！）
> - 所有 debug/release 构建均使用该密钥签名 → 覆盖安装保留数据
> - **换电脑开发时，必须手动拷贝该密钥文件**，否则新签名会导致升级丢数据
> - **请自行备份密钥**到网盘/安全位置（密钥丢失 = 无法升级旧版本）
> - 密钥信息：默认 Android Debug 证书（alias: `androiddebugkey`，口令 `android`，来源 `C:\Users\long\.android\debug.keystore`）

```bash
# 提交更改
git add -A
git commit -m "feat: 描述"
git push origin master

# 构建正式签名 release APK
cd android
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew assembleRelease

# 创建 Release（必须上传 release APK，勿用 debug 目录产物）
gh release create vXX android/app/build/outputs/apk/release/app-release.apk \
  --title "vXX - 标题" \
  --notes "发布说明"
```

### 8.5 升级保留数据验证（每次发布前必做）

```bash
# 1. 手机已装旧版且有任务数据 → 覆盖安装新版
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 2. 打开 App 确认任务数据完整保留
adb shell am start -n com.example.todolist/.MainActivity
```

---

## 九、参考文档

### 9.1 项目内文档

- `CLAUDE.md`: Claude 技术规范（设计规范、TDD 流程、调试规范）
- `DEVELOPMENT.md`: 开发阶段指南

### 9.2 外部参考

- [Capacitor 文档](https://capacitorjs.com/docs)
- [Android App Widgets](https://developer.android.com/develop/ui/views/appwidgets)
- [RemoteViews](https://developer.android.com/reference/android/widget/RemoteViews)
- [RemoteViewsService](https://developer.android.com/reference/android/widget/RemoteViewsService)
- [Vite 配置](https://vitejs.dev/config/)

---

## 十、联系方式

- **GitHub**: yugusu704-lang
- **项目仓库**: https://github.com/yugusu704-lang/to-do-list

---

**注意**: 本文档用于在 VSCode Cline 插件中接手开发。如有疑问，请参考项目内文档或外部参考链接。
