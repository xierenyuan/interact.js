declare module '@interactjs-fork/core/Interactable' {
    interface Interactable {
        pointerEvents: typeof pointerEventsMethod;
        __backCompatOption: (optionName: string, newValue: any) => any;
    }
}
declare function pointerEventsMethod(this: Interact.Interactable, options: any): import("@interactjs-fork/core/Interactable").Interactable;
declare const plugin: Interact.Plugin;
export default plugin;
