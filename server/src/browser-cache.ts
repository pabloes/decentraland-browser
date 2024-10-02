type BrowserCache = {
    [cacheKey:string]:{
        fullHeight:number,
        screenshotBuffers:any[],
        timestamp:number
    }
}

const browserCache:BrowserCache = {};

export default browserCache;