import {  Vector3, Quaternion } from "@dcl/sdk/math";
import {createVirtualBrowserClient, dclSleep} from "@zeroxwork/decentraland-virtual-browser-client";
import {engine, MeshRenderer, MeshCollider, Transform, TextShape, TextAlignMode} from "@dcl/sdk/ecs";
import {createLinkList} from "@zeroxwork/decentraland-virtual-browser-client/dist/link-list";

/*const SERVER_BASE_URL = "http://localhost:3000";
const WEBSOCKET_URL = "ws://localhost:3000";*/


const _logs = console.log;

console.log = (...args: any[]) => {
  const date = new Date();
  const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  _logs(`BRO:`, time, ...args);
};


export async function main() {
  const SERVER_BASE_URL = "https://dcl-browser.zeroxwork.com";
  const WEBSOCKET_URL = "wss://dcl-browser.zeroxwork.com";

/*  const SERVER_BASE_URL = "https://dcl-browser-dev.zeroxwork.com";
  const WEBSOCKET_URL = "wss://dcl-browser-dev.zeroxwork.com";*/

/*  const SERVER_BASE_URL = "http://localhost:3000";
  const WEBSOCKET_URL = "ws://localhost:3000";*/


/*  const SERVER_BASE_URL = "http://localhost:3001";
  const WEBSOCKET_URL = "ws://localhost:3001";*/

/*

  const wrapper = engine.addEntity();
  MeshRenderer.setBox(wrapper);
  MeshCollider.setBox(wrapper);
  Transform.create(wrapper, {
    position:Vector3.create(8,1.3,8),
    scale:Vector3.create(4,768/1024 * 4,0.1),
    rotation:Quaternion.fromEulerDegrees(20,20,0)
  });

  createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(0,0,-0.521),
    rotation:Quaternion.fromEulerDegrees(0,0,0),
    scale:Vector3.create(0.8,0.8,1),
    homeURL:"https://cardgames.io",
    parent:wrapper,
/!*    spriteSheetImage:"http://localhost:3001/public/spritesheet.png",
    spinnerImage:"http://localhost:3001/public/load-icon-white.png",
    spinnerImageAlpha:"http://localhost:3001/public/load-icon-alpha-b.png",
    clickSoundSrc:"http://localhost:3001/public/click.mp3",*!/
    userLockTimeMs:10_000
  });*/

  const browser1 = await createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(6, 2, 8),
    rotation:Quaternion.fromEulerDegrees(0,0,0),
    scale:Vector3.create(4,768/1024 * 4,1),
    homeURL:"https://decentraland.org/governance"
  });

  const linkList = createLinkList({
    position:Vector3.create(8.5, 3.5, 8),
    links:[
        "https://decentraland.org/governance",
        "https://decentraland.org/marketplace/",
        "https://cardgames.io",
        "https://www.lowpolymodelsworld.com",
        "https://doki3d.carrd.co/",
        "https://cocobay.world/",
        "https://swissverse.org",
        "https://nftplazas.com/",
        "https://vivalacalaca.com"
    ],
    onClick:(URL)=>{
      browser1.setURL(URL);
    }
  });


/*  createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(11, 1.4, 8),
    rotation:Quaternion.fromEulerDegrees(0,180,0),
    scale:Vector3.create(3,768/1024 * 3,1),
    homeURL:"https://cardgames.io",
    roomInstanceId:"cardgames-2"
  });*/

/*  createVirtualBrowserClient({
    colyseusServerURL:WEBSOCKET_URL,
    baseAPIURL:SERVER_BASE_URL,
    position:Vector3.create(2, 2, 14),
    rotation:Quaternion.fromEulerDegrees(0,0,0),
    scale:Vector3.create(3,768/1024 * 3,1),
    homeURL:"https://playclassic.games/games/turn-based-strategy-dos-games-online/play-heroes-might-magic-online/play/"
  });*/

}