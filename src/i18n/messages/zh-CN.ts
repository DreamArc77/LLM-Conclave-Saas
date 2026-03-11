import type { Messages } from './en';

export const zhCN: Messages = {
  app: {
    name: 'AI Council',
    tagline: '多模型AI协作平台',
  },
  chat: {
    welcome: '发送消息开始多模型协作对话',
    generating: '生成中...',
    thinking: '思考中...',
    error: '发生错误',
  },
  input: {
    placeholder: '输入消息...',
    placeholderNoModels: '请先在设置中配置模型...',
    clearConversation: '清除对话',
    stopRelay: '停止对话',
    sendMessage: '发送消息',
  },
  sidebar: {
    newChat: '新对话',
    noConversations: '暂无对话记录',
  },
  status: {
    models: '{count} 个模型',
    round: '轮次 {round}/{maxRounds} · {modelName}',
    error: '错误',
    idle: '待机',
  },
  settings: {
    title: '模型设置',
    maxRounds: '最大讨论轮次',
    exportFormat: '报告导出格式',
    instruction:
      '在下方添加模型。拖拽可调整顺序（模型按顺序依次发言）。点击模型可编辑配置。',
    addModel: '添加模型',
    addModelTitle: '添加新模型',
    provider: '提供商',
    apiKey: 'API Key',
    endpointUrl: '接口地址',
    quickAdd: '快速添加',
    modelId: '模型 ID',
    displayName: '显示名称（可选）',
    displayNamePlaceholder: '在对话中显示的名称',
    cancel: '取消',
    preset: '预设',
    presetInfo: '预设模型由服务器提供，API Key 由管理员配置。',
    noModels: '尚未添加模型，请在上方添加。',
  },
  export: {
    exportReport: '导出报告 {filename}.{format}',
    generating: '生成中...',
    save: '保存 {filename}',
    retry: '重试',
    serverError: '服务器错误 {status}',
    generateFailed: '生成失败',
    shareFailed: '分享失败',
  },
  relay: {
    complete: '讨论已结束，耗时 {seconds} 秒，以下是「{topic}」的专题研讨报告',
  },
  report: {
    header: 'MEETING MINUTES · 会议纪要',
    subheader: 'AI Council · 多模型协作平台',
    footer: '由 AI Council 自动生成',
  },
  prompts: {
    userRole: '用户',
    participantSeparator: '、',
    dateLocale: 'zh-CN',
  },
};
