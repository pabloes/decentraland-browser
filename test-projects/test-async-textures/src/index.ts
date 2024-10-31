// We define the empty imports so the auto-complete feature works as expected.
import {Color4, Vector3} from '@dcl/sdk/math'
import {engine, pointerEventsSystem, InputAction, MeshRenderer, Transform, Material, MeshCollider} from '@dcl/sdk/ecs'
import {Callback} from "@dcl-sdk/utils/dist/timer";
import * as utils from '@dcl-sdk/utils'

const dclSleep = (ms: number) => new Promise((resolve) => utils.timers.setTimeout(resolve as Callback, ms));

export function main() {
  const entity = engine.addEntity();

  MeshRenderer.setPlane(entity);
  Transform.create(entity, {
    position:Vector3.create(8,1,8)
  })

    MeshCollider.setPlane(entity);
    Material.setBasicMaterial(entity, {diffuseColor:Color4.create(1,1,0,1)})
  pointerEventsSystem.onPointerDown(
      {
        entity,
        opts: { button: InputAction.IA_POINTER, hoverText: "CLick to load and apply textures" },
      },
      ()=>{
          (async()=>{
              await dclSleep(500);

              console.log("loading and applying texture 1");
              const texture1 = Material.Texture.Common({
                  src: `https://dcl-browser.zeroxwork.com/api/red`,
              });
              Material.setPbrMaterial(entity, { texture:texture1 });

              await dclSleep(500);

              console.log("loading and applying texture 2");
              const texture2 = Material.Texture.Common({
                  src: `https://dcl-browser.zeroxwork.com/api/blue`,
              });

              Material.setPbrMaterial(entity, { texture:texture2 });
          })();
      });

}






