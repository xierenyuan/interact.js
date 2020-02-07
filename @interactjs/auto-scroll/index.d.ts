declare module '@interactjs-fork/core/scope' {
    interface Scope {
        autoScroll: typeof autoScroll;
    }
}
declare module '@interactjs-fork/core/Interaction' {
    interface Interaction {
        autoScroll?: typeof autoScroll;
    }
}
declare module '@interactjs-fork/core/defaultOptions' {
    interface PerActionDefaults {
        autoScroll?: AutoScrollOptions;
    }
}
export interface AutoScrollOptions {
    container?: Window | HTMLElement;
    margin?: number;
    distance?: number;
    interval?: number;
    speed?: number;
    enabled?: boolean;
}
declare const autoScroll: {
    defaults: AutoScrollOptions;
    now: () => number;
    interaction: import("@interactjs-fork/core/Interaction").Interaction<any>;
    i: number;
    x: number;
    y: number;
    isScrolling: boolean;
    prevTime: number;
    margin: number;
    speed: number;
    start(interaction: import("@interactjs-fork/core/Interaction").Interaction<any>): void;
    stop(): void;
    scroll(): void;
    check(interactable: import("@interactjs-fork/core/Interactable").Interactable, actionName: import("@interactjs-fork/core/scope").ActionName): boolean;
    onInteractionMove<T extends import("@interactjs-fork/core/scope").ActionName>({ interaction, pointer }: {
        interaction: import("@interactjs-fork/core/Interaction").Interaction<T>;
        pointer: import("@interactjs-fork/types/types").PointerType;
    }): void;
};
export declare function getContainer(value: any, interactable: Interact.Interactable, element: Interact.Element): any;
export declare function getScroll(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSize(container: any): {
    x: any;
    y: any;
};
export declare function getScrollSizeDelta<T extends Interact.ActionName>({ interaction, element }: {
    interaction: Partial<Interact.Interaction<T>>;
    element: Interact.Element;
}, func: any): {
    x: number;
    y: number;
};
declare const autoScrollPlugin: Interact.Plugin;
export default autoScrollPlugin;
