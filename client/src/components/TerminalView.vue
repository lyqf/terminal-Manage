<script setup>
import { onMounted, ref, watch, nextTick, computed, onBeforeUnmount } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { chatAI } from '../utils/ai'; // 👈 引入 AI 工具
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // 代码高亮样式

const props = defineProps({
  id: String,
  logs: { type: Array, default: () => [] }
});

const emit = defineEmits(['open-file']);

const terminalContainer = ref(null);
const copySuccess = ref(false);

// --- AI 相关状态 ---
const isAnalyzing = ref(false);
const showAiModal = ref(false);
const aiResult = ref('');

// 初始化 Markdown 解析器
const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(str, { language: lang }).value; } catch (__) {}
    }
    return ''; 
  }
});
const renderedMarkdown = computed(() => md.render(aiResult.value));

// 🟢 智能状态检测
// client/src/components/TerminalView.vue

// 1. 把 computed 改成 ref
const hasError = ref(false);
let checkTimer = null;

// 2. 封装检查逻辑 (这是刚才优化过的逻辑)
const checkErrorLogic = () => {
  // 如果日志被清空了，直接没报错
  if (props.logs.length === 0) {
    hasError.value = false;
    return;
  }

  const recentLogs = props.logs.slice(-100);
  let errorIdx = -1;
  let successIdx = -1;

  recentLogs.forEach((line, i) => {
    // 🚨 错误判定
    if (/error|fail|exception|fatal/i.test(line) && !/node_modules|npm update/i.test(line)) {
      errorIdx = i;
    }
    // 🟢 成功判定
    const isBuildSuccess = /ready in|built in|running|compiled successfully|webpack compiled/i.test(line);
    if (isBuildSuccess && !/error|fail/i.test(line)) {
      successIdx = i;
    }
  });

  // 更新状态
  hasError.value = errorIdx > -1 && errorIdx > successIdx;
};

watch(
  () => props.logs.length, 
  () => {
    // 如果已经有一个检查任务在排队，就不要插队了 (节流)
    if (checkTimer) return;

    // 启动一个 500ms 后执行的定时器
    checkTimer = setTimeout(() => {
      checkErrorLogic();
      checkTimer = null; // 执行完清空定时器，允许下一次触发
    }, 500); 
  }, 
  { immediate: true } // 初始化时先检查一次
);

// --- xterm 相关 ---
let term = null;
let fitAddon = null;
let writeIndex = 0; // 记录已写入日志的索引

// --- 📋 复制功能 ---
const copyLogs = async () => {
  try {
    const text = props.logs.join('');
    await navigator.clipboard.writeText(text);
    copySuccess.value = true;
    setTimeout(() => copySuccess.value = false, 2000);
  } catch (err) {
    console.error('复制失败', err);
    $toast.error('复制失败，请手动选择复制');
  }
};

// --- 🧹 清空功能 ---
const clearLogs = () => {
  term?.clear();
  writeIndex = props.logs.length; 
};

// --- 🤖 AI 诊断功能 ---
const handleAnalyze = async () => {
  if (props.logs.length === 0) return;
  
  isAnalyzing.value = true;
  aiResult.value = ''; 
  
  try {
    // 1. 获取最近的日志 (取最后 80 行，通常报错信息都在最后)
    // 过滤掉空行，合并成字符串
    const recentLogs = props.logs.slice(-80).filter(l => l.trim()).join('\n');
    
    if (!recentLogs) {
      $toast.error('日志为空，无法分析');
      isAnalyzing.value = false;
      return;
    }

    // 2. 准备 Prompt
    const systemPrompt = `你是一个资深前端开发专家。
    用户将提供一段运行时错误日志。
    请你：
    1. 用简练的中文解释错误原因。
    2. 直接给出修复建议或代码片段。
    3. 使用 Markdown 格式回复。
    4. 如果日志没有明显错误，请告知用户。`;

    // 3. 打开弹窗
    showAiModal.value = true;
    
    // 4. 调用通用的 AI 接口
    const result = await chatAI(recentLogs, systemPrompt);
    aiResult.value = result;

  } catch (error) {
    aiResult.value = `### ❌ 分析失败\n\n${error.message}\n\n请检查 API Key 配置（点击右上角配置）。`;
    // 如果是因为没 Key，弹窗还是要打开让用户看提示
    showAiModal.value = true;
  } finally {
    isAnalyzing.value = false;
  }
};

