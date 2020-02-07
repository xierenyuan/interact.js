import interact from '@interactjs-fork/interact/index';
import * as modifiers from '@interactjs-fork/modifiers/index';
import '@interactjs-fork/types/index';
import * as snappers from '@interactjs-fork/utils/snappers/index';
declare module '@interactjs-fork/interact/interact' {
    interface InteractStatic {
        modifiers: typeof modifiers;
        snappers: typeof snappers;
        createSnapGrid: typeof snappers.grid;
    }
}
export declare function init(win: Window): import("@interactjs-fork/interact/interact").InteractStatic;
export default interact;
