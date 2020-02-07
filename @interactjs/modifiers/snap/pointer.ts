import * as utils from '@interactjs-fork/utils/index'
import { ModifierArg, ModifierState } from '../base'

export interface Offset {
  x: number
  y: number
  index: number
  relativePoint?: Interact.Point
}

export interface SnapPosition {
  x?: number
  y?: number
  range?: number
  offset?: Offset
  [index: string]: any
}

export type SnapFunction = (
  x: number,
  y: number,
  interaction: Interact.Interaction,
  offset: Offset,
  index: number
) => SnapPosition
export type SnapTarget = SnapPosition | SnapFunction
export interface SnapOptions {
  targets: SnapTarget[]
  // target range
  range: number
  // self points for snapping. [0,0] = top left, [1,1] = bottom right
  relativePoints: Interact.Point[]
  // startCoords = offset snapping from drag start page position
  offset: Interact.Point | Interact.RectResolvable<[Interact.Interaction]> | 'startCoords'
  offsetWithOrigin?: boolean
  origin: Interact.RectResolvable<[Interact.Element]> | Interact.Point
  endOnly?: boolean
  enabled?: boolean
}

export type SnapState = ModifierState<SnapOptions, {
  offsets?: Offset[]
  closest?: any
  targetFields?: string[][]
}>

function start (arg: ModifierArg<SnapState>) {
  const { interaction, interactable, element, rect, state, startOffset } = arg
  const { options } = state
  const origin = options.offsetWithOrigin
    ? getOrigin(arg)
    : { x: 0, y: 0 }

  let snapOffset: Interact.Point

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x,
      y: interaction.coords.start.page.y,
    }
  }
  else  {
    const offsetRect = utils.rect.resolveRectLike(options.offset as any, interactable, element, [interaction])

    snapOffset = utils.rect.rectToXY(offsetRect) || { x: 0, y: 0 }
    snapOffset.x += origin.x
    snapOffset.y += origin.y
  }

  const { relativePoints } = options

  state.offsets = rect && relativePoints && relativePoints.length
    ?  relativePoints.map((relativePoint, index) => ({
      index,
      relativePoint,
      x: startOffset.left - (rect.width  * relativePoint.x) + snapOffset.x,
      y: startOffset.top  - (rect.height * relativePoint.y) + snapOffset.y,
    }))
    : [utils.extend({
      index: 0,
      relativePoint: null,
    }, snapOffset)]
}

function set (arg: ModifierArg<SnapState>) {
  const { interaction, coords, state } = arg
  const { options, offsets } = state

  const origin = utils.getOriginXY(interaction.interactable, interaction.element, interaction.prepared.name)
  const page = utils.extend({}, coords)
  const targets = []

  if (!options.offsetWithOrigin) {
    page.x -= origin.x
    page.y -= origin.y
  }

  for (const offset of offsets) {
    const relativeX = page.x - offset.x
    const relativeY = page.y - offset.y

    for (let index = 0, len = options.targets.length; index < len; index++) {
      const snapTarget = options.targets[index]
      let target

      if (utils.is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction, offset, index)
      }
      else {
        target = snapTarget
      }

      if (!target) { continue }

      targets.push({
        x: (utils.is.number(target.x) ? target.x : relativeX) + offset.x,
        y: (utils.is.number(target.y) ? target.y : relativeY) + offset.y,

        range: utils.is.number(target.range) ? target.range : options.range,
        source: snapTarget,
        index,
        offset,
      })
    }
  }

  const closest = {
    target: null,
    inRange: false,
    distance: 0,
    range: 0,
    delta: { x: 0, y: 0 },
  }

  for (const target of targets) {
    const range = target.range
    const dx = target.x - page.x
    const dy = target.y - page.y
    const distance = utils.hypot(dx, dy)
    let inRange = distance <= range

    // Infinite targets count as being out of range
    // compared to non infinite ones that are in range
    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false
    }

    if (!closest.target || (inRange
      // is the closest target in range?
      ? (closest.inRange && range !== Infinity
        // the pointer is relatively deeper in this target
        ? distance / range < closest.distance / closest.range
        // this target has Infinite range and the closest doesn't
        : (range === Infinity && closest.range !== Infinity) ||
          // OR this target is closer that the previous closest
          distance < closest.distance)
      // The other is not in range and the pointer is closer to this target
      : (!closest.inRange && distance < closest.distance))) {
      closest.target = target
      closest.distance = distance
      closest.range = range
      closest.inRange = inRange
      closest.delta.x = dx
      closest.delta.y = dy
    }
  }

  if (closest.inRange) {
    coords.x = closest.target.x
    coords.y = closest.target.y
  }

  state.closest = closest
  return closest
}

function getOrigin (arg: Partial<ModifierArg<SnapState>>) {
  const { element } = arg.interaction
  const optionsOrigin = utils.rect.rectToXY(
    utils.rect.resolveRectLike(arg.state.options.origin as any, null, null, [element]),
  )
  const origin = optionsOrigin || utils.getOriginXY(
    arg.interactable,
    element,
    arg.interaction.prepared.name,
  )

  return origin
}

const defaults: SnapOptions = {
  range  : Infinity,
  targets: null,
  offset: null,
  offsetWithOrigin: true,
  origin: null,
  relativePoints: null,
  endOnly: false,
  enabled: false,
}
const snap = {
  start,
  set,
  defaults,
}

export default snap
