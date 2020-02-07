import test from '@interactjs-fork/_dev/test/test'
import drag from '@interactjs-fork/actions/drag'
import drop from '@interactjs-fork/actions/drop'
import autoStart from '@interactjs-fork/auto-start/base'
import * as pointerUtils from '@interactjs-fork/utils/pointerUtils'
import InteractEvent from './InteractEvent'
import Interaction from './Interaction'
import * as helpers from './tests/_helpers'

test('Interaction constructor', t => {
  const testType = 'test'
  const dummyScopeFire = () => {}
  const interaction = new Interaction({
    pointerType: testType,
    scopeFire: dummyScopeFire,
  })
  const zeroCoords = {
    page     : { x: 0, y: 0 },
    client   : { x: 0, y: 0 },
    timeStamp: 0,
  }

  t.equal(interaction._scopeFire, dummyScopeFire,
    'scopeFire option is set assigned to interaction._scopeFire')

  t.ok(interaction.prepared instanceof Object,
    'interaction.prepared is an object')
  t.ok(interaction.downPointer instanceof Object,
    'interaction.downPointer is an object')

  for (const coordField in interaction.coords) {
    t.deepEqual(interaction.coords[coordField as keyof typeof interaction.coords], zeroCoords,
      `interaction.coords.${coordField} set to zero`)
  }

  t.equal(interaction.pointerType, testType,
    'interaction.pointerType is set')

  // pointerInfo properties
  t.deepEqual(
    interaction.pointers,
    [],
    'interaction.pointers is initially an empty array')

  // false properties
  for (const prop of ['pointerIsDown', 'pointerWasMoved', '_interacting'] as const) {
    t.false(interaction[prop], `interaction.${prop} is false`)
  }

  t.notEqual(interaction.pointerType, 'mouse')

  t.end()
})

test('Interaction destroy', t => {
  const { interaction } = helpers.testEnv()
  const pointer = { pointerId: 10 } as any
  const event = {} as any

  interaction.updatePointer(pointer, event, null)

  interaction.destroy()

  t.strictEqual(interaction._latestPointer.pointer, null,
    'interaction._latestPointer.pointer is null')

  t.strictEqual(interaction._latestPointer.event, null,
    'interaction._latestPointer.event is null')

  t.strictEqual(interaction._latestPointer.eventTarget, null,
    'interaction._latestPointer.eventTarget is null')

  t.end()
})

test('Interaction.getPointerIndex', t => {
  const { interaction } = helpers.testEnv()

  interaction.pointers = [2, 4, 5, 0, -1].map(id => ({ id })) as any

  interaction.pointers.forEach(({ id }, index) => {
    t.equal(interaction.getPointerIndex({ pointerId: id }), index)
  })

  t.end()
})

test('Interaction.updatePointer', t => {
  t.test('no existing pointers', st => {
    const { interaction } = helpers.testEnv()
    const pointer = { pointerId: 10 } as any
    const event = {} as any

    const ret = interaction.updatePointer(pointer, event, null)

    st.deepEqual(
      interaction.pointers,
      [{
        id: pointer.pointerId,
        pointer,
        event,
        downTime: null,
        downTarget: null,
      }],
      'interaction.pointers == [{ pointer, ... }]')
    st.equal(ret, 0, 'new pointer index is returned')

    st.end()
  })

  t.test('new pointer with exisiting pointer', st => {
    const { interaction } = helpers.testEnv()
    const existing: any = { pointerId: 0 }
    const event: any = {}

    interaction.updatePointer(existing, event, null)

    const newPointer: any = { pointerId: 10 }
    const ret = interaction.updatePointer(newPointer, event, null)

    st.deepEqual(
      interaction.pointers, [
        {
          id: existing.pointerId,
          pointer: existing,
          event,
          downTime: null,
          downTarget: null,
        },
        {
          id: newPointer.pointerId,
          pointer: newPointer,
          event,
          downTime: null,
          downTarget: null,
        },
      ],
      'interaction.pointers == [{ pointer: existing, ... }, { pointer: newPointer, ... }]')

    st.equal(ret, 1, 'second pointer index is 1')

    st.end()
  })

  t.test('update existing pointers', st => {
    const { interaction } = helpers.testEnv()

    const oldPointers = [-3, 10, 2].map(pointerId => ({ pointerId }))
    const newPointers = oldPointers.map(pointer => ({ ...pointer, new: true }))

    oldPointers.forEach((pointer: any) => interaction.updatePointer(pointer, pointer, null))
    newPointers.forEach((pointer: any) => interaction.updatePointer(pointer, pointer, null))

    st.equal(interaction.pointers.length, oldPointers.length,
      'number of pointers is unchanged')

    interaction.pointers.forEach((pointerInfo, i) => {
      st.equal(pointerInfo.id, oldPointers[i].pointerId,
        `pointer[${i}].id is the same`)
      st.notEqual(pointerInfo.pointer, oldPointers[i],
        `new pointer ${i} !== old pointer object`)
    })

    st.end()
  })

  t.end()
})

