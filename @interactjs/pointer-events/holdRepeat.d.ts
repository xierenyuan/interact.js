declare module '@interactjs-fork/core/Interaction' {
    interface Interaction {
        holdIntervalHandle?: any;
    }
}
declare module '@interactjs-fork/pointer-events/PointerEvent' {
    interface PointerEvent<T extends string = any> {
        count?: number;
    }
}
declare module '@interactjs-fork/pointer-events/base' {
    interface PointerEventOptions {
        holdRepeatInterval?: number;
    }
}
declare const holdRepeat: Interact.Plugin;
export default holdRepeat;
