<template>
    <div :class="$style.container">
        <material-online-list
            ref="listRef"
            :limit="listDetailInfo.limit"
            :list="listDetailInfo.list"
            :no-item="listDetailInfo.noItemLabel"
            :page="listDetailInfo.page"
            :total="listDetailInfo.total"
            @show-menu="hideListsMenu"
            @play-list="handlePlayList"
            @toggle-page="togglePage"
        />
    </div>
</template>

<script lang="ts" setup>
import {watch} from '@common/utils/vueTools'
import useList from './useList'


const props = defineProps<{
    source: LX.OnlineSource
    boardId?: string
}>()

const emit = defineEmits(['show-menu'])

const {
    listRef,
    listDetailInfo,
    getList,
    handlePlayList,
} = useList()

watch(() => props.boardId, (boardId) => {
    if (!boardId) return
    getList(boardId, 1)
}, {
    immediate: true,
})


const hideListsMenu = () => {
    emit('show-menu')
}

const togglePage = (page: number) => {
    getList(listDetailInfo.id, page)
}

const hideMenu = () => {
    listRef.value.handleMenuClick()
}

defineExpose({hideMenu})


</script>


<style lang="less" module>
.container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
}

.list {
    overflow: hidden;
    height: 100%;
    flex: auto;
}

</style>
