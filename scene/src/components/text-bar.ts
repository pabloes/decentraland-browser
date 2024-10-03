import {engine, Entity, Material, MeshRenderer, TextAlignMode, TextShape, Transform,} from "@dcl/sdk/ecs";
import {Color4, Vector3} from "@dcl/sdk/math";

export const createTextBar = ({position, parent, text = "."}:{position:Vector3, parent:Entity, text?:string}) => {
    const entity =  engine.addEntity();
    const planeEntity =  engine.addEntity();
    const textEntity = engine.addEntity();

    Transform.create(entity, {position, parent});
    Transform.create(planeEntity, {parent:entity, scale:Vector3.create(1,0.05,1), position:Vector3.create(0,0.025,0)});
    Transform.create(textEntity, {
        parent:entity,
        position:Vector3.create(-.5,0.035,-0.01),
        scale:Vector3.create(0.3,0.3,1)
    });

    Material.setBasicMaterial(planeEntity, {
        diffuseColor:Color4.Gray()
    });

    MeshRenderer.setPlane(planeEntity);

    TextShape.create(textEntity, {
        text:text.length > 53?text.substring(0,53)+"...":text,
        fontSize: 1,
        textAlign:TextAlignMode.TAM_TOP_LEFT,
        width:1,
        paddingLeft:0.05
    })

    return {
        update
    }

    function update(text:string){
        TextShape.getMutable(textEntity).text = text.length > 53?text.substring(0,53)+"...":text;
    }
}