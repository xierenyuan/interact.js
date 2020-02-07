import { ActionName } from '@interactjs-fork/core/scope';
declare module '@interactjs-fork/core/Interactable' {
    interface Interactable {
        draggable: DraggableMethod;
    }
}
declare module '@interactjs-fork/core/defaultOptions' {
    interface ActionDefaults {
        drag: Interact.DraggableOptions;
    }
}
declare module '@interactjs-fork/core/scope' {
    interface Actions {
        [ActionName.Drag]?: typeof drag;
    }
    enum ActionName {
        Drag = "drag"
    }
}
export declare type DragEvent = Interact.InteractEvent<ActionName.Drag>;
export declare type DraggableMethod = Interact.ActionMethod<Interact.DraggableOptions>;
declare const drag: Interact.Plugin;
export default drag;
