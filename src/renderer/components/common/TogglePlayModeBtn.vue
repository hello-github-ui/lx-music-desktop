<template>
    <material-popup-btn ref="btn_ref" :class="$style.btnContent">
        <button :aria-label="nextTogglePlayName" :class="$style.btn">
            <svg
                v-if="appSetting['player.togglePlayMethod'] == 'listLoop'"
                height="80%"
                space="preserve"
                version="1.1"
                viewBox="0 0 24 24" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"
            >
                <use xlink:href="#icon-list-loop"/>
            </svg>
            <svg
                v-else-if="appSetting['player.togglePlayMethod'] == 'random'"
                space="preserve"
                version="1.1"
                viewBox="0 0 24 24"
                width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"
            >
                <use xlink:href="#icon-list-random"/>
            </svg>
            <svg
                v-else-if="appSetting['player.togglePlayMethod'] == 'list'"
                space="preserve"
                version="1.1"
                viewBox="0 0 32 32"
                width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"
            >
                <use xlink:href="#icon-list-order"/>
            </svg>
            <svg
                v-else-if="appSetting['player.togglePlayMethod'] == 'singleLoop'"
                space="preserve"
                version="1.1"
                viewBox="0 0 24 24"
                width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"
            >
                <use xlink:href="#icon-single-loop"/>
            </svg>
            <svg v-else space="preserve" version="1.1" viewBox="0 0 32 32"
                 width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-single"/>
            </svg>
        </button>
        <template #content>
            <div :class="$style.setting">
                <button :aria-label="$t('player__play_toggle_mode_list_loop')" :class="$style.btn"
                        @click="toggleMode('listLoop')">
                    <svg height="100%" space="preserve" version="1.1"
                         viewBox="0 0 24 24" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                        <use xlink:href="#icon-list-loop"/>
                    </svg>
                </button>
                <button :aria-label="$t('player__play_toggle_mode_random')" :class="$style.btn"
                        @click="toggleMode('random')">
                    <svg space="preserve" version="1.1" viewBox="0 0 24 24"
                         width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                        <use xlink:href="#icon-list-random"/>
                    </svg>
                </button>
                <button :aria-label="$t('player__play_toggle_mode_list')" :class="$style.btn"
                        @click="toggleMode('list')">
                    <svg space="preserve" version="1.1" viewBox="0 0 32 32"
                         width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                        <use xlink:href="#icon-list-order"/>
                    </svg>
                </button>
                <button :aria-label="$t('player__play_toggle_mode_single_loop')" :class="$style.btn"
                        @click="toggleMode('singleLoop')">
                    <svg space="preserve" version="1.1" viewBox="0 0 24 24"
                         width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                        <use xlink:href="#icon-single-loop"/>
                    </svg>
                </button>
                <button :aria-label="$t('player__play_toggle_mode_off')" :class="$style.btn"
                        @click="toggleMode('none')">
                    <svg space="preserve" version="1.1" viewBox="0 0 32 32"
                         width="100%" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                        <use xlink:href="#icon-single"/>
                    </svg>
                </button>
            </div>
        </template>
    </material-popup-btn>
</template>

<script setup>
import {ref} from '@common/utils/vueTools'
// import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
// import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
// import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
import {appSetting} from '@renderer/store/setting'
import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'

const btn_ref = ref(null)

const {
    nextTogglePlayName,
    toggleNextPlayMode,
} = useNextTogglePlay()

const toggleMode = (mode) => {
    btn_ref.value.hide()
    toggleNextPlayMode(mode)
}

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btnContent {
    flex: none;
    height: 100%;
}

.btn {
    position: relative;
    // color: var(--color-button-font);
    justify-content: center;
    align-items: center;
    transition: color @transition-normal;
    cursor: pointer;
    background-color: transparent;
    border: none;
    width: 24px;
    display: flex;
    flex-flow: column nowrap;
    padding: 0;

    svg {
        transition: opacity @transition-fast;
        opacity: .6;
        filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
    }

    &:hover {
        svg {
            opacity: .9;
        }
    }

    &:active {
        svg {
            opacity: 1;
        }
    }
}

.setting {
    display: flex;
    flex-flow: row nowrap;
    font-size: 14px;
    gap: 10px;
}


</style>
