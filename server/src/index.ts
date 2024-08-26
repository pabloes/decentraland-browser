// src/server.ts
import dotenv from "dotenv";
dotenv.config({path:"../../.env"})
import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import cors from 'cors';
import puppeteer from 'puppeteer';
import * as fs from "fs";
import {promisify} from "util";
import {setupColyseus} from "./colyseus.setup";
const readFileAsync:any = promisify(fs.readFile);
const sleep = ms => new Promise((res:Function) => setTimeout(res, ms));
import * as https from "https";
import browserCache from "./browser-cache";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

let lastCacheKey = "";

console.log("initializing ...");
const CACHE_TIME_MS = 60000*10;

(async()=>{
    app.get("/api/screenshot", async(req,res)=>{
        const {url="", width = 1280, height = 800, page = 0} = req.query;
        const _url:string = url as string;
        const cacheKey = _url+width.toString()+height.toString();
        if(browserCache[cacheKey]){
            res.set('Content-Length', browserCache[cacheKey].screenshotBuffers[page]?.length);
            res.set('Content-Type', 'image/png');
            return res.end(browserCache[cacheKey].screenshotBuffers[page]);
        }else{
            return res.status(404).send();
        }
    });

    setupColyseus({}, app);
})();
