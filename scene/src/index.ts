import "./polyfill";
import { Client, Room } from "colyseus.js";
import {
    engine,
    Entity,
    InputAction,
    Material,
    MeshCollider,
    MeshRenderer,
    pointerEventsSystem,
    TextureFilterMode,
    Transform,
} from "@dcl/sdk/ecs";

import { Color4, Vector3 } from "@dcl/sdk/math";
import { getPlayer } from "@dcl/sdk/players";
import { TextureUnion } from "@dcl/sdk/ecs";
import {createTextBar} from "./components/text-bar";
import {createLoadingOverlay} from "./components/loading-overlay";

const SERVER_BASE_URL = "http://localhost:3000";
const WEBSOCKET_URL = "ws://localhost:3000";
const client = new Client(WEBSOCKET_URL);
const textures: { [key: string]: TextureUnion } = {};

const _logs = console.log;
console.log = (...args: any[]) => {
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    _logs(`BRO:`, time, ...args);
};

const SCREEN_SIZE = 4;

export async function main() {
    console.log("MAIN!");
    const player = await getPlayer();
    const userId = player?.userId || "";
    const config = {
        roomInstanceId: 0,
        url: "https://decentraland.org/governance",
        width: 1024,
        height: 768,
    };

    const planeEntity = createPlaneEntity();

    const urlBar = createTextBar({position:Vector3.create(0,0.5,-0.01), parent:planeEntity, text:config.url})
    const statusBar = createTextBar({position:Vector3.create(0,-0.55,-0.01), parent:planeEntity, text:"Disconnected"})
    const initialTextureSrc =
        `${SERVER_BASE_URL}/api/screenshot?url=${encodeURIComponent(config.url)}&width=${config.width}&height=${config.height}&page=0`;
    let room: Room;
    try {
        room = await client.joinOrCreate("browser-room", config);
        statusBar.update(`Connected`);

    } catch (error) {
        console.log("ERROR", error);
        return;
    }

    const spinner = createLoadingOverlay({parent:planeEntity});

    applyTextureToPlane(planeEntity, initialTextureSrc);
    setupPointerEvents(planeEntity, room, userId);

    room.onMessage("SCREENSHOT", handleScreenshotMessage);

    room.onStateChange(()=>{
        console.log("room state", JSON.stringify(room.state.toJSON()))
        const statusStr = ` scroll:${room.state.currentPage}(${room.state.currentPage*config.height}) height:${room.state.fullHeight}`
       statusBar.update(`${room.state.idle?"Idle ":""}${room.state.loadingPage?"Loading... ":""}`+statusStr);
        urlBar.update(room.state.url);
    });

    room.state.listen("url", (currentValue:string, previousValue:string) => {
        console.log("listen url", currentValue, previousValue)
        const textureSrc = `${SERVER_BASE_URL}/api/screenshot?url=${encodeURIComponent(currentValue)}&width=${config.width}&height=${config.height}&page=0`;
        applyScreenshotTexture(textureSrc)
    });

    room.state.listen("idle", (isIdle:boolean)=>isIdle?spinner.disable():spinner.enable())

    function createPlaneEntity(): Entity {
        const entity = engine.addEntity();
        MeshRenderer.setPlane(entity);
        MeshCollider.setPlane(entity);
        Transform.create(entity, {
            position: Vector3.create(8, 2, 8),
            scale: Vector3.create(SCREEN_SIZE, (768 / 1024) * SCREEN_SIZE, 1),
        });
        return entity;
    }

    function setupPointerEvents(entity: Entity, room: Room, userId: string) {
        pointerEventsSystem.onPointerDown(
            {
                entity,
                opts: { button: InputAction.IA_ANY, hoverText: "E/F : SCROLL" },
            },
            ({ button, hit }) => {
                if (!room.state.idle) return;

                if (button === InputAction.IA_SECONDARY) {
                    if (
                        room.state.currentPage <
                        Math.ceil(room.state.fullHeight / config.height) - 1
                    ) {
                        room.send("DOWN", { userId });
                        console.log("down", room.state.url);
                        const textureSrc = `${SERVER_BASE_URL}/api/screenshot?url=${encodeURIComponent(room.state.url)}&width=${config.width}&height=${config.height}&page=${room.state.currentPage+1}`;
                        applyScreenshotTexture(textureSrc)
                    }
                } else if (button === InputAction.IA_PRIMARY) {
                    if (room.state.currentPage > 0) {
                        room.send("UP", { userId });
                        console.log("up", room.state.url);
                        const textureSrc = `${SERVER_BASE_URL}/api/screenshot?url=${encodeURIComponent(room.state.url)}&width=${config.width}&height=${config.height}&page=${room.state.currentPage-1}`;
                        applyScreenshotTexture(textureSrc)
                    }

                } else if (button === InputAction.IA_POINTER) {
                    const normalizedX = 1 - (10 - hit!.position!.x) / SCREEN_SIZE;
                    const normalizedY =
                        1 + (0.5 - hit!.position!.y) / ((768 / 1024) * SCREEN_SIZE);
                    room.send("CLICK", { userId, normalizedX, normalizedY });
                }
            }
        );
    }

    function handleScreenshotMessage({url, page}: ScreenshotMessage) {
        console.log("handleScreenshotMessage", url, page)
        if(url !== room.state.url){
            console.log("this screenshot is not current url", url, room.state.url)
            return;
        }
        const textureSrc = `${SERVER_BASE_URL}/api/screenshot?url=${encodeURIComponent(url)}&width=${config.width}&height=${config.height}&page=${page}`;
        delete textures[textureSrc];
        if (page === room.state.currentPage) {
            applyScreenshotTexture(textureSrc);
        }
    }

    function applyScreenshotTexture(textureSrc: string) {
        const texture = createAndCacheTexture(`${textureSrc}&r=${Math.random()}`);
        applyMaterialToEntity(planeEntity, texture);
    }

    function createAndCacheTexture(textureSrc: string): TextureUnion {
        return textures[textureSrc] = textures[textureSrc] || Material.Texture.Common({
            src: textureSrc,
            filterMode: TextureFilterMode.TFM_POINT,
        });
    }

    function applyMaterialToEntity(entity: Entity, texture: TextureUnion) {
        Material.setPbrMaterial(entity, {
            texture,
            emissiveTexture: texture,
            emissiveIntensity: 0.6,
            emissiveColor: Color4.create(1, 1, 1, 1),
            specularIntensity: 0,
            roughness: 1,
            alphaTest: 1,
            transparencyMode: 1,
        });
    }

    function applyTextureToPlane(entity: Entity, textureSrc: string) {
        const texture = createAndCacheTexture(textureSrc);
        applyMaterialToEntity(entity, texture);
    }
}

type ScreenshotMessage = {
    width: number;
    height: number;
    url: string;
    page: number;
}