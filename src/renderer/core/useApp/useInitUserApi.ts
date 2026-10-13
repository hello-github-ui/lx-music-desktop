import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { onUserApiStatus, getUserApiList, sendUserApiRequest as sendUserApiRequestRemote, userApiRequestCancel, onShowUserApiUpdateAlert } from '@renderer/utils/ipc'
import { openUrl } from '@common/utils/electron'
import { qualityList, userApi } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { dialog } from '@renderer/plugins/Dialog'
import { setUserApi } from '@renderer/core/apiSource'
import apiSourceInfo from '@renderer/utils/musicSdk/api-source-info'

const sendUserApiRequest: typeof sendUserApiRequestRemote = async(data) => {
    let stop: () => void
    return new Promise<void>((resolve, reject) => {
        stop = watch(() => appSetting['common.apiSource'], () => {
            reject(new Error('source changed'))
        })
        void sendUserApiRequestRemote(data).then(resolve).catch(reject)
    }).finally(() => {
        stop()
    })
}

export default () => {
    const t = useI18n()

    const rUserApiStatus = onUserApiStatus(({ params: { status, message, apiInfo } }) => {
        // console.log({ status, message, apiInfo })
        userApi.status = status
        userApi.message = message

        if (!apiInfo || apiInfo.id !== appSetting['common.apiSource']) return
        if (status) {
            if (apiInfo.sources) {
                let apis: any = {}
                let qualitys: LX.QualityList = {}
                for (const [source, { actions, type, qualitys: sourceQualitys }] of Object.entries(apiInfo.sources)) {
                    if (type != 'music') continue
                    apis[source as LX.Source] = {}
                    for (const action of actions) {
                        switch (action) {
                            case 'musicUrl':
                                apis[source].getMusicUrl = (songInfo: LX.Music.MusicInfo, type: LX.Quality) => {
                                    const requestKey = `request__${Math.random().toString().substring(2)}`
                                    return {
                                        canceleFn() {
                                            userApiRequestCancel(requestKey)
                                        },
                                        promise: sendUserApiRequest({
                                            requestKey,
                                            data: {
                                                source,
                                                action: 'musicUrl',
                                                info: {
                                                    type,
                                                    musicInfo: songInfo,
                                                },
                                            },
                                            // eslint-disable-next-line @typescript-eslint/promise-function-async
                                        }).then(res => {
                                            // console.log(res)
                                            return { type, url: res.data.url }
                                        }).catch(async err => {
                                            console.log(err.message)
                                            return Promise.reject(err)
                                        }),
                                    }
                                }
                                break
                            case 'lyric':
                                apis[source].getLyric = (songInfo: LX.Music.MusicInfo) => {
                                    const requestKey = `request__${Math.random().toString().substring(2)}`
                                    return {
                                        canceleFn() {
                                            userApiRequestCancel(requestKey)
                                        },
                                        promise: sendUserApiRequest({
                                            requestKey,
                                            data: {
                                                source,
                                                action: 'lyric',
                                                info: {
                                                    type,
                                                    musicInfo: songInfo,
                                                },
                                            },
                                            // eslint-disable-next-line @typescript-eslint/promise-function-async
                                        }).then(res => {
                                            // console.log(res)
                                            return res.data
                                        }).catch(async err => {
                                            console.log(err.message)
                                            return Promise.reject(err)
                                        }),
                                    }
                                }
                                break
                            case 'pic':
                                apis[source].getPic = (songInfo: LX.Music.MusicInfo) => {
                                    const requestKey = `request__${Math.random().toString().substring(2)}`
                                    return {
                                        canceleFn() {
                                            userApiRequestCancel(requestKey)
                                        },
                                        promise: sendUserApiRequest({
                                            requestKey,
                                            data: {
                                                source,
                                                action: 'pic',
                                                info: {
                                                    type,
                                                    musicInfo: songInfo,
                                                },
                                            },
                                            // eslint-disable-next-line @typescript-eslint/promise-function-async
                                        }).then(res => {
                                            // console.log(res)
                                            return res.data
                                        }).catch(async err => {
                                            console.log(err.message)
                                            return Promise.reject(err)
                                        }),
                                    }
                                }
                                break
                            default:
                                break
                        }
                    }
                    qualitys[source as LX.Source] = sourceQualitys
                }
                qualityList.value = qualitys
                userApi.apis = apis
            }
        } else {
            if (message) {
                void dialog({
                    message: `${t('user_api__init_failed_alert', { name: apiInfo.name })}\n${message}`,
                    selection: true,
                    confirmButtonText: t('ok'),
                })
            }
        }
        if (!window.lx.apiInitPromise[1]) window.lx.apiInitPromise[2](status)
    })

    const rUserApiShowUpdateAlert = onShowUserApiUpdateAlert(({ params: { name, log, updateUrl } }) => {
        if (updateUrl) {
            void dialog({
                message: `${t('user_api__update_alert', { name })}\n${log}`,
                selection: true,
                showCancel: true,
                confirmButtonText: t('user_api__update_alert_open_url'),
                cancelButtonText: t('close'),
            }).then(confirm => {
                if (!confirm) return
                window.setTimeout(() => {
                    void openUrl(updateUrl)
                }, 300)
            })
        } else {
            void dialog({
                message: `${t('user_api__update_alert', { name })}\n${log}`,
                selection: true,
                confirmButtonText: t('ok'),
            })
        }
    })

    onBeforeUnmount(() => {
        rUserApiStatus()
        rUserApiShowUpdateAlert()
    })

    return async() => {
        // 先加载音源列表，再决定使用哪个音源
        const list = await getUserApiList().catch(err => {
            console.log(err)
            return [] as LX.UserApi.UserApiInfo[]
        })
        userApi.list = list

        // 如果当前配置的音源不可用，自动选中一个可用的内置音源
        const currentSource = appSetting['common.apiSource']
        const builtinList = list.filter(api => /^builtin_/.test(api.id))
        const isCurrentValid = list.some(api => api.id === currentSource) || apiSourceInfo.some(api => api.id === currentSource && !api.disabled)
        if (!isCurrentValid && builtinList.length) {
            // 音源优先级列表（排在前面的优先选中），跳过已知有问题的音源
            const preferredOrder = [
                'builtin_ikun-source',
                'builtin_六音自定义源',
                'builtin_肥猫不肥',
                'builtin_Huibq_lxmusic源',
            ]
            let target = builtinList.find(api => preferredOrder.includes(api.id)) ?? builtinList[0]
            console.log(`当前音源「${currentSource}」不可用，自动切换到内置音源「${target.name}」`)
            await setUserApi(target.id)
        } else {
            await setUserApi(currentSource)
        }
    }
}
