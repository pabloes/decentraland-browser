
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