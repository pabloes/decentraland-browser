import { Client, Room } from "colyseus";
import { Schema, type } from "@colyseus/schema";
import puppeteer, { Browser, Page } from "puppeteer";
import browserCache from "../browser-cache";
import {sleep} from "../util/sleep";

const MAXIMUM_SCROLL = 10;
const HEADLESS = true;

class BrowserState extends Schema {
    @type("string")
    url: string = "foo";
    width: number = 1024;
    height: number = 768;
    @type("number")
    fullHeight: number = 768;
    @type("number")
    currentPage: number = 0;
    @type("boolean")
    loadingPage: boolean = false;
    @type("boolean")
    idle: boolean = false; // Indicates whether the user can interact
    screenshotsDate:number = 0;
    executingClick:boolean = false;
    takingScreenshots:boolean = false;

    constructor({ url, width, height, loadingPage }: any) {
        super();
        this.url = url;
        this.width = width;
        this.height = height;
        this.loadingPage = loadingPage;
    }
}

export class BrowserRoom extends Room<BrowserState> {
    private browser: Browser;
    private page: Page;

    async onCreate(options: any) {
        const { url, width, height } = options;
        this.setState(new BrowserState({ url, width, height, loadingPage: true }));
        this.registerMessageHandlers();
        await this.initializeBrowser(width, height, url);

        this.takeScreenshots();
        if(HEADLESS){
            setInterval(async ()=>{
                if(!this.state.takingScreenshots){
                    //TODO refactor this repeated code
                    const {url,width,height} = this.state;
                    const cacheKey = `${url}${width}${height}`;
                    if(!browserCache[cacheKey]) return;
                    browserCache[cacheKey].screenshotBuffers[this.state.currentPage] = await this.page.screenshot();
                    this.broadcast("SCREENSHOT", {width, height, url, page: this.state.currentPage});
                }
            },1000);
        }

    }

    private registerMessageHandlers() {
        this.onMessage("UP", this.handleUpMessage.bind(this));
        this.onMessage("DOWN", this.handleDownMessage.bind(this));
        this.onMessage("CLICK", this.handleClickMessage.bind(this));
    }

