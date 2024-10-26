import { Entity } from "@dcl/sdk/ecs";
import { VirtualBrowserClientConfigParams } from "./virtual-browser-client-types";
export declare const createLoadingOverlay: ({ parent, config }: {
    parent: Entity;
    config: VirtualBrowserClientConfigParams;
}) => {
    enable: ({ showSpinner, text }?: {
        showSpinner?: boolean;
        text?: string;
    }) => void;
    disable: () => void;
};
