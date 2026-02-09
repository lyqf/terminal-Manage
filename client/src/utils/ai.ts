import { useAiConfig } from './useAiConfig';

/**
 * 通用的 AI 对话函数 (升级版)
 */
export async function chatAI(userContent: string, systemPrompt: string) {
  // 1. 获取全局配置
  const { activeConfig } = useAiConfig();
  const config = activeConfig.value;

  // 2. 校验配置
  if (!config || !config.apiKey) {
    throw new Error('未配置有效的 API Key，请点击设置图标进行配置。');
  }

  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-chat', // 使用配置里的 model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `请求失败 (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}