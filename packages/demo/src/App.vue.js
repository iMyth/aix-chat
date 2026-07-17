/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ChatApp } from 'aix-chat';
import { tools } from './tools';
const headers = {
    Authorization: `Bearer ${import.meta.env.VITE_DEV_TOKEN || 'dev-token'}`,
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ChatApp;
/** @type {[typeof __VLS_components.ChatApp, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    agentId: "order-assistant",
    apiBase: "http://localhost:3000",
    apiEndpoint: "/api/agent/chat",
    headers: (__VLS_ctx.headers),
    assistantName: "订单助手",
    userName: "访客用户",
    tools: (__VLS_ctx.tools),
    systemPrompt: "\u4f60\u662f\u4e00\u4e2a\u4e13\u4e1a\u7684\u8ba2\u5355\u52a9\u624b\uff0c\u5e2e\u52a9\u7528\u6237\u5904\u7406\u8ba2\u5355\u76f8\u5173\u7684\u64cd\u4f5c\u3002\u000a\u000a\u4f60\u53ef\u4ee5\uff1a\u000a\u0031\u002e\u0020\u5c55\u793a\u5feb\u6377\u64cd\u4f5c\u9009\u9879\uff08\u0073\u0068\u006f\u0077\u0051\u0075\u0069\u0063\u006b\u0041\u0063\u0074\u0069\u006f\u006e\u0073\uff09\u002d\u0020\u5f53\u9700\u8981\u7528\u6237\u4ece\u9884\u5b9a\u9009\u9879\u4e2d\u9009\u62e9\u65f6\u000a\u0032\u002e\u0020\u5c55\u793a\u8ba2\u5355\u8868\u5355\uff08\u0073\u0068\u006f\u0077\u004f\u0072\u0064\u0065\u0072\u0046\u006f\u0072\u006d\uff09\u002d\u0020\u5f53\u9700\u8981\u7528\u6237\u586b\u5199\u8ba2\u5355\u4fe1\u606f\u65f6\u000a\u0033\u002e\u0020\u67e5\u8be2\u8ba2\u5355\u5217\u8868\uff08\u0071\u0075\u0065\u0072\u0079\u004f\u0072\u0064\u0065\u0072\u004c\u0069\u0073\u0074\uff09\u002d\u0020\u5f53\u7528\u6237\u60f3\u67e5\u770b\u8ba2\u5355\u65f6\u000a\u0034\u002e\u0020\u67e5\u8be2\u8ba2\u5355\u8be6\u60c5\uff08\u0071\u0075\u0065\u0072\u0079\u004f\u0072\u0064\u0065\u0072\u0044\u0065\u0074\u0061\u0069\u006c\uff09\u002d\u0020\u5f53\u7528\u6237\u60f3\u67e5\u770b\u67d0\u4e2a\u5177\u4f53\u8ba2\u5355\u65f6\u000a\u0035\u002e\u0020\u786e\u8ba4\u8ba2\u5355\uff08\u0063\u006f\u006e\u0066\u0069\u0072\u006d\u004f\u0072\u0064\u0065\u0072\uff09\u002d\u0020\u5f53\u7528\u6237\u786e\u8ba4\u8981\u63d0\u4ea4\u8ba2\u5355\u65f6\u000a\u000a\u8bf7\u7528\u53cb\u597d\u3001\u4e13\u4e1a\u7684\u8bed\u6c14\u4e0e\u7528\u6237\u4ea4\u6d41\u3002",
    welcome: ({
        text: '你好！我是订单助手 👋\n\n我可以帮你完成以下操作：',
        quickReplies: [
            { label: '下订单', value: '我想下一个新订单' },
            { label: '查询订单', value: '帮我查询最近的订单' },
            { label: '填写信息', value: '我需要填写一些基本信息' },
        ],
    }),
    enableVoice: (true),
    enableImageUpload: (true),
    enableReasoning: (true),
    enableReset: (true),
    inputPlaceholder: "请输入您的问题，或点击麦克风语音输入...",
}));
const __VLS_2 = __VLS_1({
    agentId: "order-assistant",
    apiBase: "http://localhost:3000",
    apiEndpoint: "/api/agent/chat",
    headers: (__VLS_ctx.headers),
    assistantName: "订单助手",
    userName: "访客用户",
    tools: (__VLS_ctx.tools),
    systemPrompt: "\u4f60\u662f\u4e00\u4e2a\u4e13\u4e1a\u7684\u8ba2\u5355\u52a9\u624b\uff0c\u5e2e\u52a9\u7528\u6237\u5904\u7406\u8ba2\u5355\u76f8\u5173\u7684\u64cd\u4f5c\u3002\u000a\u000a\u4f60\u53ef\u4ee5\uff1a\u000a\u0031\u002e\u0020\u5c55\u793a\u5feb\u6377\u64cd\u4f5c\u9009\u9879\uff08\u0073\u0068\u006f\u0077\u0051\u0075\u0069\u0063\u006b\u0041\u0063\u0074\u0069\u006f\u006e\u0073\uff09\u002d\u0020\u5f53\u9700\u8981\u7528\u6237\u4ece\u9884\u5b9a\u9009\u9879\u4e2d\u9009\u62e9\u65f6\u000a\u0032\u002e\u0020\u5c55\u793a\u8ba2\u5355\u8868\u5355\uff08\u0073\u0068\u006f\u0077\u004f\u0072\u0064\u0065\u0072\u0046\u006f\u0072\u006d\uff09\u002d\u0020\u5f53\u9700\u8981\u7528\u6237\u586b\u5199\u8ba2\u5355\u4fe1\u606f\u65f6\u000a\u0033\u002e\u0020\u67e5\u8be2\u8ba2\u5355\u5217\u8868\uff08\u0071\u0075\u0065\u0072\u0079\u004f\u0072\u0064\u0065\u0072\u004c\u0069\u0073\u0074\uff09\u002d\u0020\u5f53\u7528\u6237\u60f3\u67e5\u770b\u8ba2\u5355\u65f6\u000a\u0034\u002e\u0020\u67e5\u8be2\u8ba2\u5355\u8be6\u60c5\uff08\u0071\u0075\u0065\u0072\u0079\u004f\u0072\u0064\u0065\u0072\u0044\u0065\u0074\u0061\u0069\u006c\uff09\u002d\u0020\u5f53\u7528\u6237\u60f3\u67e5\u770b\u67d0\u4e2a\u5177\u4f53\u8ba2\u5355\u65f6\u000a\u0035\u002e\u0020\u786e\u8ba4\u8ba2\u5355\uff08\u0063\u006f\u006e\u0066\u0069\u0072\u006d\u004f\u0072\u0064\u0065\u0072\uff09\u002d\u0020\u5f53\u7528\u6237\u786e\u8ba4\u8981\u63d0\u4ea4\u8ba2\u5355\u65f6\u000a\u000a\u8bf7\u7528\u53cb\u597d\u3001\u4e13\u4e1a\u7684\u8bed\u6c14\u4e0e\u7528\u6237\u4ea4\u6d41\u3002",
    welcome: ({
        text: '你好！我是订单助手 👋\n\n我可以帮你完成以下操作：',
        quickReplies: [
            { label: '下订单', value: '我想下一个新订单' },
            { label: '查询订单', value: '帮我查询最近的订单' },
            { label: '填写信息', value: '我需要填写一些基本信息' },
        ],
    }),
    enableVoice: (true),
    enableImageUpload: (true),
    enableReasoning: (true),
    enableReset: (true),
    inputPlaceholder: "请输入您的问题，或点击麦克风语音输入...",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ChatApp: ChatApp,
            tools: tools,
            headers: headers,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
