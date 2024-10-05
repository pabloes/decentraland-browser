import { Client, Room } from "colyseus";
import { Schema, type } from "@colyseus/schema";
import puppeteer, { Browser, Page } from "puppeteer";
import {browserRooms} from "../browser-cache";
import {sleep} from "../util/sleep";
import crypto from "crypto";
import {waitFor} from "../util/wait-for";

const HEADLESS = true;
const WebSocket = require('ws');

class UserState extends Schema {
    @type("string") name:string;
    @type("string") userId:string
    @type("boolean") isGuest:boolean;
    @type("number") lastInteraction:number = 0;
}

class BrowserState extends Schema {
    @type("string") url: string = "";
    @type("string") roomInstanceId:string = "";
    @type("number") fullHeight: number = 768;
    @type("number") currentPage: number = 0;
    @type("boolean") loadingPage: boolean = false;
    @type("boolean") idle: boolean = false; // Indicates whether the user can interact
    @type(UserState) user:UserState = new UserState();

    width: number = 1024;
    height: number = 768;
    screenshotsDate:number = 0;
    executingClick:boolean = false;
    takingScreenshots:boolean = false;

    constructor({ url, width, height, loadingPage, roomInstanceId }: any) {
        super();
        this.url = url;
        this.width = width;
        this.height = height;
        this.loadingPage = loadingPage;
        this.roomInstanceId = roomInstanceId;
    }
}

const calculateMD5 = (buffer: Buffer): string => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};
const UPDATE_INTERVAL_MS = 4000;
export class BrowserRoom2 extends Room<BrowserState> {
    private browser: Browser;
    private page: Page;
    private interval:any;
    private lastSentHash:string;

    async onCreate(options: any) {
        const { url, width, height, roomInstanceId } = options;
        this.setState(new BrowserState({ url, width, height, loadingPage: true, roomInstanceId }));
        this.registerMessageHandlers();
        await this.initializeBrowser(width, height, url);
        this.browser.on("targetcreated", async (target)=>{
            if (target.type() === 'page') {
                const newPage = await target.page();
                await newPage.waitForFunction(
                    () => window.location.href !== 'about:blank'
                );
                const newURL = newPage.url();
                console.log('New page opened with URL:', newURL);
                await newPage.close();
                this.broadcast("TAB", {url:newURL});
            }
        })
        this.interval = setInterval(()=>this.takeScreenshot(), UPDATE_INTERVAL_MS);
    }

    private async takeScreenshot(){
        if(!this.state.takingScreenshots){
            //TODO take screenshot
            this.state.takingScreenshots = true;
            const screenshot = await this.page.screenshot();
            const hash = calculateMD5(Buffer.from(screenshot));
            browserRooms[this.state.roomInstanceId] = browserRooms[this.state.roomInstanceId] || {};
            browserRooms[this.state.roomInstanceId].screenshot = screenshot;
            console.log("saved screenshot for roomInstanceId", this.state.roomInstanceId);
            if(hash === this.lastSentHash){
                this.state.takingScreenshots = false;
                return;
            }
            this.broadcast("SCREENSHOT2", {page: this.state.currentPage});
            this.lastSentHash = hash;
        }
        this.state.takingScreenshots = false;
        return;
    }

    private registerMessageHandlers() {
        this.onMessage("UP", this.handleUpMessage.bind(this));
        this.onMessage("DOWN", this.handleDownMessage.bind(this));
        this.onMessage("CLICK", this.handleClickMessage.bind(this));
    }

    private async initializeBrowser(width: number, height: number, url:string) {
        console.log("Opening browser2...");
        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            devtools: true,   // Open Chrome with DevTools and keep it open
            //browser: "firefox",
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                `--window-size=${width+20},${height+100}`
            ]
        });

        console.log("Browser opened.");
        const pages = await this.browser.pages();
        this.page = pages[0];
        await this.page.setViewport({ width: Number(width), height: Number(height) });
        await this.page.goto(url, { waitUntil: "networkidle2" });
        console.log("browser initialized");
        await this.takeScreenshot();
        this.state.idle = true;
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
                }
            }
        });
    }

    private async handleUpMessage(client: Client, {user}:any) {
        console.log("handleUpMessage");
        this.state.idle = false;
        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});
        await waitFor(()=>this.state.takingScreenshots === false);
        await this.page.keyboard.press('PageUp');
        await sleep(120);
        await this.takeScreenshot();
        this.state.idle = true;
    }

    private async handleDownMessage(client: Client, {user}:any) {
        console.log("handleDownMessage")
        this.state.idle = false;
        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});
        await waitFor(()=>this.state.takingScreenshots === false);
        await this.page.keyboard.press('PageDown');
        await sleep(120);
        await this.takeScreenshot();
        this.state.idle = true;
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
        console.log("handleClickMessage");
        this.state.executingClick = true;
        const { normalizedX, normalizedY, user } = data;
        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});

        const { width, height } = this.state;
        const x = Number(normalizedX) * width;
        const y =  Number(normalizedY) * height;
        console.log("CLICK", x, y, this.state.url)

        const elementInfo = await this.page.evaluate(({x, y})=>{
            console.log("evaluating")
            const element= document.elementFromPoint(x,y);
            //const xpathResult = document.evaluate('ancestor-or-self::a', element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            //const anchorElement = xpathResult.singleNodeValue;
            const anchorElement = element.closest("[href]");

            if (anchorElement && anchorElement instanceof HTMLAnchorElement) {
                const anchor = anchorElement as HTMLAnchorElement;

                return {
                    info:"[href] found",
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
                    info:"not [href] found",
                    tagName: element.tagName,
                    id: element.id,
                    className: element.className,
                    textContent: element.textContent?.trim(),
                };
            }
        }, {x, y});
console.log("elementInfo::", elementInfo);

        const oldURL = this.state.url;
        await this.page.mouse.click(Number(normalizedX) * width, Number(normalizedY) * height);
        const { url } = this.state;
        await sleep(200);
        const newURL = this.state.url;

        if(elementInfo?.href){//TODO and href is different than this.state.url
            //TODO wait for framenavigated
        }

        await waitFor(()=>this.state.takingScreenshots === false);
        //TODO execute action DOWN in browser
        await this.takeScreenshot();
        this.state.executingClick = false;
    }

    onJoin() {
        console.log("Client joined");
    }

    async onLeave (client: Client, consented?: boolean) {
        console.log(client.sessionId, "left", { consented });

        try {
            if (consented) {
                /*
                 * Optional:
                 * you may want to allow reconnection if the client manually closed the connection.
                 */
                throw new Error("left_manually");
            }

            await this.allowReconnection(client, 10);
            console.log("Reconnected!");

           // client.send("status", "Welcome back!");
        } catch (e) {
            console.log("consented leave?",e);

        }
    }

    async onDispose() {
        console.log("Disposing room...");
        try {
            clearInterval(this.interval);
            // Close the page first to trigger any pending events to complete
            await this.page?.close({ runBeforeUnload: true });
        } catch (error) {
            console.log('Error closing page:', error);
        }
        try {
            await this.browser?.close();
        } catch (error) {
            console.log('Error closing browser:', error);
        }

        console.log("browser closed");
    }
}
