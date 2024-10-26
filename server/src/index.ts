import dotenv from "dotenv";
dotenv.config({path:"../../.env"})
import express from 'express';
import cors from 'cors';
import {setupColyseus} from "./colyseus.setup";
import {browserCache, browserRooms} from "./browser-cache";
import initializeDB from "./database";
import {apiRouter} from './routes/api';
import path from "path";

const app = express();
app.use(cors({
    origin: '*',
}));
const _log = console.log;
console.log = (...args) => {
    var d = new Date();
    _log(
        `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}:${d.getMilliseconds().toString().padStart(3,"0")}`,
        ...args
    )
}
console.log("initializing ...");

(async()=>{
    if(process.env.DATABASE_URL){
       await initializeDB();
    }
    app.use('/', apiRouter);
    app.use('/public', express.static('public'));
    app.use('/', express.static( path.resolve(__dirname, '../../analytics-frontend/dist') ));
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
        if(browserRooms[roomInstanceId]?.compressed){
            res.set('Content-Length', browserRooms[roomInstanceId].compressed?.length || 0);
            res.set('Content-Type', 'image/png');
            return res.end( browserRooms[roomInstanceId]?.compressed);
        }else{
            return res.status(404).send();
        }
    });
    app.get("/api/hello", (req,res)=>{
        console.log("Hello debug");
        return res.send("hello");
    })

    setupColyseus({}, app);
})();
