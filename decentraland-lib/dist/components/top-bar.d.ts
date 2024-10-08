import { Entity } from "@dcl/sdk/ecs";
interface TopBarConfig {
    parent: Entity;
    homeURL: string;
    onHome?: Function;
    onBack?: Function;
    onForward?: Function;
}
export declare const createTopBar: ({ parent, homeURL, onHome, onBack, onForward }: TopBarConfig) => void;
export {};
