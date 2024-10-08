import {  Vector3, Quaternion } from "@dcl/sdk/math";
import {createVirtualBrowserClient} from "./components/virtual-browser-client";

const SERVER_BASE_URL = "http://localhost:3000";
const WEBSOCKET_URL = "ws://localhost:3000";
const POSITION = [8, 2, 8];
const _logs = console.log;

console.log = (...args: any[]) => {
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    _logs(`BRO:`, time, ...args);
};

export async function main() {
    const virtualBrowserClient = createVirtualBrowserClient({
        position:Vector3.create(...POSITION),
        rotation:Quaternion.fromEulerDegrees(0,0,0),
        colyseusServerURL:WEBSOCKET_URL,
        baseAPIURL:SERVER_BASE_URL,
        //homeURL:"https://cardgames.io/"
    });
}