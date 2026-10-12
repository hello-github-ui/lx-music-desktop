/**
 * This file is used specifically and only for development. It installs
 * `electron-debug`. There shouldn't be any need to modify this file,
 * but it can be used to extend your development environment.
 */

import { app } from 'electron'
import electronDebug from 'electron-debug'
import { openDevTools } from './utils'

// Install `electron-debug` with `devtron`
electronDebug({
    showDevTools: false,
    devToolsMode: 'undocked',
})

// Open devtools for windows
app.on('ready', () => {
    global.lx.event_app.on('main_window_created', (win) => {
        openDevTools(win.webContents)
    })
    global.lx.event_app.on('desktop_lyric_window_created', (win) => {
        openDevTools(win.webContents)
    })
})

// Require `main` process to boot app
require('./index')
