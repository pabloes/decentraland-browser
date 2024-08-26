import {Server, RelayRoom, LobbyRoom} from 'colyseus';
import {createServer} from "http";
import {BrowserRoom} from "./colyseus/BrowserRoom";

export function setupColyseus(options, app){
    const gameServer = new Server({
        pingInterval: process.env.PROD ? 1500 : 0,
        server: createServer(options, app)
    });
    gameServer.define("browser-room", BrowserRoom)
        .filterBy(['roomInstanceId']);

    gameServer.listen(process.env.PORT ?Number(process.env.PORT ): 3000);


}
