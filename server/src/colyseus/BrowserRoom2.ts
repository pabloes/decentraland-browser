import { Client, Room } from "colyseus";
import { Schema, type, SetSchema, ArraySchema } from "@colyseus/schema";
import puppeteer, { Browser, Page } from "puppeteer";
import {browserRooms} from "../browser-cache";
import {sleep} from "../util/sleep";
import crypto from "crypto";
import {waitFor} from "../util/wait-for";
import {tryFn} from "../util/try-fn";
import sharp from 'sharp';
import {reportInteraction, reportNavigation, reportSession, reportSessionLocation, reportUser} from "./Reporter";
import {ActionType} from "@prisma/client";
import {prisma} from "../database";

const HEADLESS = true;
const UPDATE_INTERVAL_MS = 800;
const ALIVE_INTERVAL_MS = 2000;

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
    @type("number") topY: number;
    @type(UserState) user:UserState = new UserState();
    @type(["number"]) sectionDates = new ArraySchema<number>();
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


export class BrowserRoom2 extends Room<BrowserState> {
    private browser: Browser;
    private page: Page;
    private interval:any;
    private aliveInterval:any;
    private lastSentHash:string;
    private config:{ url:string, width:number, height:number, roomInstanceId:string };
    private lastFullHeight = 0;
    private reportedSessionId:number;

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
        this.interval = setInterval(async ()=> {
            await this.evaluatePageSections();
            await this.takeScreenshot(true)
        }, UPDATE_INTERVAL_MS);
        this.aliveInterval = setInterval(()=>this.broadcast("ALIVE", {ALIVE_INTERVAL_MS}), ALIVE_INTERVAL_MS);
        this.reportedSessionId = await reportSession({width, height, roomInstanceId, homeURL:url})
    }

    async onJoin(client:Client, {location, user}:any) {
        const {userId, name, isGuest} = user;
        const reportLocation = () => {
            if(location?.coords && !this.state.locations.has(location?.coords)){
                this.state.locations.add(location?.coords);
                this.setMetadata({"locations":this.state.locations.toArray().join("  ")});
                reportSessionLocation({reportedSessionId:this.reportedSessionId, location});
            }
        }

        reportLocation();
        const databaseUser= await reportUser({userId, name, isGuest});
        client.send("DATABASE_USER", databaseUser);
        console.log("Client joined", databaseUser);
    }

    private async takeScreenshotsOfSections(startingSection:number, numberOfSections:number, lazy:boolean = false){
        this.setPatchRate(99999);

        const savedSection = this.state.currentPageSection;
        const targetSection = Math.min(
            startingSection+numberOfSections,
            Math.ceil(this.state.fullHeight / this.state.height)
        );
        let currentSection = startingSection;

        if(currentSection === targetSection) {
            this.setPatchRate(50);
            return;
        }

        while(currentSection <= targetSection){
            await this.scrollToSection(currentSection);
            await this.evaluatePageSections();
            await this.takeScreenshot(currentSection === savedSection);
            currentSection++;
        }
        await this.scrollToSection(savedSection);
        await this.evaluatePageSections();
        this.setPatchRate(50);
        this.broadcastPatch();
    }

     private async evaluatePageSections (){
        let topY:number,fullHeight:number;

        try {
            if(this.state.takingScreenshots) return;
            const scrollInfo = await this.page.evaluate(()=>{
                return {
                    fullHeight: document.body?.scrollHeight,
                    topY:document.documentElement.scrollTop
                }
            },{});
            topY = this.state.topY = scrollInfo.topY;
            fullHeight = this.state.fullHeight = scrollInfo.fullHeight;
            this.state.currentPageSection = Math.ceil(topY / this.config.height)
            this.state.pageSections = Math.ceil(fullHeight / this.config.height);
        }catch(error:Error|any){
            console.log("page.evaluate error", error?.message)
        }

        return {topY, fullHeight};
    }

    private async takeScreenshot(notifyClient:boolean = false){
        if(!this.state.takingScreenshots){
            this.state.takingScreenshots = true;

            const {fullHeight, topY} = this.state;
            const screenshot = await this.page.screenshot({});
            const hash = calculateMD5(Buffer.from(screenshot));

            if(hash === this.lastSentHash && this.lastFullHeight === fullHeight){
                console.log("same Hash")
                this.state.idle = true;
                this.state.takingScreenshots = false;
                return;
            }

            const compressedBuffer = await sharp(screenshot).png({ quality: 50}).toBuffer()

            browserRooms[this.state.roomInstanceId] = browserRooms[this.state.roomInstanceId] || {sections:[]};
            browserRooms[this.state.roomInstanceId].sections[this.state.currentPageSection] = compressedBuffer;
            this.state.sectionDates[this.state.currentPageSection] = Date.now();

            this.lastSentHash = hash;
            this.lastFullHeight = fullHeight;
            if(notifyClient) this.broadcast("SCREENSHOT2", {topY, fullHeight, pageSection:this.state.currentPageSection,
                sectionDate:this.state.sectionDates[this.state.currentPageSection]
            });
        }else{
            console.log("taking screenshots already")
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
        this.onMessage("TYPE", this.handleTypeMessage.bind(this));
        this.onMessage("URL", this.handleURLMessage.bind(this));
    }

    private async handleURLMessage(client:Client, newURL:string){
        await tryFn(async()=>
            await this.page.goto(newURL, { waitUntil: "networkidle2", timeout:5000 })
        );
    }

    private async handleTypeMessage(client:Client, {value}:{value:string}){
        if (typeof value !== 'string') {
            console.error('Invalid input value, expected a string:', value);
            return;
        }

        try {
            // Clear the currently focused input and set the new value
            await this.page.evaluate((newValue) => {
                const focusedElement = document.activeElement as HTMLInputElement;
                if (focusedElement && focusedElement.tagName === 'INPUT') {
                    focusedElement.value = "";
                }
            }, value);

            console.log('New value set in the focused input:', value);
        } catch (error) {
            console.error('Error while handling type message:', error);
        }
        await this.page.keyboard.type(value);
        const url = this.state.url;
        await sleep(500);
        if(url === this.state.url){
            await this.page.keyboard.press('Enter');
        }
    }

    private async scrollToSection(  section: number ) {
        try{
            if(section < 0 || section > this.state.pageSections) return;

            await this.page.evaluate(
                (section, viewportHeight) =>
                    window.scrollTo({ top: section * viewportHeight, behavior: "instant" as ScrollBehavior }),
                section,
                this.config.height
            );
        }catch(error){
            console.log("scrolltoSection error", error)
        }
    }

    private async handleBackMessage(client:Client, {databaseUser}:any) {
        await this.page.goBack();
        reportInteraction({
            userId:databaseUser.id,
            sessionId:this.reportedSessionId,
            URL:this.state.url,
            action:ActionType.BACK
        });
    }

    private async handleForwardMessage(client:Client, {databaseUser}:any) {
        await this.page.goForward();
        reportInteraction({
            userId:databaseUser.id,
            sessionId:this.reportedSessionId,
            URL:this.state.url,
            action:ActionType.FORWARD
        });
    }

    private async handleHomeMessage(client:Client, {databaseUser}:{databaseUser:any}) {
        console.log("handleHomeMessage", databaseUser);
        console.log("this-page.irl", this.page.url());
        console.log("this.config.url",this.config.url);

        if(this.page.url() !== this.config.url){
            reportInteraction({
                userId:databaseUser.id,
                sessionId:this.reportedSessionId,
                URL:this.state.url,
                action:ActionType.HOME
            });
            await this.page.goto(this.config.url);
            await sleep(500);
            await this.scrollToSection(0);
            await this.evaluatePageSections();
            this.broadcastPatch();
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
        // Listen for the 'dialog' event to detect when an alert or other dialog opens
        this.page.on('dialog', async (dialog) => {
            console.log('Alert detected:', dialog.message());  // Log the alert message
            //TODO open alert in dcl sdk dialog before accepting
            await dialog.accept();  // Automatically accept the alert
        });
        await this.page.setViewport({ width: Number(width), height: Number(height) });
        await tryFn(async()=>
            await this.page.goto(url, { waitUntil: "networkidle2", timeout:5000 })
        );
        console.log("browser initialized");
        await this.evaluatePageSections();
        await this.takeScreenshotsOfSections(0, 2);
        this.setupNavigationListener();
        this.state.idle = true;
    }

    private setupNavigationListener() {
        this.page.on('framenavigated', async (frame) => {
            const frameURL = frame.url();

            if (frame === this.page.mainFrame()) {
                if(frameURL !== this.state.url){
                    this.state.idle = false;
                    while(this.state.sectionDates.length) this.state.sectionDates.pop();
                    await this.scrollToSection(0)
                    await this.evaluatePageSections();
                    this.state.url = frame.url();
                    this.setMetadata({"url": this.state.url});
                    await this.evaluatePageSections();
                    await this.takeScreenshotsOfSections(this.state.currentPageSection, this.state.currentPageSection+2);
                    this.broadcastPatch();
                    await sleep(200);
                    await this.evaluatePageSections();
                    this.state.idle = true;
                    this.broadcastPatch();
                    const foundUserInDatabase = ( await prisma.user.findFirst({where:{userId:this.state.user.userId}}) );
                    if(this.state.user?.userId ) reportNavigation({
                        URL:frameURL,
                        sessionId:this.reportedSessionId,
                        userId:this.state.user.userId ? foundUserInDatabase.id: null
                    })
                }
            }
        });


    }

    private async handleUpMessage(client: Client, {user,databaseUser}:any) {

        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});
        if(!await tryFn(async ()=> {
            const takingScreenshotsIsFalse = ()=>this.state.takingScreenshots === false
            await waitFor(takingScreenshotsIsFalse, {timeout:1000})
        })) {
            return;
        };
        await this.scrollToSection(this.state.currentPageSection-1);
        await this.evaluatePageSections();
        this.broadcast("SCREENSHOT2", {
            topY:this.state.topY,
            fullHeight:this.state.fullHeight,
            pageSection:this.state.currentPageSection
        });
        await this.takeScreenshot();

        this.broadcastPatch();
        reportInteraction({
            userId:databaseUser.id,
            sessionId:this.reportedSessionId,
            URL:this.state.url,
            action:ActionType.SCROLL
        });
    }

    private async handleDownMessage(client: Client, {user, databaseUser}:any) {

        Object.assign(this.state.user, {...user, lastInteraction:Date.now()});
        if(!await tryFn(async ()=> {
            const takingScreenshotsIsFalse = ()=>this.state.takingScreenshots === false
            await waitFor(takingScreenshotsIsFalse, {timeout:1000})
        })) {
            return;
        };
        if(!this.state.sectionDates[this.state.currentPageSection+1]){
            this.state.idle = false;
        }
        await this.scrollToSection(this.state.currentPageSection+1);
        await this.evaluatePageSections();
        await this.takeScreenshot(  );
        this.broadcast("SCREENSHOT2", {
            topY:this.state.topY,
            fullHeight:this.state.fullHeight,
            pageSection:this.state.currentPageSection
        });
        this.state.idle = true;
        this.broadcastPatch();
        console.log("handleDownMessage",databaseUser)
        reportInteraction({
            userId:databaseUser.id,
            sessionId:this.reportedSessionId,
            URL:this.state.url,
            action:ActionType.SCROLL
        });
    }

    private async handleClickMessage(client: Client, data: any) {
        console.log("handleClickMessage");
        this.state.executingClick = true;
        const { normalizedX, normalizedY, user, databaseUser } = data;
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
                    type: anchor.getAttribute('type'),
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
                    type: element.getAttribute('type'),
                    id: element.id,
                    className: element.className,
                    textContent: element.textContent?.trim(),
                    value:(element as HTMLInputElement).value
                } || {};
            }
        }, {x, y});
