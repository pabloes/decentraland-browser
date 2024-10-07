import {
  engine,
  Entity,
  InputAction,
  Material,
  MeshCollider,
  MeshRenderer,
  pointerEventsSystem,
  TextureFilterMode,
  Transform,
} from "@dcl/sdk/ecs";
import {Color4, Vector3} from "@dcl/sdk/math";

const createScreen = (...position:any[]) => {
  const entity = engine.addEntity();
  MeshRenderer.setPlane(entity);
  Transform.create(entity, {
    scale:Vector3.create(3, 3* 768/1024,1),
    position:Vector3.create(...position)
  })

  return {entity};
}

export function main() {
  const screen1 = createScreen(2, 2, 8);
  const screen2 = createScreen(5.01, 2, 8);
  const texture1 = Material.Texture.Common({
    src: `images/portion.png`,
    filterMode: TextureFilterMode.TFM_POINT,
  });
  const texture2 = Material.Texture.Common({
    src: `images/portions3.png`,
  });
  Material.setPbrMaterial(screen1.entity, {
    texture: texture1,
    emissiveTexture: texture1,
    emissiveIntensity: 0.6,
    emissiveColor: Color4.create(1, 1, 1, 1),
    specularIntensity: 0,
    roughness: 1,
    alphaTest: 1,
    transparencyMode: 1,
  });

  Material.setPbrMaterial(screen2.entity, {
    texture: texture2,
    emissiveTexture: texture2,
    emissiveIntensity: 0.6,
    emissiveColor: Color4.create(1, 1, 1, 1),
    specularIntensity: 0,
    roughness: 1,
    alphaTest: 1,
    transparencyMode: 1,
  });

  const mutablePlane: any = MeshRenderer.getMutable(screen2.entity);
  if (mutablePlane.mesh) mutablePlane.mesh[mutablePlane.mesh.$case].uvs = getUvsFromSprite({
    spriteDefinition: {
      spriteSheetWidth: 1024,
      spriteSheetHeight: 768 * 3,
      x: 0,
      y: 0,
      w: 1024,
      h: 768
    }, back: 1
  });

}

export function getUvsFromSprite({spriteDefinition, back}:any) {
  const {spriteSheetWidth, spriteSheetHeight, x, y, w, h} = spriteDefinition;
  const X1 = x / spriteSheetWidth;
  const X2 = (x / spriteSheetWidth + w / spriteSheetWidth);
  const Y1 = 1 - (y / spriteSheetHeight);
  const Y2 = 1 - (y / spriteSheetHeight + h / spriteSheetHeight);
  const FRONT_UVS = [
    X1, Y2, //A
    X1, Y1, //B
    X2, Y1, //C
    X2, Y2 //D
  ]
  const BACK_UVS = back === 0
      ? [0, 0, 0, 0, 0, 0, 0, 0]
      : back === 1
          ? FRONT_UVS
          : [
            X2, Y2,
            X2, Y1,
            X1, Y1,
            X1, Y2
          ]

  return [
    ...FRONT_UVS,
    ...BACK_UVS
  ];
}
