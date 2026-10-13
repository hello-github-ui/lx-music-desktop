/**
 * This file is used specifically and only for development. It installs
 * `electron-debug`. There shouldn't be any need to modify this file,
 * but it can be used to extend your development environment.
 */

import {app} from 'electron'
import path from 'path'
import electronDebug from 'electron-debug'
import {openDevTools} from './utils'

// Install `electron-debug`
electronDebug({
    showDevTools: false,
    devToolsMode: 'undocked',
})

// 本地 Vue DevTools 扩展目录（由 npm run download-devtools 下载解压生成）
// 获取进程启动时所在的工作目录
const projectDir = process.cwd().replaceAll('\\', '/');
console.log(`进程启动时所在的工作目录: ${projectDir}`)
const vueDevtoolsPath = path.join(__dirname, '/build-config/lib/vue-devtools')

async function loadVueDevtools(targetSession: Electron.Session) {
    try {
        await targetSession.extensions.loadExtension(vueDevtoolsPath, {allowFileAccess: true})
        console.log('[devtools] Vue DevTools loaded')
    } catch (err) {
        // 扩展目录不存在或已加载时静默跳过
        const msg = (err as Error).message
        if (!msg.includes('already loaded') && !msg.includes('ENOENT')) {
            // [devtools] Vue DevTools skipped: Extension directory
            // not found: C:\Users\EDY\code\lx-music-desktop\dist\build-config\lib\vue-devtools
            console.log('[devtools] Vue DevTools skipped:', msg)
        }
    }
}

// Open devtools for windows
app.on('ready', () => {
    global.lx.event_app.on('main_window_created', (win) => {
        openDevTools(win.webContents)
        void loadVueDevtools(win.webContents.session)
    })
    global.lx.event_app.on('desktop_lyric_window_created', (win) => {
        openDevTools(win.webContents)
        void loadVueDevtools(win.webContents.session)
    })
})

// Require `main` process to boot app
require('./index')
