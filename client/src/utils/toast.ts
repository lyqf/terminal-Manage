import { reactive } from 'vue';

// 消息队列状态
const state = reactive({
  messages: [] as Array<any>
});

let idCounter = 0;

/**
 * 移除消息
 * @param {number} id 
 */
const remove = (id: number) => {
  const index = state.messages.findIndex(m => m.id === id);
  if (index !== -1) {
    state.messages.splice(index, 1);
  }
};

/**
 * 添加消息
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {string} content 
 * @param {number} duration 
 */
const add = (type: string, content: string, duration = 3000) => {
  const id = idCounter++;
  const message = { id, type, content };
  
  state.messages.push(message);

  if (duration > 0) {
    setTimeout(() => {
      remove(id);
    }, duration);
  }
};

// 导出给组件使用的状态
export const useToastState = () => state;

// 导出给业务调用的 API
export const toast = {
  success: (msg: string, duration: number) => add('success', msg, duration),
  error: (msg: string, duration: number) => add('error', msg, duration),
  info: (msg: string, duration: number) => add('info', msg, duration),
  warning: (msg: string, duration: number) => add('warning', msg, duration)
};