import { Entity } from "@dcl/sdk/ecs";
interface ScrollBarConfig {
    parent: Entity;
    onScrollDown?: Function;
    onScrollUp?: Function;
}
export declare const createScrollBar: ({ parent, onScrollDown, onScrollUp }: ScrollBarConfig) => {
    update: ({ topY, fullHeight, viewHeight }: {
        topY: any;
        fullHeight: any;
        viewHeight?: number;
    }) => void;
};
export {};