test('Interaction.removePointer', t => {
  const { interaction } = helpers.testEnv()
  const ids = [0, 1, 2, 3]
  const removals = [
    { id: 0, remain: [1, 2, 3], message: 'first of 4' },
    { id: 2, remain: [1,    3], message: 'middle of 3' },
    { id: 3, remain: [1      ], message: 'last of 2' },
    { id: 1, remain: [       ], message: 'final' },
  ]

  ids.forEach(pointerId => interaction.updatePointer({ pointerId } as any, {} as any, null))

  for (const removal of removals) {
    interaction.removePointer({ pointerId: removal.id } as Interact.PointerType, null)

    t.deepEqual(
      interaction.pointers.map(p => p.id),
      removal.remain,
      `${removal.message} - remaining interaction.pointers is correct`)
  }

  t.end()
})

test('Interaction.pointer{Down,Move,Up} updatePointer', t => {
  const { scope, interaction } = helpers.testEnv()
  const eventTarget: any = {}
  const pointer: any = {
    target: eventTarget,
    pointerId: 0,
  }
  let info: any = {}

  scope.addListeners({
    'interactions:update-pointer': arg => { info.updated = arg.pointerInfo },
    'interactions:remove-pointer': arg => { info.removed = arg.pointerInfo },
  })

  interaction.coords.cur.timeStamp = 0
  const commonPointerInfo: any = {
    id: 0,
    pointer,
    event: pointer,
    downTime: null,
    downTarget: null,
  }

  interaction.pointerDown(pointer, pointer, eventTarget)
  t.deepEqual(
    info.updated,
    {
      ...commonPointerInfo,
      downTime: interaction.coords.cur.timeStamp,
      downTarget: eventTarget,
    },
    'interaction.pointerDown updates pointer',
  )
  t.equal(info.removed, undefined, 'interaction.pointerDown doesn\'t remove pointer')
  interaction.removePointer(pointer, null)
  info = {}

  interaction.pointerMove(pointer, pointer, eventTarget)
  t.deepEqual(
    info.updated,
    commonPointerInfo,
    'interaction.pointerMove updates pointer',
  )
  t.equal(info.removed, undefined, 'interaction.pointerMove doesn\'t remove pointer')
  info = {}

  interaction.pointerUp(pointer, pointer, eventTarget, null)
  t.equal(info.updated, undefined, 'interaction.pointerUp doesn\'t update existing pointer')
  info = {}

  interaction.pointerUp(pointer, pointer, eventTarget, null)
  t.deepEqual(
    info.updated,
    commonPointerInfo,
    'interaction.pointerUp updates non existing pointer',
  )
  t.deepEqual(info.removed, commonPointerInfo, 'interaction.pointerUp also removes pointer')
  info = {}

  t.end()
})

test('Interaction.pointerDown', t => {
  const { interaction, scope } = helpers.testEnv()
  const coords = helpers.newCoordsSet()
  const eventTarget = {} as Interact.Element
  const event: any = {
    type: 'down',
    target: eventTarget,
  }
  const pointer: any = helpers.newPointer()
  let signalArg: any

  const signalListener = (arg: any) => {
    signalArg = arg
  }

  scope.addListeners({
    'interactions:down': signalListener,
  })

  const pointerCoords: any = { page: {}, client: {} }
  pointerUtils.setCoords(pointerCoords, [pointer], event.timeStamp)

  for (const prop in coords) {
    pointerUtils.copyCoords(interaction.coords[prop as keyof typeof coords], coords[prop as keyof typeof coords])
  }

  // test while interacting
  interaction._interacting = true
  interaction.pointerDown(pointer, event, eventTarget)

  t.equal(interaction.downEvent, null, 'downEvent is not updated')
  t.deepEqual(
    interaction.pointers,
    [{
      id: pointer.pointerId,
      pointer,
      event,
      downTime: null,
      downTarget: null,
    }],
    'pointer is added',
  )

  t.deepEqual(interaction.downPointer, {} as any, 'downPointer is not updated')

  t.deepEqual(interaction.coords.start, coords.start, 'coords.start are not modified')
  t.deepEqual(interaction.coords.cur,   coords.cur,   'coords.cur   are not modified')
  t.deepEqual(interaction.coords.prev,  coords.prev,  'coords.prev  are not modified')

  t.ok(interaction.pointerIsDown, 'pointerIsDown')
  t.notOk(interaction.pointerWasMoved, '!pointerWasMoved')

  t.equal(signalArg.pointer,      pointer,     'pointer      in down signal arg')
  t.equal(signalArg.event,        event,       'event        in down signal arg')
  t.equal(signalArg.eventTarget,  eventTarget, 'eventTarget  in down signal arg')
  t.equal(signalArg.pointerIndex, 0,           'pointerIndex in down signal arg')

  // test while not interacting
  interaction._interacting = false
  // reset pointerIsDown
  interaction.pointerIsDown = false
  // pretend pointer was moved
  interaction.pointerWasMoved = true
  // reset signalArg object
  signalArg = undefined

  interaction.removePointer(pointer, null)
  interaction.pointerDown(pointer, event, eventTarget)

  // timeStamp is assigned with new Date.getTime()
  // don't let it cause deepEaual to fail
  pointerCoords.timeStamp = interaction.coords.start.timeStamp

  t.equal(interaction.downEvent, event, 'downEvent is updated')

  t.deepEqual(
    interaction.pointers,
    [{
      id: pointer.pointerId,
      pointer,
      event,
      downTime: pointerCoords.timeStamp,
      downTarget: eventTarget,
    }],
    'interaction.pointers is updated')

  t.deepEqual(interaction.coords.start, pointerCoords, 'coords.start are set to pointer')
  t.deepEqual(interaction.coords.cur,   pointerCoords, 'coords.cur   are set to pointer')
  t.deepEqual(interaction.coords.prev,  pointerCoords, 'coords.prev  are set to pointer')

  t.equal(typeof signalArg, 'object', 'down signal was fired again')
  t.ok(interaction.pointerIsDown, 'pointerIsDown')
  t.notOk(interaction.pointerWasMoved, 'pointerWasMoved should always change to false')

  t.end()
})

