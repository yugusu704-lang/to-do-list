import { registerPlugin } from '@capacitor/core';

// ── IndexedDB helpers（仅用于 Web 开发环境 todos 数据存储） ──────────────────
const IDB_NAME = 'todo_app_db';
const IDB_VERSION = 1;
const IDB_STORE = 'todos_store';
const IDB_KEY = 'todos';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = (e) => resolve(e.target.result ?? null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// 一次性从 localStorage 迁移存量 todos 数据到 IndexedDB
async function migrateFromLocalStorage() {
  try {
    const existing = await idbGet(IDB_KEY);
    if (existing !== null) return; // 已迁移，跳过

    const legacy = localStorage.getItem('todos');
    if (legacy) {
      await idbSet(IDB_KEY, legacy);
      localStorage.removeItem('todos'); // 清理旧数据
    }
  } catch {
    // 静默处理，不阻断正常流程
  }
}

// ── Capacitor Plugin 注册 ────────────────────────────────────────────────────
const TodoStorage = registerPlugin('TodoStorage', {
  web: {
    load: async () => {
      await migrateFromLocalStorage();
      const data = await idbGet(IDB_KEY);
      return { data: data ?? '[]' };
    },
    save: async (options) => {
      await idbSet(IDB_KEY, options.data);
    },
    // Web 环境无需焦点标记，直接返回 false
    getAndClearFocusAdd: async () => ({ focus: false }),
    setThemeMode: async (options) => {
      localStorage.setItem('theme_mode', options.themeMode);
    },
    getThemeMode: async () => ({
      themeMode: localStorage.getItem('theme_mode') || 'system',
    }),
  },
});

export default TodoStorage;
