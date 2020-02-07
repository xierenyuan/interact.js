import test from '@interactjs-fork/_dev/test/test'
import * as helpers from '@interactjs-fork/core/tests/_helpers'
import snapSize from '../snap/size'

test('modifiers/snapSize', t => {
  const { interaction, interactable } = helpers.testEnv()
  interaction.interactable = interactable
  interactable.getRect = () => ({ top: 0, left: 0, bottom: 100, right: 100 } as any)
  interaction._interacting = true

  const target0 = Object.freeze({ x:  50, y:  100 })
  const options = {
    targets: [
      { ...target0 },
    ],
    range: Infinity,
  }
  const state = {
    options,
    delta: { x: 0, y: 0 },
    offset: [{ x: 0, y: 0 }],
  }
  const pageCoords = Object.freeze({ x: 10, y: 20 })
  const arg = {
    interaction,
    interactable: interaction.interactable,
    edges: { top: true, left: true },
    state,
    pageCoords,
    coords: { ...pageCoords },
  }

  snapSize.start(arg as any)
  snapSize.set(arg)

  t.deepEqual(
    arg.coords,
    target0,
    'snapSize.set single target, zereo offset',
  )

  t.end()
})
