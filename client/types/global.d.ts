// client/src/types/global.d.ts
import { ConfirmOptions } from '../utils/confirm';

export {}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    // 为 Vue 模板里的 $confirm 提供类型提示
    $confirm: (content: string, title?: string, options?: ConfirmOptions) => Promise<boolean>;
  }
}

declare global {
  interface Window {
    // 为 window.$confirm 提供类型提示
    $confirm: (content: string, title?: string, options?: ConfirmOptions) => Promise<boolean>;
  }
}