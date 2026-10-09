<template>
    <div :class="$style.btns">
        <button v-if="playBtn" :aria-label="$t('list__play')" type="button" @contextmenu.capture.stop
                @click.stop="handleClick('play')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="0 0 287.386 287.386" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-testPlay"/>
            </svg>
        </button>
        <button v-if="listAddBtn" :aria-label="$t('list__add_to')" type="button" @contextmenu.capture.stop
                @click.stop="handleClick('listAdd')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="0 0 42 42" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-addTo"/>
            </svg>
        </button>
        <button v-if="downloadBtn && appSetting['download.enable']" :aria-label="$t('list__download')" type="button"
                @contextmenu.capture.stop @click.stop="handleClick('download')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="0 0 475.078 475.077" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-download"/>
            </svg>
        </button>
        <button v-if="startBtn" :aria-label="$t('list__start')" type="button" @contextmenu.capture.stop
                @click.stop="handleClick('start')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="0 0 1024 1024" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-play"/>
            </svg>
        </button>
        <button v-if="pauseBtn" :aria-label="$t('list__pause')" type="button" @contextmenu.capture.stop
                @click.stop="handleClick('pause')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="0 0 1024 1024" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-pause"/>
            </svg>
        </button>
        <button v-if="fileBtn" :aria-label="$t('list__file')" type="button" @contextmenu.capture.stop
                @click.stop="handleClick('file')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="-61 0 512 512" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-musicFile"/>
            </svg>
        </button>
        <button v-if="searchBtn" :aria-label="$t('list__search')" type="button" @contextmenu.capture.stop
                @click.stop="handleClick('search')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="0 0 30.239 30.239" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-search"/>
            </svg>
        </button>
        <button v-if="removeBtn" :aria-label="$t('list__remove')" type="button" @click.stop="handleClick('remove')">
            <svg v-once height="100%" space="preserve" version="1.1"
                 viewBox="0 0 212.982 212.982" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                <use xlink:href="#icon-delete"/>
            </svg>
        </button>
    </div>
</template>

<script>
import {appSetting} from '@renderer/store/setting'

export default {
    props: {
        index: {
            type: Number,
            required: true,
        },
        startBtn: {
            type: Boolean,
            default: false,
        },
        pauseBtn: {
            type: Boolean,
            default: false,
        },
        removeBtn: {
            type: Boolean,
            default: false,
        },
        downloadBtn: {
            type: Boolean,
            default: true,
        },
        playBtn: {
            type: Boolean,
            default: true,
        },
        listAddBtn: {
            type: Boolean,
            default: true,
        },
        searchBtn: {
            type: Boolean,
            default: false,
        },
        fileBtn: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['btn-click'],
    setup() {
        return {
            appSetting,
        }
    },
    methods: {
        handleClick(action) {
            this.$emit('btn-click', {action, index: this.index})
        },
    },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btns {
    line-height: 1.2;

    button {
        background-color: transparent;
        border: none;
        border-radius: @form-radius;
        margin-right: 5px;
        cursor: pointer;
        padding: 4px 7px;
        color: var(--color-button-font);
        outline: none;
        transition: background-color 0.2s ease;
        line-height: 0;

        &:last-child {
            margin-right: 0;
        }

        svg {
            height: 16px;
        }

        &:hover {
            background-color: var(--color-button-background-hover);
        }

        &:active {
            background-color: var(--color-button-background-active);
        }
    }
}

</style>
