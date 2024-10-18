import { Client, Room } from "colyseus";
import { Schema, type, SetSchema } from "@colyseus/schema";
import puppeteer, { Browser, Page } from "puppeteer";
import {browserRooms} from "../browser-cache";
import {sleep} from "../util/sleep";
import crypto from "crypto";
import {waitFor} from "../util/wait-for";
import {tryFn} from "../util/try-fn";
import sharp from 'sharp';
import {reportSession} from "./Reporter";

const HEADLESS = true;

class UserState extends Schema {
    @type("string") name:string;
    @type("string") userId:string
    @type("boolean") isGuest:boolean;
    @type("number") lastInteraction:number = 0;
}


class BrowserState extends Schema {
    @type("string") url: string = "";
    @type("string") roomInstanceId:string = "";
    @type("boolean") idle: boolean = false; // Indicates whether the user can interact
    @type("number") currentPageSection:number = 0;
    @type("number") pageSections:number = 0;
    @type("number") fullHeight: number;
    @type(UserState) user:UserState = new UserState();
    @type({ set: "string" }) locations = new SetSchema<string>();
    width: number = 1024;
    height: number = 768;
    screenshotsDate:number = 0;
    executingClick:boolean = false;
    takingScreenshots:boolean = false;

    constructor({ url, width, height, roomInstanceId }: any) {
        super();
        this.url = url;
        this.width = width;
        this.height = height;
        this.roomInstanceId = roomInstanceId;
    }
}

const calculateMD5 = (buffer: Buffer): string => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};
const UPDATE_INTERVAL_MS = 800;
const ALIVE_INTERVAL_MS = 2000;
const AUTOFILL_INTERVAL_MS = 1000;

export class BrowserRoom2 extends Room<BrowserState> {
    private browser: Browser;
    private page: Page;
    private interval:any;
    private aliveInterval:any;
    private autoFillInterval:any;
    private lastSentHash:string;
    private config:{ url:string, width:number, height:number, roomInstanceId:string };

