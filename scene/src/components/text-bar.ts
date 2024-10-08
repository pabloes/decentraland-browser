import {engine, Entity, Font, Material, MeshRenderer, TextAlignMode, TextShape, Transform,} from "@dcl/sdk/ecs";
import {Color4, Vector3} from "@dcl/sdk/math";

export const createTextBar = ({maxChars =53,position, parent, text = "."}:{maxChars:number, position:Vector3, parent:Entity, text?:string}) => {
    const entity =  engine.addEntity();
    const textEntity = engine.addEntity();

    Transform.create(entity, {position, parent});
    Transform.create(textEntity, {
        parent:entity,
        position:Vector3.create(-.5,0.035,-0.001),
        scale:Vector3.create(0.3,0.3,1)
    });

    TextShape.create(textEntity, {
        text:text.length > maxChars?text.substring(0,maxChars)+"...":text,
        fontSize: 1,
        textAlign:TextAlignMode.TAM_TOP_LEFT,
        width:1,
        paddingLeft:0.05
    })

    return {
        update
    }

    function update(text:string){
        TextShape.getMutable(textEntity).text = text.length > maxChars?text.substring(0,maxChars)+"...":text;
    }
}
