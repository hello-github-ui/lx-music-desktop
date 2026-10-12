/**
 * 下载并解压 Vue DevTools Chrome 扩展到 build-config/lib/vue-devtools/
 *
 * 用法（需要代理已启动）:
 *   node build-config/download-devtools.js
 *   node build-config/download-devtools.js --proxy http://127.0.0.1:10809
 */

const https = require('https')
const http = require('http')
const { URL } = require('url')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Vue.js devtools on Chrome Web Store
const EXTENSION_ID = 'ljjemllljcmkfkkllppngbabpchapdnh'
const CRX_URL = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120&x=id%3D${EXTENSION_ID}%26installsource%3Dondemand%26uc`
const OUT_DIR = path.join(__dirname, 'lib', 'vue-devtools')

// 解析命令行参数
let proxyUrl = 'http://127.0.0.1:10809' // 默认 HTTP 代理端口
const proxyIdx = process.argv.indexOf('--proxy')
if (proxyIdx !== -1 && process.argv[proxyIdx + 1]) {
    proxyUrl = process.argv[proxyIdx + 1]
}

function download(url, proxy) {
    return new Promise((resolve, reject) => {
        const target = new URL(url)
        const proxyUrlParsed = new URL(proxy)
        const options = {
            hostname: proxyUrlParsed.hostname,
            port: proxyUrlParsed.port,
            path: url,
            method: 'GET',
            headers: {
                Host: target.hostname,
            },
        }
        const req = http.request(options, (res) => {
            // 处理重定向
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume()
                const nextUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : new URL(res.headers.location, url).href
                download(nextUrl, proxy).then(resolve).catch(reject)
                return
            }
            if (res.statusCode !== 200) {
                res.resume()
                reject(new Error(`HTTP ${res.statusCode}`))
                return
            }
            const chunks = []
            res.on('data', c => chunks.push(c))
            res.on('end', () => resolve(Buffer.concat(chunks)))
        })
        req.on('error', reject)
        req.end()
    })
}

function stripCrxHeader(buf) {
    if (buf.toString('ascii', 0, 4) !== 'Cr24') {
        throw new Error('Not a valid CRX file (missing Cr24 magic header)')
    }
    const version = buf.readUInt32LE(4)
    let zipStart
    if (version === 2) {
        const pubKeyLen = buf.readUInt32LE(8)
        const sigLen = buf.readUInt32LE(12)
        zipStart = 16 + pubKeyLen + sigLen
    } else if (version === 3) {
        const headerLen = buf.readUInt32LE(8)
        zipStart = 12 + headerLen
    } else {
        throw new Error(`Unsupported CRX version: ${version}`)
    }
    return buf.slice(zipStart)
}

async function main() {
    console.log(`Downloading Vue DevTools via proxy ${proxyUrl} ...`)
    const crxBuf = await download(CRX_URL, proxyUrl)

    if (crxBuf.toString('ascii', 0, 4) !== 'Cr24') {
        console.error('Downloaded file is not a CRX. First bytes:', crxBuf.slice(0, 20).toString())
        console.error('Make sure the proxy is running and can reach clients2.google.com')
        process.exit(1)
    }

    console.log(`Downloaded ${crxBuf.length} bytes, extracting...`)
    const zipBuf = stripCrxHeader(crxBuf)

    // 清空输出目录
    fs.rmSync(OUT_DIR, { recursive: true, force: true })
    fs.mkdirSync(OUT_DIR, { recursive: true })

    // 写入临时 zip 文件，用 PowerShell 的 Expand-Archive 解压
    const tmpZip = path.join(__dirname, 'lib', 'vue-devtools-tmp.zip')
    fs.writeFileSync(tmpZip, zipBuf)

    try {
        execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${tmpZip}' -DestinationPath '${OUT_DIR}' -Force"`, { stdio: 'inherit' })
        fs.unlinkSync(tmpZip)
        console.log(`Done! Extension extracted to ${OUT_DIR}`)
        console.log('You can now run npm run dev to use Vue DevTools.')
    } catch (err) {
        fs.unlinkSync(tmpZip)
        throw err
    }
}

main().catch(err => {
    console.error('Failed:', err.message)
    process.exit(1)
})
