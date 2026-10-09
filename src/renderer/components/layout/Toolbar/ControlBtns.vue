<template>
    <div v-show="!isFullscreen" ref="dom_btns" :class="$style.control">
        <button :aria-label="$t('min')" :class="[$style.btn, $style.min]" :title="$t('min')" ignore-tip type="button"
                @click="minWindow">
            <svg height="60%" space="preserve" version="1.1" viewBox="0 0 24 24"
                 xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-window-minimize-2"/>
            </svg>
        </button>
        <button :aria-label="$t('close')" :class="[$style.btn, $style.close]" :title="$t('close')" ignore-tip
                type="button" @click="closeWindow">
            <svg height="60%" space="preserve" version="1.1" viewBox="0 0 24 24"
                 xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-window-close-2"/>
            </svg>
        </button>
    </div>
</template>

<script setup>
import {closeWindow, minWindow} from '@renderer/utils/ipc'
import {onBeforeUnmount, onMounted, ref, useCssModule} from '@common/utils/vueTools'
// import { getRandom } from '../../utils'
import {isFullscreen} from '@renderer/store'

const dom_btns = ref()

const cssModule = useCssModule()

const handle_focus = () => {
    if (!dom_btns.value) return
    for (const node of dom_btns.value.childNodes) {
        if (node.tagName != 'BUTTON') continue
        node.classList.remove(cssModule.hover)
    }
}
const getBtnEl = (el) => el.tagName == 'BUTTON' || !el ? el : getBtnEl(el.parentNode)
const handle_mouseover = (event) => {
    const btn = getBtnEl(event.target)
    if (!btn) return
    btn.classList.add(cssModule.hover)
}
const handle_mouseout = (event) => {
    const btn = getBtnEl(event.target)
    if (!btn) return
    btn.classList.remove(cssModule.hover)
}


onMounted(() => {
    window.app_event.on('focus', handle_focus)
    dom_btns.value.addEventListener('mouseover', handle_mouseover)
    dom_btns.value.addEventListener('mouseout', handle_mouseout)
})
onBeforeUnmount(() => {
    window.app_event.off('focus', handle_focus)
    dom_btns.value.removeEventListener('mouseover', handle_mouseover)
    dom_btns.value.removeEventListener('mouseout', handle_mouseout)
})

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.control {
    display: flex;
    align-self: flex-start;
    -webkit-app-region: no-drag;
    height: 30px;

    .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        width: 46px;
        height: 30px;
        background: none;
        border: none;
        outline: none;
        padding: 1px;
        cursor: pointer;
        color: var(--color-font-label);
        transition: background-color 0.2s ease-in-out;

        &.hover {
            &.min, &.max {
                background-color: var(--color-button-background-hover);
            }

            &.close {
                background-color: var(--color-btn-close);
            }
        }
    }
}

</style>
