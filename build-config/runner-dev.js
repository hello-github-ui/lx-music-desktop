process.env.NODE_ENV = 'development'

// 引入统一路径工具
const paths = require('../common/paths')
const chalk = require('chalk')
const electron = require('electron')
const path = require('path')
// const { say } = require('cfonts')
const {spawn} = require('child_process')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackHotMiddleware = require('webpack-hot-middleware')

const mainConfig = require(paths.buildConfig + '/main/webpack.config.dev')
const rendererConfig = require(paths.buildConfig + '/renderer/webpack.config.dev')
const rendererLyricConfig = require(paths.buildConfig + '/renderer-lyric/webpack.config.dev')
const rendererScriptConfig = require(paths.buildConfig + '/renderer-scripts/webpack.config.dev')
const {Arch} = require('electron-builder')
const replaceLib = require(paths.buildConfig + '/build-before-pack')
const treeKill = require('tree-kill')
const {debounce} = require(paths.buildConfig + '/utils')

let electronProcess = null
let hotMiddlewareRenderer
let hotMiddlewareRendererLyric

// 复制 build-config/lib 下的 vue-devtools 整体复制到 dist 目录下
const fs = require('node:fs/promises');
// const path2 = require('node:path');

async function copyLibToDist() {
    // runner-dev.js __dirname: C:\Users\EDY\code\lx-music-desktop\build-config
    console.log(`runner-dev.js __dirname: ${__dirname}`);
    // const source = path2.join(__dirname, "../build-config/lib/vue-devtools");
    const source = paths.buildConfig + "/lib/vue-devtools"
    // const destination = path2.join(__dirname, "../dist/build-config/lib/vue-devtools");
    const destination = paths.dist + "/build-config/lib/vue-devtools"
    await fs.cp(source, destination, {
        recursive: true,
        force: true,
    });
}


function startRenderer() {
    return new Promise((resolve, reject) => {
        // rendererConfig.entry.renderer = [path.join(__dirname, 'dev-client')].concat(rendererConfig.entry.renderer)
        // rendererConfig.mode = 'development'
        const compiler = webpack(rendererConfig)
        hotMiddlewareRenderer = webpackHotMiddleware(compiler, {
            log: false,
            heartbeat: 2500,
        })

        compiler.hooks.compilation.tap('compilation', compilation => {
            // console.log(Object.keys(compilation.hooks))
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('html-webpack-plugin-after-emit', (data, cb) => {
                hotMiddlewareRenderer.publish({action: 'reload'})
                cb()
            })
        })

        // compiler.hooks.done.tap('done', stats => {
        //   // logStats('Renderer', 'Compile done')
        //   // logStats('Renderer', stats)
        // })

        const server = new WebpackDevServer({
            port: 9080,
            hot: true,
            historyApiFallback: true,
            static: {
                directory: path.join(__dirname, '../src/common/theme/images'),
                publicPath: '/theme_images',
            },
            client: {
                logging: 'warn',
                overlay: true,
            },
            setupMiddlewares(middlewares, devServer) {
                devServer.app.use(hotMiddlewareRenderer)
                setImmediate(() => {
                    devServer.middleware.waitUntilValid(resolve)
                })

                return middlewares
            },
        }, compiler)

        server.start()
    })
}

function startRendererLyric() {
    return new Promise((resolve, reject) => {
        // rendererConfig.entry.renderer = [path.join(__dirname, 'dev-client')].concat(rendererConfig.entry.renderer)
        // rendererConfig.mode = 'development'
        const compiler = webpack(rendererLyricConfig)
        hotMiddlewareRendererLyric = webpackHotMiddleware(compiler, {
            log: false,
            heartbeat: 2500,
        })

        compiler.hooks.compilation.tap('compilation', compilation => {
            // console.log(Object.keys(compilation.hooks))
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('html-webpack-plugin-after-emit', (data, cb) => {
                hotMiddlewareRendererLyric.publish({action: 'reload'})
                cb()
            })
        })

        // compiler.hooks.done.tap('done', stats => {
        //   // logStats('Renderer', 'Compile done')
        //   // logStats('Renderer', stats)
        // })

        const server = new WebpackDevServer({
            port: 9081,
            hot: true,
            historyApiFallback: true,
            // static: {
            //   directory: path.join(__dirname, '../'),
            // },
            client: {
                logging: 'warn',
                overlay: true,
            },
            setupMiddlewares(middlewares, devServer) {
                devServer.app.use(hotMiddlewareRenderer)
                setImmediate(() => {
                    devServer.middleware.waitUntilValid(resolve)
                })
                return middlewares
            },
        }, compiler)

        server.start()
    })
}

