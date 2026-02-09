<template>
  <div class="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
    
    <TransitionGroup name="toast">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-md min-w-[300px] max-w-[90vw]"
        :class="getStyle(msg.type)"
      >
        <span class="flex-shrink-0 text-lg">
          <svg v-if="msg.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <svg v-else-if="msg.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          <svg v-else-if="msg.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </span>
        
        <span class="text-sm font-medium">{{ msg.content }}</span>
      </div>
    </TransitionGroup>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useToastState } from '../utils/toast';

const state = useToastState();
const messages = computed(() => state.messages);

// 根据类型返回 Tailwind 样式类
const getStyle = (type) => {
  switch (type) {
    case 'success':
      return 'bg-green-900/90 border-green-700/50 text-green-100 shadow-green-900/20';
    case 'error':
      return 'bg-red-900/90 border-red-700/50 text-red-100 shadow-red-900/20';
    case 'warning':
      return 'bg-yellow-900/90 border-yellow-700/50 text-yellow-100 shadow-yellow-900/20';
    default:
      return 'bg-gray-800/90 border-gray-600/50 text-gray-100 shadow-gray-900/20';
  }
};
</script>

<style scoped>
/* 进入/离开动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>