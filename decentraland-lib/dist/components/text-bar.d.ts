import { Entity } from "@dcl/sdk/ecs";
import { Vector3 } from "@dcl/sdk/math";
export declare const createTextBar: ({ maxChars, position, parent, text, onChangeURL }: {
    maxChars: number;
    position: Vector3;
    parent: Entity;
    text?: string;
    onChangeURL?: Function;
}) => {
    update: (text: string) => void;
    setIdle: (value: any) => any;
};
