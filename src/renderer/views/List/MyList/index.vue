<template>
    <div ref="dom_lists" :class="$style.lists">
        <div :class="$style.listHeader">
            <h2 :class="$style.listsTitle">{{ $t('my_list') }}</h2>
            <div :class="$style.headerBtns">
                <button :aria-label="$t('lists__new_list_btn')" :class="$style.listsAdd" @click="isShowNewList = true">
                    <svg height="70%" space="preserve" version="1.1"
                         viewBox="0 0 24 24" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                        <use xlink:href="#icon-list-add"/>
                    </svg>
                </button>
                <button :aria-label="$t('list_update_modal__title')" :class="$style.listsAdd"
                        @click="isShowListUpdateModal = true">
                    <svg height="70%" space="preserve" style="transform: rotate(45deg);"
                         version="1.1" viewBox="0 0 24 24" xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
                        <use xlink:href="#icon-refresh"/>
                    </svg>
                </button>
            </div>
        </div>
        <ul ref="dom_lists_list" :class="[$style.listsContent, { [$style.sortable]: isModDown }]" class="scroll">
            <li
                :aria-label="$t(defaultList.name)"
                :aria-selected="defaultList.id == listId"
                :class="[$style.listsItem, {[$style.active]: defaultList.id == listId}, {[$style.clicked]: rightClickItemIndex == -2}, {[$style.fetching]: fetchingListStatus[defaultList.id]}]" class="default-list"
                @click="handleListToggle(defaultList.id)" @contextmenu="handleListsItemRigthClick($event, -2)"
            >
                <!-- <div v-if="defaultList.id == listId" :class="$style.activeIcon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="40%" viewBox="0 0 451.846 451.847" space="preserve">
                    <use xlink:href="#icon-right" />
                  </svg>
                </div> -->
                <span :class="$style.listsLabel">
          <transition name="list-active">
            <svg-icon v-if="defaultList.id == listId" :class="$style.activeIcon" name="angle-right-solid"/>
          </transition>
          {{ $t(defaultList.name) }}
        </span>
            </li>
            <li
                :aria-label="$t(loveList.name)"
                :aria-selected="loveList.id == listId"
                :class="[$style.listsItem, {[$style.active]: loveList.id == listId}, {[$style.clicked]: rightClickItemIndex == -1}, {[$style.fetching]: fetchingListStatus[loveList.id]}]" class="default-list"
                @click="handleListToggle(loveList.id)" @contextmenu="handleListsItemRigthClick($event, -1)"
            >
        <span :class="$style.listsLabel">
          <transition name="list-active">
            <svg-icon v-if="loveList.id == listId" :class="$style.activeIcon" name="angle-right-solid"/>
          </transition>
          {{ $t(loveList.name) }}
        </span>
            </li>
            <li
                v-for="(item, index) in userLists"
                :key="item.id" :aria-label="item.name"
                :aria-selected="defaultList.id == listId"
                :class="[$style.listsItem, {[$style.active]: item.id == listId}, {[$style.clicked]: rightClickItemIndex == index}, {[$style.fetching]: fetchingListStatus[item.id]}]" :data-index="index" class="user-list"
                @contextmenu="handleListsItemRigthClick($event, index)"
            >
        <span :class="$style.listsLabel" @click="handleListToggle(item.id, index + 2)">
          <transition name="list-active">
            <svg-icon v-if="item.id == listId" :class="$style.activeIcon" name="angle-right-solid"/>
          </transition>
          {{ item.name }}
        </span>
                <base-input
                    :class="$style.listsInput" :placeholder="item.name" :value="item.name"
                    type="text" @blur="handleSaveListName(index, $event)"
                    @keyup.enter="handleSaveListName(index, $event)"
                />
            </li>
            <transition enter-active-class="animated-fast slideInLeft" leave-active-class="animated-fast fadeOut"
                        @after-leave="isNewListLeave = false" @after-enter="$refs.dom_listsNewInput.focus()">
                <li v-if="isShowNewList"
                    :class="[$style.listsItem, $style.listsNew, {[$style.newLeave]: isNewListLeave}]">
                    <base-input
                        ref="dom_listsNewInput" :class="$style.listsInput" :placeholder="$t('lists__new_list_input')"
                        type="text"
                        @blur="handleCreateList" @keyup.enter="handleCreateList"
                    />
                </li>
            </transition>
        </ul>
        <base-menu v-model="isShowMenu" :menus="menus" :xy="menuLocation" item-name="name"
                   @menu-click="handleMenuClick"/>
        <DuplicateMusicModal v-model:visible="isShowDuplicateMusicModal" :list-info="duplicateListInfo"/>
        <ListSortModal v-model:visible="isShowListSortModal" :list-info="sortListInfo"/>
        <ListUpdateModal v-model:visible="isShowListUpdateModal"/>
    </div>
