import {engine, Material, MeshRenderer, Transform} from "@dcl/sdk/ecs";
import {Color4, Quaternion, Vector3} from "@dcl/sdk/math";
import {atlastTexture} from "../services/atlas-texture";
import {getUvsFromSprite} from "../services/uvs-sprite";

export const createScrollBar = ({parent}) => {
    const entity = engine.addEntity();
    const trackEntity = engine.addEntity();
    const topButtonEntity = engine.addEntity();
    const bottomButtonEntity = engine.addEntity();
    const thumbEntity = engine.addEntity()

    Material.setBasicMaterial(trackEntity, {diffuseColor:Color4.fromHexString("#aaaaaa")});
    Material.setBasicMaterial(topButtonEntity, {diffuseColor:Color4.fromHexString("#cccccc")});
    Material.setPbrMaterial(topButtonEntity, {texture:atlastTexture })
    Material.setBasicMaterial(bottomButtonEntity, {diffuseColor:Color4.fromHexString("#cccccc")});
    Material.setPbrMaterial(bottomButtonEntity, {texture:atlastTexture })
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
        position:Vector3.create(0.5+0.025,0.5+0.025+0.005,-0.0001),
        scale:Vector3.create(0.05,0.05+0.01,1),
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
        scale:Vector3.create(0.05,0.05+0.01,1),
        rotation:Quaternion.fromEulerDegrees(0,0,90)
    })
    MeshRenderer.setPlane(thumbEntity);
    Transform.create(thumbEntity, {
        parent:trackEntity,
        position:Vector3.create(0, 0,-0.001),
        scale:Vector3.create(0.75, 0.5, 1)
    });



    return {
        update
    }

    function update({topY, fullHeight}){

    }
}