function startRendererScripts() {
    return new Promise((resolve, reject) => {
        // mainConfig.entry.main = [path.join(__dirname, '../src/main/index.dev.js')].concat(mainConfig.entry.main)
        // mainConfig.mode = 'development'
        const compiler = webpack(rendererScriptConfig)

        compiler.watch({}, (err, stats) => {
            if (err) {
                console.log(err)
                return
            }
            resolve()
        })
    })
}

function startMain() {
    let firstRun = true
    return new Promise((resolve, reject) => {
        // mainConfig.entry.main = [path.join(__dirname, '../src/main/index.dev.js')].concat(mainConfig.entry.main)
        // mainConfig.mode = 'development'
        const runElectronDelay = debounce(startElectron, 200)
        const compiler = webpack(mainConfig)

        compiler.hooks.watchRun.tapAsync('watch-run', (compilation, done) => {
            hotMiddlewareRenderer.publish({action: 'compiling'})
            hotMiddlewareRendererLyric.publish({action: 'compiling'})
            done()
        })

        compiler.watch({}, async (err, stats) => {
            if (err || stats.hasErrors()) {
                console.error(err || stats.toString({errors: true}));
                if (firstRun) reject(err || new Error('Main 编译失败'));
                return;
            }

            try {
                await copyLibToDist();
                console.log('复制 build-config/lib/vue-devtools 到 dist/build-config/lib/vue-devtools 成功')
            } catch (copyErr) {
                console.error('复制 vue-devtools 到 dist 失败：', copyErr);
                if (firstRun) reject(copyErr);
                return;
            }

            // logStats('Main', stats)
            if (electronProcess) {
                electronProcess.removeAllListeners()
                treeKill(electronProcess.pid)
            }
            if (firstRun) {
                firstRun = false
                resolve()
            } else runElectronDelay()
        })
    })
}

function startElectron() {
    let args = [
        '--inspect=5858',
        // 'NODE_ENV=development',
        path.join(__dirname, '../dist/main.js'),
    ]

    // detect yarn or npm and process commandline args accordingly
    if (process.env.npm_execpath.endsWith('yarn.js')) {
        args = args.concat(process.argv.slice(3))
    } else if (process.env.npm_execpath.endsWith('npm-cli.js')) {
        args = args.concat(process.argv.slice(2))
    }

    electronProcess = spawn(electron, args)

    electronProcess.stdout.on('data', data => {
        electronLog(data, 'blue')
    })
    electronProcess.stderr.on('data', data => {
        electronLog(data, 'red')
    })

    electronProcess.on('close', () => {
        process.exit()
    })
}

const logs = [
    'Manifest version 2 is deprecated, and support will be removed in 2023',
    '"Extension server error: Operation failed: Permission denied", source: devtools://devtools/bundled',

    // https://github.com/electron/electron/issues/32133
    '"Electron sandbox_bundle.js script failed to run"',
    '"TypeError: object null is not iterable (cannot read property Symbol(Symbol.iterator))",',

    // Node.js --inspect 调试器提示
    'Debugger listening on ws://127.0.0.1:5858',
    'For help, see: https://nodejs.org/learn/getting-started/debugging',

    // Electron 扩展 API 弃用警告
    "session.getAllExtensions' is deprecated",
]

function electronLog(data, color) {
    let log = data.toString()
    if (/[0-9A-z]+/.test(log)) {
        // 抑制某些无关的报错日志
        if (color == 'red' && typeof log === 'string' && logs.some(l => log.includes(l))) return

        console.log(chalk[color](log))
    }
}

function init() {
    const Spinnies = require('spinnies')
    const spinners = new Spinnies({color: 'blue'})
    spinners.add('main', {text: 'main compiling'})
    spinners.add('renderer', {text: 'renderer compiling'})
    spinners.add('renderer-lyric', {text: 'renderer-lyric compiling'})
    spinners.add('renderer-scripts', {text: 'renderer-scripts compiling'})

    function handleSuccess(name) {
        spinners.succeed(name, {text: name + ' compile success!'})
    }

    function handleFail(name) {
        spinners.fail(name, {text: name + ' compile fail!'})
    }

    replaceLib({electronPlatformName: process.platform, arch: Arch[process.arch]})

    Promise.all([
        startRenderer().then(() => handleSuccess('renderer')).catch((err) => {
            console.error(err.message)
            return handleFail('renderer')
        }),
        startRendererLyric().then(() => handleSuccess('renderer-lyric')).catch((err) => {
            console.error(err.message)
            return handleFail('renderer-lyric')
        }),
        startRendererScripts().then(() => handleSuccess('renderer-scripts')).catch((err) => {
            console.error(err.message)
            return handleFail('renderer-scripts')
        }),
        startMain().then(() => handleSuccess('main')).catch(() => handleFail('main')),
    ]).then(startElectron).catch(err => {
        console.error(err)
    })
}

init()
