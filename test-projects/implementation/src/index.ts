import {  Vector3, Quaternion } from "@dcl/sdk/math";
import {createVirtualBrowserClient} from "@zeroxwork/decentraland-virtual-browser-client";
import {engine, MeshRenderer, Transform} from "@dcl/sdk/ecs";

/*const SERVER_BASE_URL = "http://localhost:3000";
const WEBSOCKET_URL = "ws://localhost:3000";*/


const _logs = console.log;

console.log = (...args: any[]) => {
  const date = new Date();
  const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  _logs(`BRO:`, time, ...args);
};

export async function main() {

  /*const SERVER_BASE_URL = "https://dcl-browser.zeroxwork.com";
  const WEBSOCKET_URL = "wss://dcl-browser.zeroxwork.com";
*/

  const SERVER_BASE_URL = "http://localhost:3001";
  const WEBSOCKET_URL = "ws://localhost:3001";

  const wrapper = engine.addEntity();
  MeshRenderer.setBox(wrapper);
  Transform.create(wrapper, {
    position:Vector3.create(8,2,8),
    scale:Vector3.create(3,768/1024 * 3,1),
    rotation:Quaternion.fromEulerDegrees(0,45,0)
  });

/*  createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(2, 2, 8),
    rotation:Quaternion.fromEulerDegrees(0,0,0),
    scale:Vector3.create(3,768/1024 * 3,1),
    homeURL:"https://decentraland.org/governance"
  });
  createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(5.2, 2, 8),
    rotation:Quaternion.fromEulerDegrees(0,0,0),
    scale:Vector3.create(3,768/1024 * 3,1),
    homeURL:"https://cocobay.world"
  });
  createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(8.4, 2, 8),
    rotation:Quaternion.fromEulerDegrees(0,0,0),
    scale:Vector3.create(3,768/1024 * 3,1),
    homeURL:"https://golfcraftgame.com/tournaments"
  });*/
  createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(0,0,-0.511),
    rotation:Quaternion.fromEulerDegrees(0,0,0),
    scale:Vector3.create(0.5,0.5,1),
    homeURL:"https://cardgames.io",
    parent:wrapper
  });
}