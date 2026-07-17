/**
 * 订单助手工具定义
 *
 * 使用 defineTools 统一管理：
 * - 工具 schema（传给后端）
 * - 卡片组件
 * - 执行逻辑
 * - 事件处理
 */
import { defineTools } from 'aix-chat';
import OptionSelectorCard from './components/OptionSelectorCard.vue';
import SimpleFormCard from './components/SimpleFormCard.vue';
import SimpleListCard from './components/SimpleListCard.vue';
// Mock 数据
const MOCK_ORDERS = [
    {
        id: 'ORD-2024-001',
        title: '瓷砖订单 #001',
        subtitle: '白色大理石纹 800x800mm x 100片',
        status: '待确认',
        statusColor: '#f59e0b',
        amount: 12800,
        createTime: '2024-01-15 10:30',
    },
    {
        id: 'ORD-2024-002',
        title: '瓷砖订单 #002',
        subtitle: '灰色哑光 600x600mm x 200片',
        status: '已完成',
        statusColor: '#10b981',
        amount: 25600,
        createTime: '2024-01-10 14:20',
    },
    {
        id: 'ORD-2024-003',
        title: '瓷砖订单 #003',
        subtitle: '木纹砖 1200x200mm x 50片',
        status: '待发货',
        statusColor: '#3b82f6',
        amount: 8900,
        createTime: '2024-01-12 09:15',
    },
];
export const tools = defineTools([
    {
        name: 'showQuickActions',
        description: '展示快捷操作选项让用户选择。适用于需要用户从预定义选项中做出选择的场景。请根据对话上下文生成 2-4 个最相关的选项，每个选项包含 label（显示文字）和 value（选项值）。',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: '卡片标题' },
                options: {
                    type: 'array',
                    description: '选项列表',
                    items: {
                        type: 'object',
                        properties: {
                            label: { type: 'string', description: '显示文字' },
                            value: { type: 'string', description: '选项值' },
                            description: { type: 'string', description: '可选的补充说明' },
                        },
                        required: ['label', 'value'],
                    },
                },
            },
            required: ['title', 'options'],
        },
        component: OptionSelectorCard,
        mapProps: (args) => ({
            title: args.title,
            options: args.options.map((opt) => ({
                label: opt.label,
                value: opt.value,
                description: opt.description,
            })),
        }),
        execute: async (args) => {
            // 解析 options 如果是字符串
            let options = args.options;
            if (typeof options === 'string') {
                try {
                    options = JSON.parse(options);
                }
                catch (e) {
                    console.error('Failed to parse options:', e);
                    options = [];
                }
            }
            return {
                pending: true,
                type: 'showQuickActions',
                title: args.title || '请选择操作',
                options: options || [
                    { label: '查看订单', value: 'view_orders', description: '查询历史订单' },
                    { label: '下新订单', value: 'new_order', description: '创建新订单' },
                    { label: '联系客服', value: 'contact_support' },
                ],
            };
        },
        onEvent: (eventName, data) => {
            console.log('[showQuickActions] Event:', eventName, data);
        },
    },
    {
        name: 'showOrderForm',
        description: '展示订单信息填写表单。当需要用户填写订单相关信息时使用。请根据场景生成合适的字段，如：姓名、电话、地址、商品数量、备注等。每个字段包含 key（字段标识）、label（显示标签）、type（输入类型：text/number/tel/email）、required（是否必填）。',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: '表单标题' },
                fields: {
                    type: 'array',
                    description: '表单字段列表',
                    items: {
                        type: 'object',
                        properties: {
                            key: { type: 'string', description: '字段标识' },
                            label: { type: 'string', description: '字段标签' },
                            type: { type: 'string', description: '输入类型', enum: ['text', 'number', 'tel', 'email'] },
                            placeholder: { type: 'string', description: '占位提示文字' },
                            required: { type: 'boolean', description: '是否必填' },
                        },
                        required: ['key', 'label'],
                    },
                },
            },
            required: ['title', 'fields'],
        },
        component: SimpleFormCard,
        mapProps: (args) => ({
            title: args.title,
            fields: args.fields,
        }),
        execute: async (args) => {
            // 解析 fields 如果是字符串（AI 模型有时会返回字符串而不是数组）
            let fields = args.fields;
            if (typeof fields === 'string') {
                try {
                    fields = JSON.parse(fields);
                }
                catch (e) {
                    console.error('Failed to parse fields:', e);
                    fields = [];
                }
            }
            return {
                pending: true,
                type: 'showOrderForm',
                title: args.title || '填写订单信息',
                fields: fields || [
                    { key: 'name', label: '姓名', type: 'text', placeholder: '请输入姓名', required: true },
                    { key: 'phone', label: '电话', type: 'tel', placeholder: '请输入联系电话', required: true },
                    { key: 'address', label: '地址', type: 'text', placeholder: '请输入详细地址' },
                ],
            };
        },
        onEvent: (eventName, data) => {
            console.log('[showOrderForm] Event:', eventName, data);
        },
    },
    {
        name: 'queryOrderList',
        description: '查询订单列表。当用户想要查看订单、查询历史订单时使用。可指定 status 过滤（all/pending/completed/cancelled）和 limit 限制返回数量。',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: '订单状态过滤',
                    enum: ['all', 'pending', 'completed', 'cancelled'],
                },
                limit: { type: 'number', description: '返回数量限制，默认 10' },
            },
        },
        component: SimpleListCard,
        mapProps: (result) => ({
            title: result.title || '订单列表',
            records: result.records,
            total: result.total,
        }),
        execute: async (args) => {
            const status = args.status || 'all';
            const limit = args.limit || 10;
            let filtered = MOCK_ORDERS;
            if (status === 'pending') {
                filtered = MOCK_ORDERS.filter(o => o.status === '待确认');
            }
            else if (status === 'completed') {
                filtered = MOCK_ORDERS.filter(o => o.status === '已完成');
            }
            const records = filtered.slice(0, limit).map(o => ({
                id: o.id,
                title: o.title,
                subtitle: `${o.subtitle} | ¥${o.amount.toLocaleString()}`,
                status: o.status,
                statusColor: o.statusColor,
            }));
            return {
                type: 'queryOrderList',
                title: '订单列表',
                records,
                total: filtered.length,
            };
        },
        onEvent: (eventName, data) => {
            console.log('[queryOrderList] Event:', eventName, data);
        },
    },
    {
        name: 'queryOrderDetail',
        description: '查询订单详情。当用户想要查看某个具体订单的详细信息时使用。',
        parameters: {
            type: 'object',
            properties: {
                orderNo: { type: 'string', description: '订单编号' },
            },
            required: ['orderNo'],
        },
        execute: async (args) => {
            const order = MOCK_ORDERS.find(o => o.id === args.orderNo);
            if (!order) {
                return { success: false, error: `未找到订单 ${args.orderNo}` };
            }
            return { success: true, order };
        },
    },
    {
        name: 'confirmOrder',
        description: '确认订单信息并提交。当用户确认订单内容无误，准备提交时使用。',
        parameters: {
            type: 'object',
            properties: {
                orderData: { type: 'object', description: '订单数据' },
            },
            required: ['orderData'],
        },
        execute: async () => ({
            success: true,
            message: '订单已提交',
            orderNo: `ORD-${Date.now()}`,
        }),
    },
]);
