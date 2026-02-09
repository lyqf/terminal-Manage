import { reactive } from 'vue';

// 1. 定义类型接口
export type ConfirmType = 'info' | 'warning' | 'error';

export interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmState {
  visible: boolean;
  title: string;
  content: string;
  confirmText: string;
  cancelText: string;
  type: ConfirmType;
}

// 2. 定义响应式状态
const state = reactive<ConfirmState>({
  visible: false,
  title: '确认操作',
  content: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'warning'
});

// 3. 存储 Promise 的 resolve 函数
// resolve 的结果是 boolean (true=点击确定, false=点击取消)
let resolveFn: ((value: boolean) => void) | null = null;

/**
 * 核心方法：显示弹窗并返回 Promise<boolean>
 */
export const confirm = (
  content: string, 
  title: string = '确认操作', 
  options: ConfirmOptions = {}
): Promise<boolean> => {
  // 重置并赋值状态
  state.content = content;
  state.title = title;
  state.confirmText = options.confirmText || '确定';
  state.cancelText = options.cancelText || '取消';
  state.type = options.type || 'warning';
  state.visible = true;

  // 返回一个新的 Promise，让调用者 await
  return new Promise((resolve) => {
    resolveFn = resolve;
  });
};

/**
 * 内部方法：处理用户点击
 */
export const handleAction = (result: boolean) => {
  state.visible = false;
  if (resolveFn) {
    resolveFn(result); 
    resolveFn = null;  // 清理
  }
};

// 导出状态供组件渲染
export const useConfirmState = () => state;