    private async initializeBrowser(width: number, height: number, url:string) {
        console.log("Opening browser...");
        this.browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            headless: HEADLESS,
            args: [`--window-size=${width+20},${height+100}`],
        });
        console.log("Browser opened.");
        const pages = await this.browser.pages();
        this.page = pages[0];
        await this.page.setViewport({ width: Number(width), height: Number(height) });
        await this.page.goto(url, { waitUntil: "networkidle2" });
        console.log("browser initialized");
        this.setupNavigationListener();
    }

    private setupNavigationListener() {
        this.page.on('framenavigated', async (frame) => {
            const frameURL = frame.url();

            if (frame === this.page.mainFrame()) {
                if(frameURL !== this.state.url){
                    console.log("before framenavigated",this.state.url)
                    console.log("after framenavigated",frameURL)
                    this.state.url = frame.url();
                    this.state.currentPage = 0;
                    this.state.idle = false;
                    console.log("waiting click");
                    await this.waitClick();
                    console.log("waited click");
                    await this.page.waitForNetworkIdle({idleTime:1000});

                    await this.takeScreenshots();
                }
            }
        });
    }

    private async handleUpMessage(client: Client) {
        this.state.takingScreenshots = true;
        console.log("UP");
        this.state.currentPage--;
        await this.scrollToCurrentPage(this.state);
        const {url,width,height} = this.state;
        const cacheKey = `${url}${width}${height}`;
        browserCache[cacheKey].screenshotBuffers[this.state.currentPage] = await this.page.screenshot();
        this.broadcast("SCREENSHOT", {width, height, url, page: this.state.currentPage});
        this.state.takingScreenshots = false;
    }

    private async handleDownMessage(client: Client) {
        this.state.takingScreenshots = true;
        console.log("DOWN");
        this.state.currentPage++;
        await this.scrollToCurrentPage( this.state);
        const {url,width,height} = this.state;
        const cacheKey = `${url}${width}${height}`;
        browserCache[cacheKey].screenshotBuffers[this.state.currentPage] = await this.page.screenshot();
        this.broadcast("SCREENSHOT", {width, height, url, page: this.state.currentPage});
        this.state.takingScreenshots = false;
    }

    private waitClick(){
        return new Promise(async (resolve)=>{
            while(this.state.executingClick){
                await sleep(50);
            }
            resolve(true);

        })
    }

    private async handleClickMessage(client: Client, data: any) {
        console.log("handleClickMessage")
        const { normalizedX, normalizedY } = data;
        const { width, height } = this.state;
        this.state.takingScreenshots = true;
        await this.scrollToCurrentPage(this.state);
        const x = Number(normalizedX) * width;
        const y =  Number(normalizedY) * height;
        console.log("CLICK", x, y, this.state.url)

        const elementInfo = await this.page.evaluate(({x, y})=>{
            console.log("evaluating")
            const element= document.elementFromPoint(x,y);
            //const xpathResult = document.evaluate('ancestor-or-self::a', element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            //const anchorElement = xpathResult.singleNodeValue;
            const anchorElement = element.tagName.toUpperCase()==="A"?element:element.closest("a");

            if (anchorElement && anchorElement instanceof HTMLAnchorElement) {
                const anchor = anchorElement as HTMLAnchorElement;

                return {
                    tagName: anchor.tagName,
                    href: anchor.getAttribute('href'),
                    id: anchor.id,
                    className: anchorElement.className,
                    textContent: anchor.textContent?.trim(),
                    target: anchor.target,
                };
            } else {
                // No <a> tag found
                return {
                    tagName: element.tagName,
                    id: element.id,
                    className: element.className,
                    textContent: element.textContent?.trim(),
                };
            }
        }, {x, y});
console.log("elementInfo::", elementInfo);
        this.state.executingClick = true;

        const oldURL = this.state.url;

        await this.page.mouse.click(Number(normalizedX) * width, Number(normalizedY) * height);
        const { url } = this.state;
        const cacheKey = `${url}${width}${height}`;
        await sleep(100);
        const newURL = this.state.url;


        if(newURL === oldURL){
            console.log("click and same URL")

            if(browserCache[cacheKey]){
                browserCache[cacheKey].screenshotBuffers[this.state.currentPage] = await this.page.screenshot();
                this.broadcast("SCREENSHOT", {width, height, url, page: this.state.currentPage});
            }else{
                console.log("DOES THIS HAPPEN ANY TIME ?")
            }
        }else{
            console.log("not same URL", oldURL, newURL)
            const dimensions = await this.page.evaluate(() => ({
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
                fullHeight: document.body.scrollHeight,
            }));
            const fullHeight = this.state.fullHeight = dimensions.fullHeight;
            browserCache[cacheKey] = browserCache[cacheKey] || {
                fullHeight,
                timestamp:Date.now(),
                screenshotBuffers:[]
            }
            browserCache[cacheKey].screenshotBuffers[0] = await this.page.screenshot();
            this.broadcast("SCREENSHOT", {width, height, url, page: 0});
        }

        this.state.executingClick = false;
        this.state.takingScreenshots = false;
    }

    private async scrollToCurrentPage( { currentPage, height }:{currentPage:number, height:number}) {
        await this.page.evaluate(
            (currentPage, viewportHeight) =>
                window.scrollTo({ top: currentPage * viewportHeight, behavior: "instant" as ScrollBehavior }),
            currentPage,
            height
        );
    }
    
    private async takeScreenshots() {
        const { url, width, height } = this.state;
        const cacheKey = `${url}${width}${height}`;
        this.state.idle = false;
        this.state.takingScreenshots = true;
        this.state.loadingPage = true;
        const screenshotsDate = this.state.screenshotsDate = Date.now();
        const isLegacyScreenshotProcess = () => this.state.screenshotsDate > screenshotsDate;
        const dimensions = await this.page.evaluate(() => ({
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            fullHeight: document.body.scrollHeight,
        }));

        const viewportHeight = dimensions.height;

        const fullHeight = this.state.fullHeight = dimensions.fullHeight;
        const numScreenshots = Math.ceil(fullHeight / viewportHeight);
        const screenshotBuffers: any[] = [];

        for (let i = 0; i < Math.min(MAXIMUM_SCROLL,numScreenshots); i++) {
            if(isLegacyScreenshotProcess()) {
                console.log("LEGACY SCREENSHOT PROCESS", screenshotsDate);
                return;
            }

            await this.scrollToCurrentPage({currentPage:i ,height:viewportHeight})
            screenshotBuffers.push(await this.page.screenshot());

            if (i === 0) {
                browserCache[cacheKey] = { fullHeight, timestamp: Date.now(), screenshotBuffers };
                this.broadcastPatch();
                console.log("FIRST PAGE AVAILABLE");
            }
            this.broadcast("SCREENSHOT", {width, height, url, page: i});
        }

        browserCache[cacheKey] = { fullHeight, timestamp: Date.now(), screenshotBuffers };
        await this.scrollToCurrentPage({currentPage:this.state.currentPage ,height:viewportHeight})
        this.state.idle = true;
        this.state.loadingPage = false;
        this.state.takingScreenshots = false;
        console.log("Loaded page and made all scroll");
    }

    onJoin() {
        console.log("Client joined");
    }

    async onDispose() {
        console.log("Disposing room...");
        try {
            // Close the page first to trigger any pending events to complete
            await this.page.close({ runBeforeUnload: true });
        } catch (error) {
            console.log('Error closing page:', error);
        }
        try {
            await this.browser.close();
        } catch (error) {
            console.log('Error closing browser:', error);
        }

        console.log("browser closed");
    }
}
