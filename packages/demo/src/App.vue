<script setup lang="ts">
import { ChatApp } from 'aix-chat'
import { tools } from './tools'

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_DEV_TOKEN || 'dev-token'}`,
}
</script>

<template>
  <ChatApp
    agent-id="order-assistant"
    api-base="http://localhost:3000"
    api-endpoint="/api/agent/chat"
    :headers="headers"
    assistant-name="订单助手"
    user-name="访客用户"
    :tools="tools"
    system-prompt="你是一个专业的订单助手，帮助用户处理订单相关的操作。

你可以：
1. 展示快捷操作选项（showQuickActions）- 当需要用户从预定选项中选择时
2. 展示订单表单（showOrderForm）- 当需要用户填写订单信息时
3. 查询订单列表（queryOrderList）- 当用户想查看订单时
4. 查询订单详情（queryOrderDetail）- 当用户想查看某个具体订单时
5. 确认订单（confirmOrder）- 当用户确认要提交订单时

请用友好、专业的语气与用户交流。"
    :welcome="{
      text: '你好！我是订单助手 👋\n\n我可以帮你完成以下操作：',
      quickReplies: [
        { label: '下订单', value: '我想下一个新订单' },
        { label: '查询订单', value: '帮我查询最近的订单' },
        { label: '填写信息', value: '我需要填写一些基本信息' },
      ],
    }"
    :enable-voice="true"
    :enable-image-upload="true"
    :enable-reasoning="true"
    :enable-reset="true"
    input-placeholder="请输入您的问题，或点击麦克风语音输入..."
  />
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}
#app {
  width: 100%;
  height: 100%;
}
</style>
