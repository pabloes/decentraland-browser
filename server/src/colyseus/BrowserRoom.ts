import {Client, Room} from "colyseus";
import { Schema, Context, ArraySchema, MapSchema, type } from "@colyseus/schema";
import puppeteer, {Browser, Page} from "puppeteer";
import browserCache from "../browser-cache";
import {sleep} from "../../../util/sleep";

class BrowserState extends Schema {
    @type("string")
    url: string = "foo";
    @type("number")
    width:number = 1024;
    @type("number")
    height = 768;
    @type("number")
    fullHeight = 768;
    @type("number")
    timestamp = 0;
    @type("number")
    currentPage = 0;
    @type("boolean")
    loadingPage = false;
    @type("boolean")
    firstPageAvailable = false;


    constructor({url, width, height,loadingPage}:any) {
        super();
        this.url = url;
        this.width = width;
        this.height = height;
        this.loadingPage = loadingPage;
        this.firstPageAvailable = false;
    }
}

const CACHE_TIME_MS = 60000*5;

export class BrowserRoom extends Room<BrowserState> {
    browser:Browser;
    page:Page;

    async onCreate ({url, width, height}: any) {
        this.setState(new BrowserState({url,width, height, loadingPage:true}));

        this.onMessage("UP", async (client)=>{
            console.log("UP")
            this.state.currentPage--;
            await this.page!.evaluate((currentPage, viewportHeight) => window.scrollTo(0, currentPage * viewportHeight), this.state.currentPage, this.state.height);
        });

        this.onMessage("DOWN", async (client)=>{
            console.log("DOWN")
            this.state.currentPage++;
            await this.page!.evaluate((currentPage, viewportHeight) => window.scrollTo(0, currentPage * viewportHeight), this.state.currentPage, this.state.height);
        });

        this.onMessage("CLICK", async (client, {normalizedX,normalizedY})=>{
            const {width,height} = this.state;
            this.state.firstPageAvailable = false;
            await this.page!.evaluate((currentPage, viewportHeight) => window.scrollTo(0, currentPage * viewportHeight), this.state.currentPage, this.state.height);
            await sleep(500);
            await this.page!.mouse.click(Number(normalizedX)*width,Number(normalizedY)*height);
            this.state.loadingPage = true;
            await this.page!.waitForNavigation();
            this.state.url = this.page.url();
            console.log( this.state.url)
            this.state.currentPage = 0;
            this.takeScreenshots()
        });

        this.browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            headless: false
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width:Number(width),height:Number(height)} as any);
        await this.takeScreenshots();

    }

    async takeScreenshots({url,width,height} = this.state){

        const cacheKey = url+width.toString()+height.toString();
        const mustAvoidCache = !browserCache[cacheKey] || (Date.now() - browserCache[cacheKey]?.timestamp) >= CACHE_TIME_MS
        if(mustAvoidCache){
            this.state.loadingPage = true;
            await this.page.goto(this.state.url, { waitUntil: 'networkidle2' }); // Wait until the network is idle //TODO OR 5 seconds
            const dimensions = await this.page.evaluate(() => {
                return {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight,
                    fullHeight: document.body.scrollHeight
                };
            });

            const viewportHeight = dimensions.height;
            const fullHeight = dimensions.fullHeight;
            const numScreenshots = Math.ceil(fullHeight / viewportHeight);
            let screenshotBuffers:any = [];
            this.state.fullHeight = fullHeight;

            for (let i = 0; i < numScreenshots; i++) {
                if(i>0){
                    await this.page.evaluate((i, viewportHeight) => {
                        window.scrollTo(0, i * viewportHeight);
                    }, i, viewportHeight);
                    await sleep(500);
                }
                // Wait for the page to scroll
                screenshotBuffers.push(await this.page.screenshot());
                if(!i){
                    browserCache[cacheKey] = { fullHeight, timestamp:Date.now(), screenshotBuffers};
                    this.state.firstPageAvailable = true;
                }
            }
            //TODO, we should detect scroll space to make
            browserCache[cacheKey] = { fullHeight, timestamp:Date.now(), screenshotBuffers};
        }else{
            this.state.firstPageAvailable = true;
            this.state.loadingPage = false;
            this.state.fullHeight = browserCache[cacheKey].fullHeight;
        }

        this.state.loadingPage = false;
        console.log("loaded page")
    }

    onJoin(){
        console.log("join");
    }

    onDispose() {
        this.browser.close();
        console.log("Disposing room...");
    }
}