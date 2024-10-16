import {Color4, Quaternion, Vector3} from "@dcl/sdk/math";
import {getPlayer} from "@dcl/sdk/players";
import {createTextBar} from "./text-bar";
import {createLoadingOverlay} from "./loading-overlay";
import {Client, Room} from "colyseus.js";
import * as utils from "@dcl-sdk/utils";
import {dclSleep} from "../dcl-sleep";
import {openExternalUrl} from "~system/RestrictedActions";
import "xmlhttprequest-polyfill";
// @ts-ignore
import { URL } from "whatwg-url-without-unicode";
// @ts-ignore
(globalThis as any)['URL'] = URL as any;
import { teleportTo } from "~system/RestrictedActions"

import {
    engine,
    Entity,
    InputAction, Material,
    MeshCollider,
    MeshRenderer,
    pointerEventsSystem, TextureFilterMode,
    TextureUnion,
    Transform
} from "@dcl/sdk/ecs";

import {VirtualBrowserClientConfigParams} from "./virtual-browser-client-types";
import {getUvsFromSprite} from "../services/uvs-sprite";
import {createTopBar} from "./top-bar";
import {createScrollBar} from "./scoll-bar";
import {createClickFeedbackHandler} from "./click-feedback";
const textures: { [key: string]: TextureUnion } = {};
const DEFAULT_RESOLUTION = [1024,768]
const DEFAULT_WIDTH = 2;

const defaultConfig:VirtualBrowserClientConfigParams = {
    resolution:DEFAULT_RESOLUTION,
    position:Vector3.create(0,2,0),
    scale:Vector3.create(DEFAULT_WIDTH, DEFAULT_WIDTH * (DEFAULT_RESOLUTION[1]/DEFAULT_RESOLUTION[0]), 1 ),
    homeURL:"https://decentraland.org/governance",
    roomInstanceId:"https://decentraland.org/governance",
    colyseusServerURL:"ws://localhost:3000",
    baseAPIURL:"http://localhost:3000",
    rotation:Quaternion.Zero(),
    userLockTimeMs:30_000,
    parent:undefined,
    spriteSheetImage:"https://dcl-browser.zeroxwork.com/public/spritesheet.png",
    spinnerImage:"https://dcl-browser.zeroxwork.com/public/load-icon-white.png",
    spinnerImageAlpha:"https://dcl-browser.zeroxwork.com/public/load-icon-alpha-b.png",
    clickSoundSrc:"https://dcl-browser.zeroxwork.com/public/click.mp3",
};

