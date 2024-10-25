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
        const {roomInstanceId, pageSection} = req.query as {roomInstanceId?:string, pageSection?:string};
        const pageSectionNumber = Number(pageSection);
        if(browserRooms[roomInstanceId]?.sections[pageSectionNumber]){
            res.set('Content-Length', browserRooms[roomInstanceId]?.sections[pageSectionNumber]?.length || 0);
            res.set('Content-Type', 'image/png');
            return res.end( browserRooms[roomInstanceId]?.sections[pageSectionNumber]);
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
