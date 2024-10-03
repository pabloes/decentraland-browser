import {engine, Entity, Material, MeshRenderer,MaterialTransparencyMode, TextAlignMode, TextShape, Transform, TextureFilterMode, TextureWrapMode} from "@dcl/sdk/ecs";
import {Vector3,Color4} from "@dcl/sdk/math";
import * as utils from '@dcl-sdk/utils'
import {AXIS} from "@dcl-sdk/utils/dist/perpetualMotion";

export const createLoadingOverlay = ({parent}:{parent:Entity})=>{
    const state = {
        enabled:false
    }
    const entity = engine.addEntity();
    const planeEntity = engine.addEntity();
    const spinnerEntity = engine.addEntity();

    Transform.create(entity, {parent, position:Vector3.create(0, 0, -0.001)});
    Transform.create(planeEntity, {parent:entity});
    Transform.create(spinnerEntity, {parent:entity, scale:Vector3.create(0.1,0.1,0.1), position:Vector3.create(0,0,-0.001)});



    MeshRenderer.setPlane(planeEntity)
    Material.setPbrMaterial(planeEntity, {
        albedoColor: Color4.create(0,0,0,0.7)
    });

    MeshRenderer.setPlane(spinnerEntity)
    Material.setPbrMaterial(spinnerEntity, {
        texture: Material.Texture.Common({
            src: 'images/load-icon-white.png'
        }),
        alphaTexture:Material.Texture.Common({
            src: 'images/load-icon-alpha-b.png'
        }),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    });

    enable()
    return {
        enable,
        disable
    }

    function enable(){
        if(state.enabled) return;
        state.enabled = true;
        utils.perpetualMotions.smoothRotation(spinnerEntity, 1000, AXIS.Z);
        Transform.getMutable(entity).position.y = 0;
    }

    function disable(){
        if(!state.enabled) return;
        state.enabled = false;
        utils.perpetualMotions.stopRotation(spinnerEntity);
        Transform.getMutable(entity).position.y = Number.MIN_SAFE_INTEGER;
    }
}