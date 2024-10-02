import { Client, Room } from "colyseus";
import { Schema, type } from "@colyseus/schema";
import puppeteer, { Browser, Page } from "puppeteer";
import browserCache from "../browser-cache";

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
    firstPageAvailable: boolean = false;
    @type("boolean")
    idle: boolean = false; // Indicates whether the user can interact

    constructor({ url, width, height, loadingPage }: any) {
        super();
        this.url = url;
        this.width = width;
        this.height = height;
        this.loadingPage = loadingPage;
        this.firstPageAvailable = false;
    }
}

export class BrowserRoom extends Room<BrowserState> {
    private browser: Browser;
    private page: Page;

    async onCreate(options: any) {
        const { url, width, height } = options;
        this.setState(new BrowserState({ url, width, height, loadingPage: true }));

        this.registerMessageHandlers();
        await this.initializeBrowser(width, height);
        this.takeScreenshots();
    }

    private registerMessageHandlers() {
        this.onMessage("UP", this.handleUpMessage.bind(this));
        this.onMessage("DOWN", this.handleDownMessage.bind(this));
        this.onMessage("CLICK", this.handleClickMessage.bind(this));
    }

    private async initializeBrowser(width: number, height: number) {
        console.log("Opening browser...");
        this.browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            headless: false,
            args: [`--window-size=${width},${height}`],
        });
        console.log("Browser opened.");

        const pages = await this.browser.pages();
        this.page = pages[0];
        await this.page.setViewport({ width: Number(width), height: Number(height) });
        this.setupNavigationListener();
    }

    private setupNavigationListener() {
        this.page.on('framenavigated', async (frame) => {
            if (frame === this.page.mainFrame()) {
                console.log('Navigation occurred to:', frame.url());
                if(frame.url()  !== this.state.url){
                    // Update the state with the new URL
                    console.log("before this.state.url", this.state.url);
                    this.state.url = frame.url();
                    console.log("after this.state.url", this.state.url);
                    this.state.currentPage = 0;
                    // Take new screenshots
                    await this.takeScreenshots();
                }
            }
        });
    }

    private async handleUpMessage(client: Client) {
        console.log("UP");
        this.state.currentPage--;
        await this.scrollToCurrentPage(this.state);
    }

    private async handleDownMessage(client: Client) {
        console.log("DOWN");
        this.state.currentPage++;
        await this.scrollToCurrentPage( this.state);
    }

    private async handleClickMessage(client: Client, data: any) {
        const { normalizedX, normalizedY } = data;
        const { width, height } = this.state;

        this.state.firstPageAvailable = false;
        await this.scrollToCurrentPage(this.state);
        await this.page.mouse.click(Number(normalizedX) * width, Number(normalizedY) * height);
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

        this.state.loadingPage = true;

        await this.page.goto(url, { waitUntil: "networkidle2" });

        const dimensions = await this.page.evaluate(() => ({
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            fullHeight: document.body.scrollHeight,
        }));
        const viewportHeight = dimensions.height;
        const fullHeight = this.state.fullHeight = dimensions.fullHeight;
        const numScreenshots = Math.ceil(fullHeight / viewportHeight);
        const screenshotBuffers: any[] = [];

        for (let i = 0; i < numScreenshots; i++) {
            if (i > 0) await this.scrollToCurrentPage({currentPage:i ,height:viewportHeight})
            screenshotBuffers.push(await this.page.screenshot());

            if (i === 0) {
                browserCache[cacheKey] = { fullHeight, timestamp: Date.now(), screenshotBuffers };
                this.state.firstPageAvailable = true;
                this.broadcastPatch();
                console.log("FIRST PAGE AVAILABLE");
            }
            this.broadcast("SCREENSHOT", {width, height, url, page: i});
        }

        browserCache[cacheKey] = { fullHeight, timestamp: Date.now(), screenshotBuffers };
        this.state.idle = true;
        this.state.loadingPage = false;
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
