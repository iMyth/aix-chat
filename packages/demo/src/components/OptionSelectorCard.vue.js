/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
const props = defineProps();
const emit = defineEmits();
/** Map value to MDI icon name for built-in option types */
const iconMap = {
    new_order: 'mdi-cart',
    query_order: 'mdi-package-variant',
    fill_info: 'mdi-clipboard-text-outline',
    help: 'mdi-help-circle-outline',
};
function getIcon(value) {
    return iconMap[value] ?? null;
}
function handleSelect(item) {
    emit('select', item);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "option-selector-card" },
});
if (__VLS_ctx.title) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    (__VLS_ctx.title);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-grid" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.options))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSelect(item);
            } },
        key: (item.value),
        ...{ class: "card-item" },
    });
    if (__VLS_ctx.getIcon(item.value)) {
        const __VLS_0 = ((__VLS_ctx.getIcon(item.value)));
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            ...{ class: "card-icon" },
        }));
        const __VLS_2 = __VLS_1({
            ...{ class: "card-icon" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "card-label" },
    });
    (item.label);
    if (item.description) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "card-desc" },
        });
        (item.description);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('cancel');
        } },
    ...{ class: "card-cancel" },
});
/** @type {__VLS_StyleScopedClasses['option-selector-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['card-item']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-label']} */ ;
/** @type {__VLS_StyleScopedClasses['card-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['card-cancel']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            getIcon: getIcon,
            handleSelect: handleSelect,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