</template>

<script>
import {openUrl} from '@common/utils/electron'

import musicSdk from '@renderer/utils/musicSdk'
import DuplicateMusicModal from './components/DuplicateMusicModal.vue'
import ListSortModal from './components/ListSortModal.vue'
import ListUpdateModal from './components/ListUpdateModal.vue'

import {defaultList, fetchingListStatus, loveList, userLists} from '@renderer/store/list/state'
import {removeUserList} from '@renderer/store/list/action'

import {ref, watch} from '@common/utils/vueTools'
import {useRouter} from '@common/utils/vueRouter'
import {LIST_IDS} from '@common/constants'

import {dialog} from '@renderer/plugins/Dialog'

import {saveListPrevSelectId} from '@renderer/utils/data'

import {useI18n} from '@renderer/plugins/i18n'


import useShare from './useShare'
import useMenu from './useMenu'
import useListUpdate from './useListUpdate'
import useSort from './useSort'
import useDarg from './useDarg'
import useEditList from './useEditList'
import useListScroll from './useListScroll'
import useDuplicate from './useDuplicate'

export default {
    name: 'MyLists',
    components: {
        DuplicateMusicModal,
        ListSortModal,
        ListUpdateModal,
    },
    props: {
        listId: {
            type: String,
            required: true,
        },
    },
    emits: ['show-menu'],
    setup(props, {emit}) {
        const router = useRouter()
        const t = useI18n()

        const dom_lists_list = ref(null)
        const rightClickItemIndex = ref(-10)

        const {handleImportList, handleExportList} = useShare()
        const {isShowListUpdateModal, handleUpdateSourceList} = useListUpdate()
        const {isShowListSortModal, sortListInfo, handleSortList} = useSort()
        const {isShowDuplicateMusicModal, duplicateListInfo, handleDuplicateList} = useDuplicate()
        const {
            handleRename,
            handleSaveListName,
            isShowNewList,
            isNewListLeave,
            handleCreateList
        } = useEditList({dom_lists_list})
        useListScroll({dom_lists_list})

        const handleOpenSourceDetailPage = async (listInfo) => {
            const {source, sourceListId} = listInfo
            if (!sourceListId) return
            let url
            if (/board__/.test(sourceListId)) {
                const id = sourceListId.replace(/board__/, '')
                url = musicSdk[source].leaderboard.getDetailPageUrl(id)
            } else if (musicSdk[source]?.songList?.getDetailPageUrl) {
                url = await musicSdk[source].songList.getDetailPageUrl(sourceListId)
            }
            if (!url) return
            void openUrl(url)
        }

        const handleRemove = (listInfo) => {
            void dialog.confirm({
                message: t('lists__remove_tip', {name: listInfo.name}),
                confirmButtonText: t('lists__remove_tip_button'),
            }).then(isRemove => {
                if (!isRemove) return
                void removeUserList([listInfo.id])
                if (props.listId == listInfo.id) {
                    handleListToggle(LIST_IDS.DEFAULT)
                }
            })
        }

        const {
            menus,
            menuLocation,
            isShowMenu,
            showMenu,
            menuClick,
        } = useMenu({
            emit,

            handleImportList,
            handleExportList,
            handleUpdateSourceList,
            handleOpenSourceDetailPage,
            handleSortList,
            handleDuplicateList,
            handleRename,
            handleRemove,
        })

        const handleListsItemRigthClick = (event, index) => {
            rightClickItemIndex.value = index
            showMenu(event, index)
        }

        const handleListToggle = (id) => {
            if (id == props.listId) return
            router.replace({
                path: '/list',
                query: {id},
            }).catch(_ => _)
        }

        const handleMenuClick = (action) => {
            if (rightClickItemIndex.value < -2) return
            let index = rightClickItemIndex.value
            rightClickItemIndex.value = -10
            menuClick(action, index)
        }

        const {isModDown} = useDarg({dom_lists_list, handleMenuClick, handleSaveListName})


        watch(() => props.listId, (listId) => {
            saveListPrevSelectId(listId)
        })

        watch(() => userLists, (lists) => {
            if (lists.some(l => l.id == props.listId)) return
            void router.replace({
                path: '/list',
                query: {
                    id: defaultList.id,
                },
            })
        })

        return {
            rightClickItemIndex,
            defaultList,
            loveList,
            userLists,
            fetchingListStatus,
            dom_lists_list,
            isShowListUpdateModal,
            isShowListSortModal,
            sortListInfo,
            isShowDuplicateMusicModal,
            duplicateListInfo,
            handleSaveListName,
            isShowNewList,
            isNewListLeave,
            handleCreateList,
            handleListsItemRigthClick,
            isShowMenu,
            handleMenuClick,
            menus,
            menuLocation,
            handleListToggle,
            isModDown,
            hideMenu: handleMenuClick,
        }
    },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@lists-item-height: 36px;
.lists {
    flex: none;
    width: 16%;
    display: flex;
    flex-flow: column nowrap;
}

.listHeader {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    border-bottom: var(--color-list-header-border-bottom);

    &:hover {
        .listsAdd {
            opacity: 1;
        }
    }
}

.listsTitle {
    flex: auto;
    font-size: 12px;
    line-height: 38px;
    padding: 0 10px;

    .

mixin-ellipsis-1();
}

.headerBtns {
    flex: none;
    display: flex;
}

.listsAdd {
    // position: absolute;
    // right: 0;
    margin-top: 6px;
    background: none;
    height: 30px;
    border: none;
    outline: none;
    border-radius: @radius-border;
    cursor: pointer;
    opacity: .1;
    transition: opacity @transition-normal;
    color: var(--color-button-font);

    svg {
        vertical-align: bottom;
    }

    &:active {
        opacity: .7 !important;
    }

    &:hover {
        opacity: .6 !important;
    }
}

.listsContent {
    flex: auto;
    min-width: 0;
    overflow-y: scroll !important;
    // border-right: 1px solid rgba(0, 0, 0, 0.12);

    &.sortable {
        * {
            -webkit-user-drag: element;
        }

        .listsItem {
            &:hover, &.active, &.selected, &.clicked {
                background-color: transparent !important;
            }

            &.dragingItem {
                background-color: var(--color-primary-background-hover) !important;
            }
        }
    }
}

.listsItem {
    position: relative;
    transition: .3s ease;
    transition-property: color, background-color, opacity;
    background-color: transparent;

    &:not(.active) {
        &:hover {
            background-color: var(--color-primary-background-hover);
            cursor: pointer;
        }
    }

    &.active {
        // background-color:
        color: var(--color-primary);
    }

    &.selected {
        background-color: var(--color-primary-font-active);
    }

    &.clicked {
        background-color: var(--color-primary-background-hover);
    }

    &.fetching {
        opacity: .5;
    }

    &.editing {
        padding: 0 10px;
        background-color: var(--color-primary-background-hover);

        .listsLabel {
            display: none;
        }

        .listsInput {
            display: block;
        }
    }
}

.activeIcon {
    height: .9em;
    width: .9em;
    margin-left: -0.45em;
    vertical-align: -0.05em;
}

.listsLabel {
    display: block;
    height: @lists-item-height;
    padding: 0 10px;
    font-size: 13px;
    line-height: @lists-item-height;

    .

mixin-ellipsis-1();
}

.listsInput {
    width: 100%;
    height: @lists-item-height;
    // border: none;
    padding: 0;
    // padding-bottom: 1px;
    line-height: @lists-item-height;
    background: none !important;
    border-radius: 0;
    // outline: none;
    font-size: 13px;
    display: none;
    // font-family: inherit;
}

.listsNew {
    padding: 0 10px;
    background-color: var(--color-primary-background-hover) !important;

    .listsInput {
        display: block;
    }
}

.newLeave {
    margin-top: -@lists-item-height;
    z-index: -1;
}


</style>
