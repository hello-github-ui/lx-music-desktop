import {createDownloadWorker, createMainWorker} from './utils'


export default () => {
    return {
        main: createMainWorker(),
        download: createDownloadWorker(),
    }
}

