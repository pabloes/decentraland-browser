import {
    engine,
    Entity,
    InputAction,
    Material,
    MeshCollider,
    MeshRenderer,
    pointerEventsSystem,
    Transform
} from "@dcl/sdk/ecs";
import {Color4, Quaternion, Vector3} from "@dcl/sdk/math";
import {atlastTexture} from "../services/atlas-texture";
import {getUvsFromSprite} from "../services/uvs-sprite";

interface ScrollBarConfig {
    parent:Entity,
    onScrollDown?:Function,
    onScrollUp?:Function,
}

export const createScrollBar = ({parent, onScrollDown, onScrollUp}:ScrollBarConfig) => {
    const callbacks = {onScrollDown, onScrollUp};
    const entity = engine.addEntity();
    const trackEntity = engine.addEntity();
    const topButtonEntity = engine.addEntity();
    const bottomButtonEntity = engine.addEntity();
    const thumbEntity = engine.addEntity()

    Material.setBasicMaterial(trackEntity, {diffuseColor:Color4.fromHexString("#aaaaaa")});
    const buttonMaterialDefinition = {
        texture:atlastTexture,
        emissiveTexture: atlastTexture,
        emissiveIntensity: 0.6,
        emissiveColor: Color4.fromHexString("#c6c6c6"),
        albedoColor:Color4.fromHexString("#c6c6c6"),
        specularIntensity: 0,
        roughness: 1,
        alphaTest: 1,
        transparencyMode: 1,
    }
    Material.setPbrMaterial(topButtonEntity, buttonMaterialDefinition);
    Material.setPbrMaterial(bottomButtonEntity, buttonMaterialDefinition)

    Material.setBasicMaterial(thumbEntity, {diffuseColor:Color4.fromHexString("#cccccc")});

    Transform.create(entity, {parent});

    MeshRenderer.setPlane(trackEntity);
    Transform.create(trackEntity, {
        position:Vector3.create(0.5+0.025,0,0),
        scale:Vector3.create(0.05,1,1),
        parent:entity
    });

    MeshRenderer.setPlane(topButtonEntity, getUvsFromSprite({
        spriteDefinition:{
            spriteSheetWidth: 512,
            spriteSheetHeight: 512,
            x: 40,
            y: 7,
            w: 32,
            h: 32
        }
    }));
    Transform.create(topButtonEntity, {
        parent:entity,
        position:Vector3.create(0.5+0.025, 0.5+0.025+0.005,-0.0001),
        scale:Vector3.create(0.05+ 0.015,0.05,1),
        rotation:Quaternion.fromEulerDegrees(0,0,270)
    })

    MeshRenderer.setPlane(bottomButtonEntity, getUvsFromSprite({
        spriteDefinition:{
            spriteSheetWidth: 512,
            spriteSheetHeight: 512,
            x: 40,
            y: 7,
            w: 32,
            h: 32
        }
    }));
    Transform.create(bottomButtonEntity, {
        parent:entity,
        position:Vector3.create(0.5+0.025,-(0.5+0.025+0.005),-0.0001),
        scale:Vector3.create(0.05+ 0.015,0.05,1),
        rotation:Quaternion.fromEulerDegrees(0,0,90)
    })
    MeshRenderer.setPlane(thumbEntity);
    Transform.create(thumbEntity, {
        parent:trackEntity,
        position:Vector3.create(0, 0,-0.001),
        scale:Vector3.create(0.75, 0.5, 1)
    });

    MeshCollider.setPlane(topButtonEntity);
    MeshCollider.setPlane(bottomButtonEntity);
    pointerEventsSystem.onPointerDown(getPointerData(topButtonEntity, `Scroll Up (E)`), ()=>callbacks.onScrollUp && callbacks.onScrollUp());
    pointerEventsSystem.onPointerDown(getPointerData(bottomButtonEntity, "Scroll Down (F)"), ()=>callbacks.onScrollDown && callbacks.onScrollDown());


    return {
        update
    }

    function update({topY, fullHeight, viewHeight = 768}){
        const thumbTransform = Transform.getMutable(thumbEntity);
        const barHeight= thumbTransform.scale.y = viewHeight/fullHeight;
        thumbTransform.position.y = -(-0.5+ (topY/fullHeight) + barHeight/2);
    }

    function getPointerData(entity, hoverText){
        return {
            entity,
            opts: {
                button: InputAction.IA_POINTER,
                hoverText
            }
        }
    }
}