import {engine, MeshRenderer, Transform} from "@dcl/sdk/ecs";
import {Vector3} from "@dcl/sdk/math";
import {dclSleep} from "../dcl-sleep";
import {playSoundOnEntity} from "../services/sounds";

export const createClickFeedbackHandler = (parent, config) => {
    const entity = engine.addEntity();

    Transform.create(entity, {
        parent,
        position:Vector3.create(0,0,-0.001),
        scale:Vector3.create(0,0,1)
    });

    MeshRenderer.setPlane(entity);

    const show = ()=>{
        const transform =Transform.getMutable(entity);
        const {position, scale} = transform;
        scale.x = scale.y = 0.03;
    }
    const hide = ()=>{
        const transform =Transform.getMutable(entity);
        const {position, scale} = transform;
        scale.x = scale.y = 0;
    }
    return {
        execute:async (normalizedX, normalizedY)=>{
            console.log(" config.playSoundOnEntity", config.playSoundOnEntity);
            playSoundOnEntity(parent, config.clickSoundSrc)
            const x = normalizedX-0.5;
            const y = -normalizedY+0.5;

            const transform =Transform.getMutable(entity);
            const {position, scale} = transform;
            position.x = x;
            position.y = y;

            show();
            await dclSleep(50);
            hide();
            await dclSleep(50);
            show();
            await dclSleep(50);
            hide();

        }
    }
}