const initTerminal = () => {
  if (term) return;

  term = new Terminal({
    theme: { 
      background: '#0f172a', 
      foreground: '#cbd5e1', 
      cursor: '#38bdf8', 
      selectionBackground: '#3b82f64d' 
    },
    fontSize: 12,
    lineHeight: 1.4,
    fontFamily: 'Consolas, "Courier New", monospace',
    convertEol: true,
    rows: 16,
    cursorBlink: true,
    disableStdin: true,
    rightClickSelectsWord: true,
  });
  
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  // 链接点击处理
  const linkRegex = /(https?:\/\/[^\s"'()]+)|([a-zA-Z]:[\\/][\w.\-\\/ ]+(:[\d]+){0,2})/;
  const linkAddon = new WebLinksAddon(
    (event, uri) => {
      event.preventDefault(); 
      if (uri.startsWith('http')) {
        window.open(uri, '_blank');
      } else {
        console.log('🔗 请求打开本地文件:', uri);
        emit('open-file', uri);
      }
    },
    { urlRegex: linkRegex }
  );
  
  term.loadAddon(linkAddon);
  term.open(terminalContainer.value);
  
  setTimeout(() => fitAddon.fit(), 50);
  
  // 初始化时写入所有日志
  props.logs.forEach(line => term.writeln(line));
  writeIndex = props.logs.length;
};

// 增量写入日志，避免重绘闪烁
const flushLogs = () => {
  if (!term || !props.logs) return;
  
  // 如果日志被清空过（比如重新运行），则重置
  if (props.logs.length < writeIndex) {
    term.clear();
    writeIndex = 0;
  }

  // 只写入新增加的部分
  const newLogs = props.logs.slice(writeIndex);
  if (newLogs.length > 0) {
    newLogs.forEach(line => term.writeln(line));
    writeIndex = props.logs.length;
    // 自动滚动到底部
    term.scrollToBottom();
  }
};

onMounted(() => { nextTick(() => initTerminal()); });

// 监听日志变化
watch(() => props.logs, () => flushLogs(), { deep: true });

const resizeObserver = new ResizeObserver(() => fitAddon?.fit());
onMounted(() => { if (terminalContainer.value) resizeObserver.observe(terminalContainer.value); });
onBeforeUnmount(() => { term?.dispose(); resizeObserver.disconnect(); });
</script>

<template>
  <div class="w-full h-[300px] bg-[#0f172a] rounded-b-lg p-2 overflow-hidden border-t border-gray-700 relative group">
    
    <div class="absolute z-10 flex items-center gap-2 pointer-events-none top-2 left-4">
       <span v-if="hasError" class="flex items-center gap-1 text-[10px] font-bold text-red-400 animate-pulse bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-red-500/30">
          ⚠️ 报错检测
       </span>
    </div>

    <div class="absolute z-10 flex gap-2 transition-opacity duration-200 opacity-0 top-2 right-4 group-hover:opacity-100">
      
      <span v-if="copySuccess" class="px-2 py-1 text-xs text-green-400 border rounded bg-black/50 fade-in border-green-500/30">
        ✅ 已复制
      </span>

      <button 
        @click="handleAnalyze" 
        :disabled="isAnalyzing || logs.length === 0"
        class="flex items-center gap-1 px-2 py-1 text-xs text-white transition border rounded backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        :class="isAnalyzing ? 'bg-gray-700 border-gray-600' : 'bg-purple-600/80 hover:bg-purple-600 border-purple-500/50'"
        title="AI 智能分析报错原因"
      >
        <span v-if="isAnalyzing" class="animate-spin">⏳</span>
        <span v-else>🤖</span>
        {{ isAnalyzing ? '分析中...' : 'AI 诊断' }}
      </button>

      <button @click="copyLogs" 
              class="p-1.5 bg-gray-700/80 hover:bg-blue-600 text-gray-300 hover:text-white rounded text-xs backdrop-blur-sm border border-gray-600 transition" 
              title="复制所有日志">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>

      <button @click="clearLogs" 
              class="p-1.5 bg-gray-700/80 hover:bg-red-600 text-gray-300 hover:text-white rounded text-xs backdrop-blur-sm border border-gray-600 transition" 
              title="清空当前屏幕">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
      </button>
    </div>

    <div ref="terminalContainer" class="w-full h-full" style="text-align: left !important;"></div>

    <div v-if="showAiModal" class="absolute inset-0 z-50 flex flex-col bg-[#0f172a]/95 backdrop-blur-md transition-all duration-300 animate-fade-in">
      <div class="flex items-center justify-between p-3 border-b border-gray-700/50 bg-[#1e293b]/50">
        <h3 class="flex items-center gap-2 text-sm font-bold text-purple-400">
          <span>🤖</span> AI 诊断报告
        </h3>
        <button @click="showAiModal = false" class="px-2 text-gray-400 transition rounded hover:text-white hover:bg-white/10">✕</button>
      </div>
      
      <div class="flex-1 p-4 overflow-y-auto prose-sm prose text-left custom-markdown prose-invert max-w-none">
        <div v-if="!aiResult" class="flex flex-col items-center justify-center h-full space-y-2 text-gray-400">
          <div class="w-6 h-6 border-2 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
          <p class="text-xs animate-pulse">正在思考分析...</p>
        </div>
        <div v-else v-html="renderedMarkdown"></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fadeIn 0.2s ease-out; }

/* Markdown 样式微调，适配终端黑色背景 */
.custom-markdown :deep(pre) {
  background-color: #0d1117 !important;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #30363d;
  overflow-x: auto;
}
.custom-markdown :deep(code) {
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background-color: transparent !important; /* 避免 highlight.js 背景冲突 */
}
.custom-markdown :deep(h3) {
  color: #c084fc;
  margin-top: 1em;
  font-size: 1.1em;
  border-bottom: 1px solid #333;
  padding-bottom: 0.3em;
}
.custom-markdown :deep(ul) {
  padding-left: 1.2rem;
  list-style-type: disc;
}
.custom-markdown :deep(li) {
  margin-bottom: 0.2em;
}
.custom-markdown :deep(strong) {
  color: #818cf8; /* 重点文字淡紫色 */
}
</style>