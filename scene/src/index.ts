import "./polyfill";
import {Client, Room} from "colyseus.js";
import {
    engine, InputAction,
    Material,
    MeshCollider,
    MeshRenderer,
    pointerEventsSystem,
    TextureFilterMode,
    Transform
} from "@dcl/sdk/ecs";

import {Color4, Vector3} from "@dcl/sdk/math";
import { getPlayer } from '@dcl/sdk/src/players'
import {TextureUnion} from "@dcl/ecs/dist/components/generated/types.gen";

const _logs = console.log;
console.log = (...args)=>{
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    _logs(`BRO:`, time  ,...args)
};

const client = new Client("ws://localhost:3000");
const textures:{[key:string]:TextureUnion}={};

export async function main() {
    console.log("MAIN!");
    const {userId} = (await getPlayer()) || {};
    const serverBaseURL = `http://localhost:3000`
    const config = {
        roomInstanceId: 0,
        url: `https://decentraland.org/governance`,
        width: 1024,
        height: 768
    }
    const room: any = await client.joinOrCreate("browser-room", config).then((room: Room) => {
        return room;
    }).catch((e) => {
        console.log("ERROR", e);
    });
    console.log("connected room");

    const planeEntity = engine.addEntity();
    MeshRenderer.setPlane(planeEntity)
    MeshCollider.setPlane(planeEntity)
    Transform.create(planeEntity, {
        position: Vector3.create(8, 2, 8),
        scale: Vector3.create(4, 768 / 1024 * 4, 1),
    });


    const textureSrc = `${serverBaseURL}/api/screenshot?url=${config.url}&width=${config.width}&height=${config.height}&page=0`;
    const texture = textures[textureSrc] || Material.Texture.Common({
        src:textureSrc ,
        filterMode: TextureFilterMode.TFM_POINT
    });
    textures[textureSrc] = texture;
    Material.setPbrMaterial(planeEntity, {
        texture,
        emissiveTexture: texture,
        emissiveIntensity: 0.6,
        emissiveColor: Color4.create(1, 1, 1, 1),
        specularIntensity: 0,
        roughness: 1,
        alphaTest: 1,
        transparencyMode: 1
    });

    room.onMessage(`SCREENSHOT`, ({ width, height, url, page}:any)=>{
        console.log("SCREENSHOT",{ width, height, url, page})
        const textureSrc = `http://localhost:3000/api/screenshot?url=${url}&width=${width}&height=${height}&page=${page}`;
        if(textures[textureSrc]){
            delete textures[textureSrc];
            if(page === room.state.currentPage){
                applyScreenshotTexture(textureSrc);
            }
        }
    });

    function applyScreenshotTexture(textureSrc:string){
        console.log("applyScreenshotTexture",textureSrc);
        const texture = textures[textureSrc] || Material.Texture.Common({
            src:textureSrc+`&r=${Math.random()}`,
            filterMode: TextureFilterMode.TFM_POINT
        });

        textures[textureSrc] = texture;
        Material.setPbrMaterial(planeEntity, {
            texture,
            emissiveTexture: texture,
            emissiveIntensity: 0.6,
            emissiveColor: Color4.create(1, 1, 1, 1),
            specularIntensity: 0,
            roughness: 1,
            alphaTest: 1,
            transparencyMode: 1
        });
    }
    room.onStateChange((...args:any[]) => {
        console.log("onStateChange", room.state.loadingPage,room.state.firstPageAvailable, args);
        if (room.state.loadingPage === false || room.state.firstPageAvailable) {
            const textureSrc = `http://localhost:3000/api/screenshot?url=${room.state.url}&width=${room.state.width}&height=${room.state.height}&page=${room.state.currentPage}`;
            applyScreenshotTexture(textureSrc)
        }

            pointerEventsSystem.onPointerDown(
                {
                    entity: planeEntity,
                    opts: {button: InputAction.IA_ANY, hoverText: 'E/F : UP/DOWN'},
                },

                ({button, hit, state: _state, tickNumber, timestamp}) =>{
                    if(!room.state.idle) return;
                    if (button === InputAction.IA_SECONDARY) {
                        if (room.state.currentPage < (Math.ceil(room.state.fullHeight/room.state.height) - 1)) {
                            room.send("DOWN", {userId});
                        }
                    } else if (button === InputAction.IA_PRIMARY) {
                        if (room.state.currentPage > 0) {
                            room.send("UP", {userId});
                        }
                    } else if (button === InputAction.IA_POINTER) {
                        const normalizedX = 1 - (10 - hit!.position!.x) / 4;
                        const normalizedY = 1 + (0.5 - hit!.position!.y) / (768 / 1024 * 4);
                        room.send("CLICK", {userId, normalizedX, normalizedY});
                    }
                }
            );
    });

}