export const createVirtualBrowserClient = async (_config:VirtualBrowserClientConfigParams = defaultConfig)=>{
    const config = {
        ...defaultConfig,
        roomInstanceId:_config.roomInstanceId||_config.homeURL||defaultConfig.roomInstanceId,
        ..._config
    };
    const player = await getPlayer();
    const userId = player?.userId || "";
    const state = {
        alive:false,
        lastAliveReceived:0,
        ALIVE_INTERVAL_MS:0
    }
    const backgroundTexture = Material.Texture.Common({
        src: config.spriteSheetImage,
        //filterMode: TextureFilterMode.TFM_POINT,
    });
    const planeEntity = createPlaneEntity(config.parent);
    const clickFeedback = createClickFeedbackHandler(planeEntity, config);
    const urlBarOptions = {maxChars:53, position:Vector3.create(0.22,0.505,-0.01), parent:planeEntity, text:config.homeURL};
    const urlBar = createTextBar(urlBarOptions);
    const backgroundEntity = engine.addEntity();

    createTopBar({
        parent: planeEntity,
        homeURL: config.homeURL,
        onHome: () => userCanInteract() && room.send("HOME"),
        onBack: () => userCanInteract() &&room.send("BACK"),
        onForward: () => userCanInteract() &&room.send("FORWARD")
    });

    const scrollBar = createScrollBar({
        parent:planeEntity,
        onScrollDown:()=>userCanInteract() && room!.send("DOWN", { user:{userId, name:player?.name, isGuest:player?.isGuest } }),
        onScrollUp:()=>userCanInteract() && room!.send("UP", { user:{userId, name:player?.name, isGuest:player?.isGuest } })
    });

    MeshRenderer.setPlane(backgroundEntity);
    const mutablePlaneBack: any = MeshRenderer.getMutable(backgroundEntity);
    if (mutablePlaneBack.mesh) mutablePlaneBack.mesh[mutablePlaneBack.mesh.$case].uvs = getUvsFromSprite({
        spriteDefinition: {
            spriteSheetWidth: 512,
            spriteSheetHeight: 512,
            x: 0,
            y: 41,
            w: 512,
            h: 512-41
        }, back: 1
    });

    Transform.create(backgroundEntity, {
        position:Vector3.create(0,0,0.001),
        scale:Vector3.create(1 , 1 + 0.13,1),
        rotation:Quaternion.fromEulerDegrees(0,180,0),
        parent:planeEntity
    });
    Material.setPbrMaterial(backgroundEntity, {
        texture:backgroundTexture,
        //emissiveTexture: texture,
        emissiveIntensity: 0.4,
        emissiveColor: Color4.fromHexString("#c6c6c6"),
        albedoColor:Color4.fromHexString("#c6c6c6"),
        specularIntensity: 0,
        roughness: 1,
        alphaTest: 1,
        transparencyMode: 1,
    });


    const statusBarOptions = {maxChars:53+(23*2+5),position:Vector3.create(0,-0.55,-0.01), parent:planeEntity, text:"Connecting..."};
    const statusBar = createTextBar(statusBarOptions);
    const initialTextureSrc = `${config.baseAPIURL}/api/screenshot2?roomInstanceId=${config.roomInstanceId}`;
    const loadingOverlay = createLoadingOverlay({parent:planeEntity, config});
    let room: Room|null = null;
    let reconnectionToken:any;
    let client:Client;


    client = new Client(config.colyseusServerURL);
    await tryConnectRoom();

    utils.timers.setInterval( () => {
        updateStatusBar();
        checkAlive();
    }, 1000);

    return {};

    async function tryConnectRoom(){
        try {
            room = await client.joinOrCreate("browser-room2", {
                ...config,
                width:config.resolution![0],
                height:config.resolution![1],
                url:config.homeURL
            });

            state.alive = true;
            statusBar.update(`Connected`);
            reconnectionToken = room!.reconnectionToken;

            addRoomListeners();
            applyTextureToPlane(planeEntity, initialTextureSrc);
            setupPointerEvents(planeEntity, userId);

        } catch (error) {
            console.log("ERROR", error);
            await dclSleep(5000);
            await tryConnectRoom();
            return;
        }
    }

    function checkAlive(){
        if(state.lastAliveReceived && ((Date.now() - state.lastAliveReceived) > state.ALIVE_INTERVAL_MS * 5)){
            state.alive = false;
        }
    }

    function handleRemoteClick({normalizedX, normalizedY}){
        clickFeedback.execute(normalizedX, normalizedY)
    }

    function handleAlive({ALIVE_INTERVAL_MS}:{ALIVE_INTERVAL_MS:number}){
        state.lastAliveReceived = Date.now();
        state.ALIVE_INTERVAL_MS = ALIVE_INTERVAL_MS;
        state.alive = true;
    }

    async function roomOnLeave(code:number){
        console.log("code",code);
        console.log("room?.connection.isOpen",room?.connection.isOpen)
        loadingOverlay.enable({text:"Reconnecting..."});
        statusBar.update("Disconnected and reconnecting...");
        await reconnect();

        async function reconnect() {
            statusBar.update("Trying to reconnect");
            try{
                client.reconnect(reconnectionToken).then(room_instance => {
                    room = room_instance;
                    reconnectionToken = room!.reconnectionToken;
                    addRoomListeners();
                    console.log("Reconnected successfully!");
                }).catch(async error => {
                    console.log("error1",error)
                    console.log("room?.connection.isOpen",room?.connection.isOpen)

                    statusBar.update("reconnection failed, trying again...")
                    await dclSleep(1000)
                    await tryConnectRoom();
                });
            }catch(error){
                console.log("error2",error)
                console.log("room?.connection.isOpen",room?.connection.isOpen)
                statusBar.update("reconnection failed, trying again...")
                await dclSleep(1000)
                await tryConnectRoom();
            }

        }
    }

    function addRoomListeners(){
        room!.onLeave(roomOnLeave);
        room!.onError((error)=>{
            console.log("room error", error);
        });
        room!.onMessage("SCREENSHOT2", handleScreenshotMessage);
        room!.onMessage("TELEPORT", handleTeleportMessage);
        room!.onMessage("TAB", handleTabMessage);
        room!.onMessage("ALIVE", handleAlive)
        room!.onMessage("CLICK", handleRemoteClick);
        room!.onStateChange(updateStatusBar);
        room!.state.listen("url", roomStateUrlChange);
        room!.state.listen("idle", roomStateIdleChange);
    }

    function roomStateUrlChange(currentValue:string, previousValue:string){
        console.log("listen url", currentValue, previousValue)
        const textureSrc = `${config.baseAPIURL}/api/screenshot2?roomInstanceId=${config.roomInstanceId}`;
        applyScreenshotTexture(textureSrc)
    }

    function roomStateIdleChange(isIdle:boolean){
        isIdle?loadingOverlay.disable():loadingOverlay.enable({text:""})
    }

    function handleTabMessage({url}:{url:string}){
        if(room?.state.user.userId === userId){
            openExternalUrl({url});
        }
    }

    function createPlaneEntity(parent?:Entity): Entity {
        const entity = engine.addEntity();
        MeshRenderer.setPlane(entity);
        MeshCollider.setPlane(entity);
        Transform.create(entity, {
            position: config.position,
            rotation: config.rotation,
            scale: config.scale,
            parent
        });
        return entity;
    }

    function setupPointerEvents(entity: Entity, userId: string) {
        pointerEventsSystem.onPointerDown(
            {
                entity,
                opts: { button: InputAction.IA_ANY, hoverText: "E/F : SCROLL" },
            },
            ({ button, hit }) => {
                if (!userCanInteract()) return;

                if (button === InputAction.IA_SECONDARY) {
                    room!.send("DOWN", { user:{userId, name:player?.name, isGuest:player?.isGuest } });
                } else if (button === InputAction.IA_PRIMARY) {
                    room!.send("UP", { user:{userId, name:player?.name, isGuest:player?.isGuest } });
                } else if (button === InputAction.IA_POINTER) {
                    const planeTransform = getWorldTransform(entity);
                    if (!planeTransform) return;

                    console.log("hit.position!", hit.position);
                    const hitPosition = hit.position;

                    const diff = Vector3.subtract(hitPosition, planeTransform.position);
                    const invRotation = invertQuaternion(planeTransform.rotation);
                    const localPosition = rotateVectorByQuaternion(diff, invRotation);
                    const localPositionScaled = Vector3.create(
                        localPosition.x / planeTransform.scale.x,
                        localPosition.y / planeTransform.scale.y,
                        localPosition.z / planeTransform.scale.z
                    );

                    const normalizedX = localPositionScaled.x + 0.5;
                    const normalizedY = 1 - (localPositionScaled.y + 0.5);

                    console.log("normalized point", normalizedX, normalizedY);
                    room.send("CLICK", {
                        user: { userId, name: player?.name, isGuest: player?.isGuest },
                        normalizedX,
                        normalizedY,
                    });
                }
            }
        );

        function getWorldTransform(entity: Entity): any {
            let currentTransform = Transform.getOrNull(entity);
            if (!currentTransform) return null;

            // Initialize world position, rotation, and scale as identity
            let worldPosition = currentTransform.position;
            let worldRotation = currentTransform.rotation;
            let worldScale = currentTransform.scale;

            // Traverse the hierarchy
            let parentEntity = currentTransform.parent;
            while (parentEntity !== undefined) {
                const parentTransform = Transform.getOrNull(parentEntity);
                if (!parentTransform) break;  // If no transform, break the loop

                // Apply parent's rotation to current position
                worldPosition = Vector3.add(
                    rotateVectorByQuaternion(worldPosition, parentTransform.rotation),
                    parentTransform.position
                );

                // Apply parent's rotation and scale
                worldRotation = Quaternion.multiply(parentTransform.rotation, worldRotation);
                worldScale = Vector3.multiply(worldScale, parentTransform.scale);

                // Move to the next parent
                parentEntity = parentTransform.parent;
            }

            return { position: worldPosition, rotation: worldRotation, scale: worldScale };
        }
    }

    function userCanInteract(){
        if (!room!.state.idle) return false;
        if (!room!.connection.isOpen) return false;
        if (isLocked() && room!.state.user.userId !== userId) return false;

        return true;
    }

    function updateStatusBar(){
        if((room!.state && !room!.connection.isOpen) || !state.alive ){
            loadingOverlay.enable({text:"Disconnected..."});
            return "Disconnected...";
        }

        const statusStr = ` scroll:${room!.state.currentPage}(${room!.state.currentPage * (config.resolution![1] as number)}) height:${room!.state.fullHeight}`;
        const restSeconds= Math.max(0,Math.floor((config!.userLockTimeMs! - (Date.now() - room!.state.user.lastInteraction))/1000));
        const userStr = ((room!.state.user.lastInteraction+config.userLockTimeMs)<Date.now())
            ? ` <color=#55ff00>unlocked</color>`
            : ` <color="orange">${room!.state.user.name} is using it ${restSeconds}</color>`;
        statusBar.update(`${room!.state.idle ? "Idle ":"Loading"}`+statusStr+userStr);
        urlBar.update(room!.state.url);
    }

    function isLocked(){
        return ((room!.state.user.lastInteraction+config.userLockTimeMs)>Date.now());
    }

    function handleTeleportMessage({x,y}){
        teleportTo({ worldCoordinates: { x, y } })
    }

    function handleScreenshotMessage({fullHeight, topY}) {
        const textureSrc = `${config.baseAPIURL}/api/screenshot2?roomInstanceId=${config.roomInstanceId}`;
        delete textures[textureSrc];
        applyScreenshotTexture(textureSrc);
        if(fullHeight) scrollBar.update({topY, fullHeight});
    }
    

    function applyScreenshotTexture(textureSrc: string) {
        const texture = createAndCacheTexture(`${textureSrc}&r=${Math.random()}`);
        applyMaterialToEntity(planeEntity, texture);
    }

    function createAndCacheTexture(textureSrc: string): TextureUnion {
        return textures[textureSrc] = textures[textureSrc] || Material.Texture.Common({
            src: textureSrc,
            //filterMode: TextureFilterMode.TFM_POINT,
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


function invertQuaternion(q: Quaternion): Quaternion {
    return Quaternion.create(-q.x, -q.y, -q.z, q.w);
}

function rotateVectorByQuaternion(vector: Vector3, quaternion: Quaternion): Vector3 {
    // Extract quaternion components
    const qx = quaternion.x;
    const qy = quaternion.y;
    const qz = quaternion.z;
    const qw = quaternion.w;

    // Compute quaternion multiplication (quaternion * vector)
    const ix =  qw * vector.x + qy * vector.z - qz * vector.y;
    const iy =  qw * vector.y + qz * vector.x - qx * vector.z;
    const iz =  qw * vector.z + qx * vector.y - qy * vector.x;
    const iw = -qx * vector.x - qy * vector.y - qz * vector.z;

    // Compute the rotated vector (result * inverse quaternion)
    return Vector3.create(
        ix * qw + iw * -qx + iy * -qz - iz * -qy,
        iy * qw + iw * -qy + iz * -qx - ix * -qz,
        iz * qw + iw * -qz + ix * -qy - iy * -qx
    );
}