test('Interaction.start', t => {
  const {
    interaction,
    interactable,
    scope,
    event,
    target: element,
    down,
    stop,
  } = helpers.testEnv({ plugins: [drag] })
  const action = { name: 'drag' }

  interaction.start(action, interactable, element)
  t.equal(interaction.prepared.name, null, 'do nothing if !pointerIsDown')

  // pointers is still empty
  interaction.pointerIsDown = true
  interaction.start(action, interactable, element)
  t.equal(interaction.prepared.name, null, 'do nothing if too few pointers are down')

  down()

  interaction._interacting = true
  interaction.start(action, interactable, element)
  t.equal(interaction.prepared.name, null, 'do nothing if already interacting')

  interaction._interacting = false

  interactable.options[action.name] = { enabled: false }
  interaction.start(action, interactable, element)
  t.equal(interaction.prepared.name, null, 'do nothing if action is not enabled')
  interactable.options[action.name] = { enabled: true }

  let signalArg: any

  // let interactingInStartListener
  const signalListener = (arg: any) => {
    signalArg = arg
    // interactingInStartListener = arg.interaction.interacting()
  }

  scope.addListeners({
    'interactions:action-start': signalListener,
  })
  interaction.start(action, interactable, element)

  t.equal(interaction.prepared.name, action.name, 'action is prepared')
  t.equal(interaction.interactable, interactable, 'interaction.interactable is updated')
  t.equal(interaction.element, element, 'interaction.element is updated')

  // t.assert(interactingInStartListener, 'interaction is interacting during action-start signal')
  t.assert(interaction.interacting(), 'interaction is interacting after start method')
  t.equal(signalArg.interaction, interaction, 'interaction in signal arg')
  t.equal(signalArg.event, event, 'event (interaction.downEvent) in signal arg')

  stop()

  t.end()
})

test('interaction move() and stop() from start event', t => {
  const {
    interaction,
    interactable,
    target,
    down,
  } = helpers.testEnv({ plugins: [drag, drop, autoStart] })

  let stoppedBeforeStartFired

  interactable.draggable({
    listeners: {
      start (event) {
        stoppedBeforeStartFired = interaction._stopped

        t.doesNotThrow(
          () => event.interaction.move(),
          "interaction.move() doesn't throw from start event",
        )

        t.doesNotThrow(
          () => event.interaction.stop(),
          "interaction.stop() doesn't throw from start event",
        )
      },
    },
  })

  down()
  interaction.start({ name: 'drag' }, interactable, target as HTMLElement)

  t.equal(stoppedBeforeStartFired, false, '!interaction._stopped in start listener')
  t.notOk(interaction.interacting(), 'interaction can be stopped from start event listener')
  t.ok(interaction._stopped, 'interaction._stopped after stop() in start listener')

  t.end()
})

test('Interaction createPreparedEvent', t => {
  const { interaction, interactable, target } = helpers.testEnv()

  const action = { name: 'resize' }
  const phase = 'TEST_PHASE' as Interact.EventPhase

  interaction.prepared = action
  interaction.interactable = interactable
  interaction.element = target
  interaction.prevEvent = { page: {}, client: {}, velocity: {} } as any

  const iEvent = interaction._createPreparedEvent({} as any, phase)

  t.ok(iEvent instanceof InteractEvent,
    'InteractEvent is fired')

  t.equal(iEvent.type, action.name + phase,
    'event type')

  t.equal(iEvent.interactable, interactable,
    'event.interactable')

  t.equal(iEvent.target, interactable.target,
    'event.target')

  t.end()
})

test('Interaction fireEvent', t => {
  const { interaction, interactable } = helpers.testEnv()
  const iEvent = {} as Interact.InteractEvent
  let firedEvent

  // this method should be called from actions.firePrepared
  interactable.fire = event => {
    firedEvent = event
    return interactable
  }

  interaction.interactable = interactable
  interaction._fireEvent(iEvent)

  t.equal(firedEvent, iEvent,
    'target interactable\'s fire method is called')

  t.equal(interaction.prevEvent, iEvent,
    'interaction.prevEvent is updated')

  t.end()
})
