import { Entity } from "@dcl/sdk/ecs";
import { Vector3 } from "@dcl/sdk/math";
export declare const createTextBar: ({ maxChars, position, parent, text }: {
    maxChars: number;
    position: Vector3;
    parent: Entity;
    text?: string;
}) => {
    update: (text: string) => void;
};
