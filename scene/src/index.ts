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

const client = new Client("ws://localhost:3000");
const textures={};
export async function main() {
    console.log("MAIN!");

    const {userId} = await getPlayer();
    const room: any = await client.joinOrCreate("browser-room", {
        roomInstanceId: 0,
        url: `https://decentraland.org/governance`,
        width: 1024,
        height: 768
    }).then((room: Room) => {
        return room;
    }).catch((e) => {
        console.log("ERROR", e);
    });

    let localState = {
        firstLoaded:false,
        isIdle:false
    };

    room.onStateChange(() => {
        if (room.state.loadingPage === false || room.state.firstPageAvailable) {
            localState.isIdle = true;
            const textureSrc = `http://localhost:3000/api/screenshot?url=${room.state.url}&width=${room.state.width}&height=${room.state.height}&page=${room.state.currentPage}`;
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
        }

        if( !localState.firstLoaded && room.state.loadingPage === false){
            localState.isIdle = true;
            localState.firstLoaded = true;
            pointerEventsSystem.onPointerDown(
                {
                    entity: planeEntity,
                    opts: {button: InputAction.IA_ANY, hoverText: 'E/F : UP/DOWN'},
                },
                ({button, hit, state: _state, tickNumber, timestamp}) =>{
                    if(!localState.isIdle) return;
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
        }
    });

    const planeEntity = engine.addEntity();
    MeshRenderer.setPlane(planeEntity)
    MeshCollider.setPlane(planeEntity)
    Transform.create(planeEntity, {
        position: Vector3.create(8, 2, 8),
        scale: Vector3.create(4, 768 / 1024 * 4, 1),
    });
}
