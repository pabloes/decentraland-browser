import {
    engine,
    Entity,
    Material,
    MaterialTransparencyMode,
    MeshRenderer,
    TextAlignMode,
    TextShape,
    Transform
} from "@dcl/sdk/ecs";
import {Color4, Vector3} from "@dcl/sdk/math";
import * as utils from '@dcl-sdk/utils'
import {AXIS} from "@dcl-sdk/utils/dist/perpetualMotion";
import {VirtualBrowserClientConfigParams} from "./virtual-browser-client-types";

export const createLoadingOverlay = ({parent, config}:{parent:Entity, config:VirtualBrowserClientConfigParams})=>{
    const state = {
        enabled:false
    }
    const wrapperEntity = engine.addEntity();
    const planeEntity = engine.addEntity();
    const spinnerEntity = engine.addEntity();
    const textEntity = engine.addEntity();

    TextShape.create(textEntity, {text:"", fontSize:0.5, textAlign:TextAlignMode.TAM_TOP_CENTER})

    Transform.create(wrapperEntity, {parent, position:Vector3.create(0, 0, -0.001)});
    Transform.create(textEntity, {parent:wrapperEntity, position:Vector3.create(0,-0.1,-0.002)});
    Transform.create(planeEntity, {parent:wrapperEntity});
    Transform.create(spinnerEntity, {parent:wrapperEntity, scale:Vector3.create(0.1,0.1,0.1), position:Vector3.create(0,0,-0.001)});


    MeshRenderer.setPlane(planeEntity)
    Material.setPbrMaterial(planeEntity, {
        albedoColor: Color4.create(0,0,0,0.7)
    });

    MeshRenderer.setPlane(spinnerEntity)
    Material.setPbrMaterial(spinnerEntity, {
        texture: Material.Texture.Common({
            src:  config.spinnerImage
        }),
        alphaTexture:Material.Texture.Common({
            src:  config.spinnerImageAlpha
        }),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    });

    enable({text:"Wait...."})
    return {
        enable,
        disable
    }

    function enable({showSpinner = true, text = ""}:{showSpinner?:boolean, text?:string} = {showSpinner : true, text : ""}){
        if(state.enabled) return;
        TextShape.getMutable(textEntity).text = text;
        state.enabled = true;
        utils.perpetualMotions.smoothRotation(spinnerEntity, 1000, AXIS.Z);
        Transform.getMutable(wrapperEntity).position.y = 0;
    }

    function disable(){
        if(!state.enabled) return;
        state.enabled = false;
        utils.perpetualMotions.stopRotation(spinnerEntity);
        Transform.getMutable(wrapperEntity).position.y = Number.MIN_SAFE_INTEGER;
    }
}