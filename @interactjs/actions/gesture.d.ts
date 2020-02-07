import { ActionName } from '@interactjs-fork/core/scope';
export declare type GesturableMethod = Interact.ActionMethod<Interact.GesturableOptions>;
declare module '@interactjs-fork/core/Interaction' {
    interface Interaction {
        gesture?: {
            angle: number;
            distance: number;
            scale: number;
            startAngle: number;
            startDistance: number;
        };
    }
}
declare module '@interactjs-fork/core/Interactable' {
    interface Interactable {
        gesturable: GesturableMethod;
    }
}
declare module '@interactjs-fork/core/defaultOptions' {
    interface ActionDefaults {
        gesture: Interact.GesturableOptions;
    }
}
declare module '@interactjs-fork/core/scope' {
    interface Actions {
        [ActionName.Gesture]?: typeof gesture;
    }
    enum ActionName {
        Gesture = "gesture"
    }
}
export interface GestureEvent extends Interact.InteractEvent<ActionName.Gesture> {
    distance: number;
    angle: number;
    da: number;
    scale: number;
    ds: number;
    box: Interact.Rect;
    touches: Interact.PointerType[];
}
export interface GestureSignalArg extends Interact.DoPhaseArg {
    iEvent: GestureEvent;
    interaction: Interact.Interaction<ActionName.Gesture>;
    event: Interact.PointerEventType | GestureEvent;
}
declare const gesture: Interact.Plugin;
export default gesture;
