import dotenv from "dotenv";
dotenv.config({path:"../../.env"})
import express from 'express';
import cors from 'cors';
import {setupColyseus} from "./colyseus.setup";
import {browserCache, browserRooms} from "./browser-cache";

const app = express();
app.use(cors({
    origin: '*',
}));

console.log("initializing ...");

(async()=>{
    app.get("/api/screenshot", async(req,res)=>{
        const {url="", width = "1280", height = "800", page = "0"} = req.query;
        const _url:string = url as string;
        const cacheKey = _url+width.toString()+height.toString();
        console.log("/api/screenshot", _url);
        if(browserCache[cacheKey]){
            res.set('Content-Length', browserCache[cacheKey].screenshotBuffers[Number(page)]?.length);
            res.set('Content-Type', 'image/png');
            return res.end(browserCache[cacheKey].screenshotBuffers[Number(page)]);
        }else{
            return res.status(404).send();
        }
    });
    app.get("/api/screenshot2", async(req,res)=>{
        const {roomInstanceId} = req.query as {roomInstanceId:string};
        if(browserRooms[roomInstanceId]?.screenshot){
            res.set('Content-Length', browserRooms[roomInstanceId].screenshot?.length || 0);
            res.set('Content-Type', 'image/png');
            return res.end( browserRooms[roomInstanceId]?.screenshot);
        }else{
            return res.status(404).send();
        }
    });
    app.get("/api/hello", (req,res)=>{
        return res.send("hello");
    })

    setupColyseus({}, app);
})();
