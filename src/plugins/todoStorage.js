import { registerPlugin } from '@capacitor/core';

// Web 端 fallback：开发环境用 localStorage，与现有行为一致
const TodoStorage = registerPlugin('TodoStorage', {
  web: {
    load: async () => ({
      data: localStorage.getItem('todos') || '[]',
    }),
    save: async (options) => {
      localStorage.setItem('todos', options.data);
    },
    // Web 环境无需焦点标记，直接返回 false
    getAndClearFocusAdd: async () => ({ focus: false }),
  },
});

export default TodoStorage;
