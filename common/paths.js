// 统一封装一个路径工具，用于当前项目下各个路径的管理
const path = require('path')

// paths.js 位于项目根目录的 common 下
const projectRoot = path.resolve(__dirname, '..')

module.exports = {
    projectRoot,
    src: path.join(projectRoot, 'src'),
    dist: path.join(projectRoot, 'dist'),
    buildConfig: path.join(projectRoot, 'build-config'),
    resources: path.join(projectRoot, 'resources'),
    doc: path.join(projectRoot, 'doc'),
    publish: path.join(projectRoot, 'publish')
}