    async onCreate(options: any) {
        const { url, width, height, roomInstanceId } = options;
        this.config = options;
        this.setState(new BrowserState({ url, width, height, roomInstanceId }));

        this.setMetadata({"url": url});
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
        this.aliveInterval = setInterval(()=>this.broadcast("ALIVE", {ALIVE_INTERVAL_MS}), ALIVE_INTERVAL_MS);
        this.autoFillInterval = setInterval(()=>this.autoFillName(), AUTOFILL_INTERVAL_MS)
        // Expose a function to handle the link click in Node.js
        // Listen for console events and capture the clicked link URL
        this.page.on('console', async (msg) => {
            const text = msg.text();
            if (text.startsWith('LINK_CLICKED:')) {
                const url = text.replace('LINK_CLICKED:', '');
                const urlObj = new URL(url);
                const position = urlObj.searchParams.get('position');
                if (position) {
                    const decodedPosition = decodeURIComponent(position); // "145%2C60" becomes "145,60"
                    const [x,y] = decodedPosition.split(",");
                    this.broadcast("TELEPORT", {x,y})
                }
            }
        });

        await this.page.evaluate(() => {
            document.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', event => {
                    const href = link.getAttribute('href');
                    // Check if the link contains the Decentraland play position URL
                    if (href && href.includes('https://play.decentraland.org/?position=')) {
                        event.preventDefault();  // Cancel default behavior
                    }
                });
            });
        });
        await reportSession({width, height, roomInstanceId, homeURL:url})
    }

    private lastFullHeight = 0;
    private async takeScreenshot(){
        if(!this.state.takingScreenshots){
            let topY:number,fullHeight:number;
            this.state.takingScreenshots = true;
            try {
                const scrollInfo = await this.page.evaluate(()=>{
                    return {
                        fullHeight: document.body?.scrollHeight,
                        topY:document.documentElement.scrollTop
                    }
                },{});
                topY = scrollInfo.topY;
                fullHeight = this.state.fullHeight = scrollInfo.fullHeight;

            }catch(error){
                console.log("page.evaluate error", error)
            }

            const screenshot = await this.page.screenshot({});
            const hash = calculateMD5(Buffer.from(screenshot));
            browserRooms[this.state.roomInstanceId] = browserRooms[this.state.roomInstanceId] || {};
            browserRooms[this.state.roomInstanceId].screenshot = screenshot;
            browserRooms[this.state.roomInstanceId].compressed =
                await sharp(screenshot).png({ quality: 50}).toBuffer()
            if(hash === this.lastSentHash && this.lastFullHeight === fullHeight){
                this.state.takingScreenshots = false;
                return;
            }


            this.broadcast("SCREENSHOT2", {topY, fullHeight});
            this.lastSentHash = hash;
            this.lastFullHeight = fullHeight;
        }
        this.state.takingScreenshots = false;
        return;
    }

    private registerMessageHandlers() {
        this.onMessage("UP", this.handleUpMessage.bind(this));
        this.onMessage("DOWN", this.handleDownMessage.bind(this));
        this.onMessage("CLICK", this.handleClickMessage.bind(this));
        this.onMessage("HOME", this.handleHomeMessage.bind(this));
        this.onMessage("BACK", this.handleBackMessage.bind(this));
        this.onMessage("FORWARD", this.handleForwardMessage.bind(this));
    }

    private async scrollToSection(  section: number ) {
        const {fullHeight, topY} = await this.page.evaluate(()=>{
            return {
                fullHeight: document.body?.scrollHeight,
                topY:document.documentElement.scrollTop
            }
        },{});
        const pageSections =this.state.pageSections = Math.ceil(fullHeight / this.config.height);

        if(section < 0 || section > pageSections) return;

        await this.page.evaluate(
            (section, viewportHeight) =>
                window.scrollTo({ top: section * viewportHeight, behavior: "instant" as ScrollBehavior }),
            section,
            this.config.height
        );

        this.state.currentPageSection = section;
    }

    private async handleBackMessage() {
       // this.state.idle = false;
        await this.page.goBack();
       // await sleep(500);//TODO only do if it navgigates
       // this.state.idle = true;
    }

    private async handleForwardMessage() {
       // this.state.idle = false;
        await this.page.goForward();
       // await sleep(500); //TODO only do if it navgigates
       // this.state.idle = true;
    }

    private async handleHomeMessage() {
        console.log("this-page.irl", this.page.url());
        console.log("this.config.url",this.config.url)
        if(this.page.url() !== this.config.url){
            this.state.idle = false;
            await this.page.goto(this.config.url);
            await sleep(500);
            await this.scrollToSection(0)
            this.state.idle = true;
        }
    }

    private async initializeBrowser(width: number, height: number, url:string) {
        console.log("Opening browser2...");
        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            //devtools: true,   // Open Chrome with DevTools and keep it open
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
        tryFn(async()=>await this.page.goto(url, { waitUntil: "networkidle2", timeout:5000 }));

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
                    this.scrollToSection(0)
                    this.state.idle = false;
                    console.log("before framenavigated",this.state.url)
                    console.log("after framenavigated",frameURL)
                    this.state.url = frame.url();
                    this.setMetadata({"url": this.state.url});
                    await this.takeScreenshot();
                    await sleep(200);
                    this.state.idle = true;

                }
            }
        });


    }

    async autoFillName() {//work for cardgames.io
        try{
            const inputSelector = "#name-new";
            const inputElement = await this.page.$('#name-new');
            if (inputElement) {
                const inputValue = await this.page.evaluate((el:any) => el.value, inputElement);
                if(!inputValue){
                    await this.page.type(inputSelector, this.state.user?.name || (`DCL-${Math.floor(Math.random()*100)}`));
                }
            }
        }catch(error){
            console.log("autoFillName error",error)
        }
    }

    private async handleUpMessage(client: Client, {user}:any) {
        console.log("handleUpMessage");
        this.state.idle = false;
        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});
        await tryFn(async ()=>await waitFor(()=>this.state.takingScreenshots === false));

        await this.scrollToSection(this.state.currentPageSection-1);

        await this.takeScreenshot();
        this.state.idle = true;
    }

    private async handleDownMessage(client: Client, {user}:any) {
        console.log("handleDownMessage")
        this.state.idle = false;
        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});
        await tryFn(async ()=>await waitFor(()=>this.state.takingScreenshots === false));
        await this.scrollToSection(this.state.currentPageSection+1);
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
        this.broadcast("CLICK", {normalizedX, normalizedY});
        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});

        const { width, height } = this.state;
        const x = Math.floor(Number(normalizedX) * width);
        const y =  Math.floor(Number(normalizedY) * height);
        console.log("CLICK", x, y, this.state.url)

        const elementInfo = await this.page.evaluate(({x, y})=>{
            console.log("evaluating")
            const element= document.elementFromPoint(x,y);
            //const xpathResult = document.evaluate('ancestor-or-self::a', element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            //const anchorElement = xpathResult.singleNodeValue;
            const anchorElement = element?.closest("[href]");//TODO it doesnt select himself?

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
                return element && {
                    info:"not [href] found",
                    tagName: element.tagName,
                    id: element.id,
                    className: element.className,
                    textContent: element.textContent?.trim(),
                } || {};
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

        await tryFn(async ()=>await waitFor(()=>this.state.takingScreenshots === false));
        await this.takeScreenshot();
        this.state.executingClick = false;
    }

    onJoin(client:Client, {location}:any) {
        if(location && !this.state.locations.has(location)){
            this.state.locations.add(location);
            console.log("this.state.locations",)
            this.setMetadata({"locations":this.state.locations.toArray().join("  ")})
        }

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

            await this.allowReconnection(client, 2);
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
            clearInterval(this.aliveInterval);
            clearInterval(this.autoFillInterval);

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
