import { Entity } from "@dcl/sdk/ecs";
export declare const createLoadingOverlay: ({ parent }: {
    parent: Entity;
}) => {
    enable: ({ showSpinner, text }?: {
        showSpinner?: boolean;
        text?: string;
    }) => void;
    disable: () => void;
};
