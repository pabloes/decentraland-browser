type BrowserCache = {
    [cacheKey:string]:{
        fullHeight:number,
        screenshotBuffers:[],
        timestamp:number
    }
}

const browserCache:BrowserCache = {};

export default browserCache;