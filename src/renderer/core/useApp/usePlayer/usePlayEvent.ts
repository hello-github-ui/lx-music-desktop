import { onBeforeUnmount } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
import { setStop, isEmpty, setResource, setPlay } from '@renderer/plugins/player'
import { playNext, setMusicUrl } from '@renderer/core/player'
import { setAllStatus } from '@renderer/store/player/action'
import { appSetting } from '@renderer/store/setting'
import { getOtherSource, getOnlineOtherSourceMusicUrl } from '@renderer/core/music/utils'
import { setUserApi } from '@renderer/core/apiSource'
import { userApi } from '@renderer/store'

export default () => {
    const t = useI18n()
    let retryNum = 0
    let toggleSourceRetryNum = 0
    let builtinSourceRetryNum = 0
    let prevTimeoutId: string | null = null

    let loadingTimeout: NodeJS.Timeout | null = null
    let delayNextTimeout: NodeJS.Timeout | null = null
    const startLoadingTimeout = () => {
        clearLoadingTimeout()
        loadingTimeout = setTimeout(() => {
            if (window.lx.isPlayedStop) {
                prevTimeoutId = null
                setAllStatus('')
                return
            }

            // 如果加载超时，则尝试刷新URL
            if (prevTimeoutId == musicInfo.id) {
                prevTimeoutId = null
                void playNext(true)
            } else {
                prevTimeoutId = musicInfo.id
                if (playMusicInfo.musicInfo) setMusicUrl(playMusicInfo.musicInfo, true)
            }
        }, 25000)
    }
    const clearLoadingTimeout = () => {
        if (!loadingTimeout) return
        clearTimeout(loadingTimeout)
        loadingTimeout = null
    }

    const clearDelayNextTimeout = () => {
        if (!delayNextTimeout) return
        clearTimeout(delayNextTimeout)
        delayNextTimeout = null
    }
    const addDelayNextTimeout = () => {
        clearDelayNextTimeout()
        delayNextTimeout = setTimeout(() => {
            if (window.lx.isPlayedStop) {
                setAllStatus('')
                return
            }
            void playNext(true)
        }, 5000)
    }

    // 自动换源：搜索同一歌曲在其他平台的音源并尝试播放
    const tryToggleSource = async() => {
        const currentMusic = playMusicInfo.musicInfo
        if (!currentMusic) return false
        try {
            setAllStatus(t('toggle_source_try'))
            const otherSources = await getOtherSource(currentMusic)
            if (!otherSources.length) return false

            const currentSource = ('progress' in currentMusic ? currentMusic.metadata.musicInfo.source : currentMusic.source) as LX.OnlineSource
            const { url } = await getOnlineOtherSourceMusicUrl({
                musicInfos: [...otherSources],
                onToggleSource: () => {},
                isRefresh: true,
                retryedSource: [currentSource],
            })
            if (window.lx.isPlayedStop) return false
            console.log('[autoToggleSource] success, playing from other source')
            setResource(url)
            setPlay()
            return true
        } catch (err) {
            console.log('[autoToggleSource] failed:', (err as Error).message)
            return false
        }
    }

    // 自动切换到下一个内置音源并重试播放
    const tryNextBuiltinSource = async() => {
        const currentMusic = playMusicInfo.musicInfo
        if (!currentMusic) return false
        const builtinList = userApi.list.filter(api => /^builtin_/.test(api.id))
        if (builtinList.length < 2) return false

        // 从当前音源之后开始找下一个可用的（跳过当前音源）
        const currentId = appSetting['common.apiSource']
        const startIndex = builtinList.findIndex(api => api.id === currentId)
        // 已尝试的音源数量 +1，用于从列表中取下一个
        const tryOffset = builtinSourceRetryNum + 1
        const nextIndex = (startIndex + tryOffset) % builtinList.length
        const nextSource = builtinList[nextIndex]
        if (nextSource.id === currentId) return false

        console.log(`[autoBuiltinSource] 切换音源: ${currentId} -> ${nextSource.id} (${nextSource.name})`)
        setAllStatus(`切换到音源「${nextSource.name}」...`)
        try {
            await setUserApi(nextSource.id)
            if (window.lx.isPlayedStop) return false
            // 切换音源后重新获取URL播放
            setMusicUrl(currentMusic, true)
            return true
        } catch (err) {
            console.log('[autoBuiltinSource] 切换失败:', (err as Error).message)
            return false
        }
    }

    const handleLoadstart = () => {
        if (window.lx.isPlayedStop) return
        if (appSetting['player.autoSkipOnError']) startLoadingTimeout()
        setAllStatus(t('player__loading'))
    }

    const handleLoadeddata = () => {
        setAllStatus(t('player__loading'))
    }

    const handlePlaying = () => {
        setAllStatus('')
        clearLoadingTimeout()
    }

    const handleEmpied = () => {
        clearDelayNextTimeout()
        clearLoadingTimeout()
    }

    const handleWating = () => {
        setAllStatus(t('player__buffering'))
    }

    const handleError = (errCode?: number) => {
        if (!musicInfo.id) return
        clearLoadingTimeout()
        if (window.lx.isPlayedStop) return
        if (!isEmpty()) setStop()

        // 第一阶段：同源重试 2 次（重新请求当前音源的 URL）
        if (playMusicInfo.musicInfo && errCode !== 1 && retryNum < 2) {
            retryNum++
            setMusicUrl(playMusicInfo.musicInfo, true)
            setAllStatus(t('player__refresh_url'))
            return
        }

        // 第二阶段：同源重试失败后，搜索其他平台音源
        if (playMusicInfo.musicInfo && errCode !== 1 && toggleSourceRetryNum < 1) {
            toggleSourceRetryNum++
            void tryToggleSource().then((success) => {
                if (success) return
                // 第三阶段：跨平台换源也失败，尝试切换到下一个内置音源
                void tryNextBuiltinSource().then((switched) => {
                    if (switched) return
                    handleFatalError()
                })
            })
            return
        }

        // 第三阶段重试：切换音源后再次报错，尝试下一个内置音源
        if (playMusicInfo.musicInfo && errCode !== 1 && builtinSourceRetryNum < 5) {
            builtinSourceRetryNum++
            void tryNextBuiltinSource().then((switched) => {
                if (switched) return
                handleFatalError()
            })
            return
        }

        handleFatalError()
    }

    const handleFatalError = () => {
        if (appSetting['player.autoSkipOnError']) {
            if (document.hidden) {
                console.warn('error skip to next')
                void playNext(true)
            } else {
                setAllStatus(t('player__error'))
                setTimeout(addDelayNextTimeout)
            }
        }
    }

    const handleSetPlayInfo = () => {
        retryNum = 0
        toggleSourceRetryNum = 0
        builtinSourceRetryNum = 0
        prevTimeoutId = null
        clearDelayNextTimeout()
        clearLoadingTimeout()
    }


    window.app_event.on('playerLoadstart', handleLoadstart)
    window.app_event.on('playerLoadeddata', handleLoadeddata)
    window.app_event.on('playerPlaying', handlePlaying)
    window.app_event.on('playerWaiting', handleWating)
    window.app_event.on('playerEmptied', handleEmpied)
    window.app_event.on('playerError', handleError)
    window.app_event.on('musicToggled', handleSetPlayInfo)

    onBeforeUnmount(() => {
        window.app_event.off('playerLoadstart', handleLoadstart)
        window.app_event.off('playerLoadeddata', handleLoadeddata)
        window.app_event.off('playerPlaying', handlePlaying)
        window.app_event.off('playerWaiting', handleWating)
        window.app_event.off('playerEmptied', handleEmpied)
        window.app_event.off('playerError', handleError)
        window.app_event.off('musicToggled', handleSetPlayInfo)
    })
}
