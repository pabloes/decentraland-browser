import {
    engine,
    Entity,
    InputAction,
    Material,
    MeshRenderer,
    pointerEventsSystem,
    Transform,
    EventSystemCallback,
    MeshCollider
} from "@dcl/sdk/ecs";
import {Color4, Vector3} from "@dcl/sdk/math";
import {getUvsFromSprite} from "../services/uvs-sprite";
import {atlastTexture} from "../services/atlas-texture";
interface TopBarConfig {
    parent:Entity;
    homeURL:string;
    onHome?:Function;
    onBack?:Function;
    onForward?:Function;
}
export const createTopBar = ({parent, homeURL, onHome, onBack, onForward}:TopBarConfig) => {
    const callbacks = {onHome, onBack, onForward};
    const wrapper = engine.addEntity();
    Transform.create(wrapper, {parent})
    const urlBarBackgroundEntity = engine.addEntity();
    MeshRenderer.setPlane(urlBarBackgroundEntity);
    Transform.create(urlBarBackgroundEntity, { position:Vector3.create(0,0.53,0), scale:Vector3.create(1,0.06,1), parent:wrapper});
    Material.setPbrMaterial(urlBarBackgroundEntity, {
        texture:atlastTexture,
        emissiveTexture: atlastTexture,
        emissiveIntensity: 0.6,
        emissiveColor: Color4.fromHexString("#c6c6c6"),
        albedoColor:Color4.fromHexString("#c6c6c6"),
        specularIntensity: 0,
        roughness: 1,
        alphaTest: 1,
        transparencyMode: 1,
    });
    const mutableBarPlane: any = MeshRenderer.getMutable(urlBarBackgroundEntity);
    if (mutableBarPlane.mesh) mutableBarPlane.mesh[mutableBarPlane.mesh.$case].uvs = getUvsFromSprite({
        spriteDefinition: {
            spriteSheetWidth: 512,
            spriteSheetHeight: 512,
            x: 0,
            y: 0,
            w: 512,
            h: 41
        }, back: 1
    });

    const homeButtonEntity = engine.addEntity();
    MeshRenderer.setPlane(homeButtonEntity);
    MeshCollider.setPlane(homeButtonEntity);
    Transform.create(homeButtonEntity, {
        position:Vector3.create(-0.46,0.53,-0.001),
        scale:Vector3.create(0.08,0.07,1),
        parent:wrapper,
    });
    Material.setPbrMaterial(homeButtonEntity, {albedoColor:Color4.create(1,0,0,0)});

    const backButtonEntity = engine.addEntity();
    MeshRenderer.setPlane(backButtonEntity);
    MeshCollider.setPlane(backButtonEntity);
    Transform.create(backButtonEntity, {
        position:Vector3.create(-0.39,0.53,-0.001),
        scale:Vector3.create(0.055,0.07,1),
        parent:wrapper,
    });
    Material.setPbrMaterial(backButtonEntity, {albedoColor:Color4.create(0,1,0,0)});

    const forwardButtonEntity = engine.addEntity();
    MeshRenderer.setPlane(forwardButtonEntity);
    MeshCollider.setPlane(forwardButtonEntity);
    Transform.create(forwardButtonEntity, {
        position:Vector3.create(-0.33,0.53,-0.001),
        scale:Vector3.create(0.06,0.07,1),
        parent:wrapper,
    });
    Material.setPbrMaterial(forwardButtonEntity, {albedoColor:Color4.create(0,0,1,0)});

    pointerEventsSystem.onPointerDown(getPointerData(homeButtonEntity, `Go home URL ${homeURL}`), ()=>callbacks.onHome && callbacks.onHome());
    pointerEventsSystem.onPointerDown(getPointerData(backButtonEntity, "Go back"), ()=>callbacks.onBack && callbacks.onBack());
    pointerEventsSystem.onPointerDown(getPointerData(forwardButtonEntity, "Go forward"), ()=>callbacks.onForward && callbacks.onForward());

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