console.log("elementInfo::", elementInfo);

        const oldURL = this.state.url;
        await this.page.mouse.move(x,y);
        //await this.page.mouse.down()
        await this.page.mouse.click(Number(normalizedX) * width, Number(normalizedY) * height, {delay:50});
        const { url } = this.state;
        await sleep(200);
        const newURL = this.state.url;

        if(elementInfo?.href){//TODO and href is different than this.state.url
            //TODO wait for framenavigated
        }
        if(elementInfo?.tagName === "INPUT"){
            const inputType = elementInfo.type || "text";
            this.broadcast("INPUT", {inputType, value:(elementInfo as HTMLInputElement).value} );
        }

        reportInteraction({
            userId:databaseUser.id,
            sessionId:this.reportedSessionId,
            URL:this.state.url,
            action:ActionType.CLICK
        });

        await tryFn(async ()=>await waitFor(()=>this.state.takingScreenshots === false));
        await this.evaluatePageSections();
        await this.takeScreenshot();
        this.state.executingClick = false;
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

            // Close the page first to trigger any pending events to complete
            await this.page?.close({ runBeforeUnload: true });
        } catch (error) {
            console.log('Error closing page:', error);
        }
        try {
            console.log("Closing browser...")
            await this.browser?.close();
        } catch (error) {
            console.log('Error closing browser:', error);
        }

        console.log("browser closed");
    }
}
