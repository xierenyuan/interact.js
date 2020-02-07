import Interactable from '@interactjs-fork/core/Interactable';
import { ActionProps } from '@interactjs-fork/core/Interaction';
import { Scope } from '@interactjs-fork/core/scope';
declare module '@interactjs-fork/core/Interactable' {
    interface Interactable {
        reflow: (action: ActionProps) => ReturnType<typeof reflow>;
    }
}
declare module '@interactjs-fork/core/Interaction' {
    interface Interaction {
        _reflowPromise: Promise<void>;
        _reflowResolve: () => void;
    }
}
declare module '@interactjs-fork/core/InteractEvent' {
    enum EventPhase {
        Reflow = "reflow"
    }
}
export declare function install(scope: Scope): void;
declare function reflow(interactable: Interactable, action: ActionProps, scope: Scope): Promise<Interactable>;
declare const _default: import("@interactjs-fork/core/scope").Plugin;
export default _default;
