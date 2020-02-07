import Interactable from '@interactjs-fork/core/Interactable'
import { EventPhase } from '@interactjs-fork/core/InteractEvent'
import { ActionProps, Interaction } from '@interactjs-fork/core/Interaction'
import { Scope } from '@interactjs-fork/core/scope'
import { arr, extend, is, pointer as pointerUtils, rect as rectUtils, win } from '@interactjs-fork/utils/index'

declare module '@interactjs-fork/core/Interactable' {
  interface Interactable {
    reflow: (action: ActionProps) => ReturnType<typeof reflow>
  }
}

declare module '@interactjs-fork/core/Interaction' {
  interface Interaction {
    _reflowPromise: Promise<void>
    _reflowResolve: () => void
  }
}

declare module '@interactjs-fork/core/InteractEvent' {
  // eslint-disable-next-line no-shadow
  enum EventPhase {
    Reflow = 'reflow',
  }
}

(EventPhase as any).Reflow = 'reflow'

export function install (scope: Scope) {
  const {
    actions,
    /** @lends Interactable */
    // eslint-disable-next-line no-shadow
    Interactable,
  } = scope

  // add action reflow event types
  for (const actionName of actions.names) {
    actions.eventTypes.push(`${actionName}reflow`)
  }

  /**
   * ```js
   * const interactable = interact(target)
   * const drag = { name: drag, axis: 'x' }
   * const resize = { name: resize, edges: { left: true, bottom: true }
   *
   * interactable.reflow(drag)
   * interactable.reflow(resize)
   * ```
   *
   * Start an action sequence to re-apply modifiers, check drops, etc.
   *
   * @param { Object } action The action to begin
   * @param { string } action.name The name of the action
   * @returns { Promise } A promise that resolves to the `Interactable` when actions on all targets have ended
   */
  Interactable.prototype.reflow = function (action) {
    return reflow(this, action, scope)
  }
}

function reflow (interactable: Interactable, action: ActionProps, scope: Scope): Promise<Interactable> {
  const elements = (is.string(interactable.target)
    ? arr.from(interactable._context.querySelectorAll(interactable.target))
    : [interactable.target]) as Interact.Element[]

  // tslint:disable-next-line variable-name
  const Promise = (win.window as any).Promise
  const promises: Array<Promise<null>> | null = Promise ? [] : null

  for (const element of elements) {
    const rect = interactable.getRect(element as HTMLElement | SVGElement)

    if (!rect) { break }

    const runningInteraction = arr.find(
      scope.interactions.list,
      (interaction: Interaction) => {
        return interaction.interacting() &&
          interaction.interactable === interactable &&
          interaction.element === element &&
          interaction.prepared.name === action.name
      })
    let reflowPromise: Promise<null>

    if (runningInteraction) {
      runningInteraction.move()

      if (promises) {
        reflowPromise = runningInteraction._reflowPromise || new Promise((resolve: any) => {
          runningInteraction._reflowResolve = resolve
        })
      }
    }
    else {
      const xywh = rectUtils.tlbrToXywh(rect)
      const coords = {
        page     : { x: xywh.x, y: xywh.y },
        client   : { x: xywh.x, y: xywh.y },
        timeStamp: scope.now(),
      }

      const event = pointerUtils.coordsToEvent(coords)
      reflowPromise = startReflow(scope, interactable, element, action, event)
    }

    if (promises) {
      promises.push(reflowPromise)
    }
  }

  return promises && Promise.all(promises).then(() => interactable)
}

function startReflow (scope: Scope, interactable: Interactable, element: Interact.Element, action: ActionProps, event: any) {
  const interaction = scope.interactions.new({ pointerType: 'reflow' })
  const signalArg = {
    interaction,
    event,
    pointer: event,
    eventTarget: element,
    phase: EventPhase.Reflow,
  }

  interaction.interactable = interactable
  interaction.element = element
  interaction.prepared = extend({}, action)
  interaction.prevEvent = event
  interaction.updatePointer(event, event, element, true)

  interaction._doPhase(signalArg)

  const reflowPromise = (win.window as unknown as any).Promise
    ? new (win.window as unknown as any).Promise((resolve: any) => {
      interaction._reflowResolve = resolve
    })
    : null

  interaction._reflowPromise = reflowPromise
  interaction.start(action, interactable, element)

  if (interaction._interacting) {
    interaction.move(signalArg)
    interaction.end(event)
  }
  else {
    interaction.stop()
  }

  interaction.removePointer(event, event)
  interaction.pointerIsDown = false

  return reflowPromise
}

export default {
  id: 'reflow',
  install,
  listeners: {
    // remove completed reflow interactions
    'interactions:stop': ({ interaction }, scope) => {
      if (interaction.pointerType === EventPhase.Reflow) {
        if (interaction._reflowResolve) {
          interaction._reflowResolve()
        }

        arr.remove(scope.interactions.list, interaction)
      }
    },
  },
} as Interact.Plugin
