import {Server, RelayRoom, LobbyRoom} from 'colyseus';
import {createServer} from "http";
import {BrowserRoom} from "./colyseus/BrowserRoom";

export function setupColyseus(options:any, app:any){
    const gameServer = new Server({
        pingInterval: process.env.PROD ? 1500 : 0,
        server: createServer(options, app)
    });
    gameServer.define("browser-room", BrowserRoom)
        .filterBy(['roomInstanceId']);
    const PORT = process.env.PORT ?Number(process.env.PORT ): 3000;
    console.log("listening on port ",PORT)

    gameServer.listen(PORT);
}
