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
    const initialTextureSrc =
        `${SERVER_BASE_URL}/api/screenshot?url=${config.url}&width=${config.width}&height=${config.height}&page=0`;

    let room: Room;
    try {
        room = await client.joinOrCreate("browser-room", config);
    } catch (error) {
        console.log("ERROR", error);
        return;
    }

    applyTextureToPlane(planeEntity, initialTextureSrc);
    setupPointerEvents(planeEntity, room, userId);
    room.onMessage("SCREENSHOT", handleScreenshotMessage);
    room.onStateChange(handleStateChange);
    room.state.listen("url", (currentValue:string, previousValue:string) => {
        const textureSrc = `${SERVER_BASE_URL}/api/screenshot?url=${currentValue}&width=${config.width}&height=${config.height}&page=0`;
        console.log(`url is now ${currentValue}`);
        console.log(`previous value was: ${previousValue}`);
        applyScreenshotTexture(textureSrc)
    });
    function createPlaneEntity(): Entity {
        const entity = engine.addEntity();
        MeshRenderer.setPlane(entity);
        MeshCollider.setPlane(entity);
        Transform.create(entity, {
            position: Vector3.create(8, 2, 8),
            scale: Vector3.create(4, (768 / 1024) * 4, 1),
        });
        return entity;
    }

    // Function to set up pointer events
    function setupPointerEvents(entity: Entity, room: Room, userId: string) {
        pointerEventsSystem.onPointerDown(
            {
                entity,
                opts: { button: InputAction.IA_ANY, hoverText: "E/F : UP/DOWN" },
            },
            ({ button, hit }) => {
                if (!room.state.idle) return;

                if (button === InputAction.IA_SECONDARY) {
                    if (
                        room.state.currentPage <
                        Math.ceil(room.state.fullHeight / config.height) - 1
                    ) {
                        room.send("DOWN", { userId });
                    }
                } else if (button === InputAction.IA_PRIMARY) {
                    if (room.state.currentPage > 0) {
                        room.send("UP", { userId });
                    }
                } else if (button === InputAction.IA_POINTER) {
                    const normalizedX = 1 - (10 - hit!.position!.x) / 4;
                    const normalizedY =
                        1 + (0.5 - hit!.position!.y) / ((768 / 1024) * 4);
                    room.send("CLICK", { userId, normalizedX, normalizedY });
                }
            }
        );
    }

    function handleScreenshotMessage({url, page}: ScreenshotMessage) {
        const textureSrc = `${SERVER_BASE_URL}/api/screenshot?url=${url}&width=${config.width}&height=${config.height}&page=${page}`;
        if (textures[textureSrc]) {
            delete textures[textureSrc];
            if (page === room.state.currentPage) {
                applyScreenshotTexture(textureSrc);
            }
        }
    }

    function handleStateChange() {
        if (!room.state.loadingPage || room.state.firstPageAvailable) {
            const textureSrc = `${SERVER_BASE_URL}/api/screenshot?url=${room.state.url}&width=${config.width}&height=${config.height}&page=${room.state.currentPage}`;
            applyScreenshotTexture(textureSrc);
        }
    }

    function applyScreenshotTexture(textureSrc: string) {
        const texture = createAndCacheTexture(
            `${textureSrc}&r=${Math.random()}`
        );
        applyMaterialToEntity(planeEntity, texture);
    }

    function createAndCacheTexture(textureSrc: string): TextureUnion {
        if (textures[textureSrc]) {
            return textures[textureSrc];
        }
        const texture = Material.Texture.Common({
            src: textureSrc,
            filterMode: TextureFilterMode.TFM_POINT,
        });
        textures[textureSrc] = texture;
        return texture;
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