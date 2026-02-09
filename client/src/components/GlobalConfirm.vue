<template>
  <Transition name="fade">
    <div v-if="state.visible" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      
      <div 
        class="w-full max-w-md bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl overflow-hidden scale-in"
        role="dialog"
      >
        <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-700">
          <div v-if="state.type === 'error'" class="text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <div v-else class="text-yellow-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3 class="text-lg font-bold text-white">{{ state.title }}</h3>
        </div>

        <div class="px-6 py-6 text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
          {{ state.content }}
        </div>

        <div class="px-6 py-4 bg-[#252526] flex justify-end gap-3">
          <button 
            @click="handleAction(false)" 
            class="px-4 py-2 text-xs font-medium text-gray-300 transition border border-gray-600 rounded hover:text-white hover:bg-gray-700"
          >
            {{ state.cancelText }}
          </button>
          
          <button 
            @click="handleAction(true)" 
            class="px-4 py-2 text-xs font-bold text-white transition rounded shadow-lg"
            :class="confirmBtnClass"
          >
            {{ state.confirmText }}
          </button>
        </div>
      </div>

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConfirmState, handleAction } from '../utils/confirm';

const state = useConfirmState();

const confirmBtnClass = computed(() => {
  if (state.type === 'error') return 'bg-red-600 hover:bg-red-500 shadow-red-900/50';
  return 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50';
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
.scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>