import {
    engine,
    InputAction, MeshCollider,
    MeshRenderer,
    pointerEventsSystem,
    TextAlignMode,
    TextShape,
    Transform
} from "@dcl/sdk/ecs";
import {Color4, Vector3} from "@dcl/sdk/math";

export const createLinkList = ({
                                   position, parent = undefined, links, onClick = (str:string) => {}
                               }) => {
    const entity = engine.addEntity();
    Transform.create(entity, {
        position
    })
    const callbacks = {
        onClick
    };

    const linkEntities = links.map((link: string, index: number) => {
        const linkEntity = engine.addEntity();

        Transform.create(linkEntity, {
            parent: entity,
            position:Vector3.create(2.5,-0.4*index,0.01),
            scale:Vector3.create(5,0.2,1)
        });
        MeshRenderer.setPlane(linkEntity);
        MeshCollider.setPlane(linkEntity);

        const textEntity = engine.addEntity();

        TextShape.create(textEntity, { text: link, fontSize:2, textAlign: TextAlignMode.TAM_TOP_LEFT, textColor:Color4.Blue()});

        Transform.create(textEntity, {
            position:Vector3.create(0,(-0.4*index)+0.1,0),
            parent: entity
        });

        pointerEventsSystem.onPointerDown({
            entity:linkEntity,
            opts: { button: InputAction.IA_POINTER, hoverText: "Change URL" },
        },()=>{
            console.log("link",link);
            callbacks.onClick(link);
        })
    });

}