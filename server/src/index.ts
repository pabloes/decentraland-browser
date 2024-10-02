import dotenv from "dotenv";
dotenv.config({path:"../../.env"})
import express from 'express';
import cors from 'cors';
import {setupColyseus} from "./colyseus.setup";
import browserCache from "./browser-cache";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

let lastCacheKey = "";

console.log("initializing ...");
const CACHE_TIME_MS = 60000*10;

(async()=>{
    app.get("/api/screenshot", async(req,res)=>{
        const {url="", width = "1280", height = "800", page = "0"} = req.query;
        const _url:string = url as string;
        const cacheKey = _url+page+width.toString()+height.toString();
        console.log("cacheKey",cacheKey);
        if(browserCache[cacheKey]){
            res.set('Content-Length', browserCache[cacheKey].screenshotBuffers[Number(page)]?.length);
            res.set('Content-Type', 'image/png');
            return res.end(browserCache[cacheKey].screenshotBuffers[Number(page)]);
        }else{
            return res.status(404).send();
        }
    });

    setupColyseus({}, app);
})();
