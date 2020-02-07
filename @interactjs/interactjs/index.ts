import interact, { init as initInteract } from '@interactjs-fork/interact/index'
import * as modifiers from '@interactjs-fork/modifiers/index'
import '@interactjs-fork/types/index'
import extend from '@interactjs-fork/utils/extend'
import * as snappers from '@interactjs-fork/utils/snappers/index'

declare module '@interactjs-fork/interact/interact' {
  interface InteractStatic {
    modifiers: typeof modifiers
    snappers: typeof snappers
    createSnapGrid: typeof snappers.grid
  }
}

if (typeof window === 'object' && !!window) {
  init(window)
}

export function init (win: Window) {
  initInteract(win)

  return interact.use({
    id: 'interactjs-fork',
    install () {
      interact.modifiers = extend({}, modifiers)
      interact.snappers = snappers
      interact.createSnapGrid = interact.snappers.grid
    },
  })
}

export default interact
