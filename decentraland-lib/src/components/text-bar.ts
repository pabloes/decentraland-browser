import {
    engine,
    Entity,
    Font, InputAction,
    Material,
    MeshRenderer,MeshCollider,
    pointerEventsSystem,
    TextAlignMode,
    TextShape,
    Transform,
} from "@dcl/sdk/ecs";
import {Color4, Vector3} from "@dcl/sdk/math";
import * as ui from "dcl-ui-toolkit";

export const createTextBar = ({maxChars =53,position, parent, text = ".", onChangeURL}:{maxChars:number, position:Vector3, parent:Entity, text?:string, onChangeURL?:Function}) => {
    const entity =  engine.addEntity();
    const textEntity = engine.addEntity();
    const pointerHandler = engine.addEntity();
    const callbacks = {
        onChangeURL
    };
    const state = {
        text,
        idle:true
    }

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
        paddingLeft:0.05,
        textColor:Color4.fromHexString("#222222")
    });

    if(callbacks.onChangeURL){
        const textInputPrompt = ui.createComponent(ui.FillInPrompt, {
            title: `this feature is only for testing purpose\nwon't be available in production\nEnter URL:`,
            onAccept: (value: string) => {
                callbacks.onChangeURL && callbacks.onChangeURL(value);
                textInputPrompt.hide();
            },
        })
        Transform.create(pointerHandler, {
            position:Vector3.create(-0.13,0.01,-0.02),
            scale:Vector3.create(0.75,0.05,1),
            parent:entity
        })
        Material.setPbrMaterial(pointerHandler, {
            albedoColor:Color4.create(0,0,0,0)
        })
        MeshRenderer.setPlane(pointerHandler);
        MeshCollider.setPlane(pointerHandler);
        pointerEventsSystem.onPointerDown(
            {
                entity:pointerHandler,
                opts: { button: InputAction.IA_ANY, hoverText: "Change URL" },
            },
            ({ button, hit }) => {
                if(!state.idle) return;
                textInputPrompt.inputElement.fillInBoxElement.value = state.text;
                textInputPrompt.show();
            }
        );
    }

    return {
        update,
        setIdle:(value)=>state.idle = value
    }

    function update(text:string){
        TextShape.getMutable(textEntity).text = text.length > maxChars?text.substring(0,maxChars)+"...":text;
        state.text = text;
    }
}
