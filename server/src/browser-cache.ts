type BrowserCache = {
    [cacheKey:string]:{
        fullHeight:number,
        screenshotBuffers:any[],
        timestamp:number
    }
}

export const browserCache:BrowserCache = {};

export const browserRooms:any = {};//TODO