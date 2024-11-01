import {Server, RelayRoom, LobbyRoom} from 'colyseus';
import {createServer} from "http";
import { createServer as createSecureServer } from 'https';
import {BrowserRoom} from "./colyseus/BrowserRoom";
import {BrowserRoom2} from "./colyseus/BrowserRoom2";
import {monitor} from "@colyseus/monitor"; // Import the monitor
import dotenv from "dotenv";
import {basicAuthMiddleware} from "./basic-auth";
dotenv.config({path:"../.env"})


export function setupColyseus(options:any, app:any) {
    const {ssl} = options;
    const server = ssl ? createSecureServer(options, app) : createServer(options, app);
    const gameServer = new Server({
        pingInterval: process.env.PROD ? 1500 : 0,
        server
    });
    gameServer.define("browser-room", BrowserRoom)
        .filterBy(['roomInstanceId']);
    gameServer.define("browser-room2", BrowserRoom2)
        .filterBy(['roomInstanceId']);
    const PORT = process.env.PORT ?Number(process.env.PORT ): 3000;
    console.log("listening on port ",PORT)
    app.use("/monitor", basicAuthMiddleware,  monitor({columns:[
        "roomId", "clients", {metadata:"url"}, {metadata:"locations"}
        ]}));
    gameServer.listen(PORT);
}
