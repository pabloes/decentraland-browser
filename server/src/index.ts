import dotenv from "dotenv";
dotenv.config({path:"../../.env"})
import express from 'express';
import cors from 'cors';
import {setupColyseus} from "./colyseus.setup";
import browserCache from "./browser-cache";
import {sleep} from "./util/sleep";

const app = express();
app.use(cors({
    origin: '*',
}));

const PORT = process.env.PORT || 3000;

let lastCacheKey = "";

console.log("initializing ...");
const CACHE_TIME_MS = 60000*10;

(async()=>{
    app.get("/api/screenshot", async(req,res)=>{
        const {url="", width = "1280", height = "800", page = "0"} = req.query;
        const _url:string = url as string;
        const cacheKey = _url+width.toString()+height.toString();
        console.log("/api/screenshot", _url);
        if(browserCache[cacheKey]){
            res.set('Content-Length', browserCache[cacheKey].screenshotBuffers[Number(page)]?.length);
            res.set('Content-Type', 'image/png');
            await sleep(200);//TODO remove latency simulation
            return res.end(browserCache[cacheKey].screenshotBuffers[Number(page)]);
        }else{
            return res.status(404).send();
        }
    });
    app.get("/api/hello", (req,res)=>{
        return res.send("hello");
    })

    setupColyseus({}, app);
})();
