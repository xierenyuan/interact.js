import test from '@interactjs-fork/_dev/test/test'
import * as helpers from './tests/_helpers'

test('scope', t => {
  const {
    scope,
    interactable,
    interaction,
    event,
  } = helpers.testEnv()

  ;(interactable.options as any).test = { enabled: true }

  interaction.pointerDown(event, event, scope.document.body)
  interaction.start({ name: 'test' }, interactable, scope.document.body)

  const started = interaction._interacting

  interactable.unset()

  const stopped = !interaction._interacting

  t.ok(started && stopped, 'interaction is stopped on interactable.unset()')

  const plugin1 = { id: '1', listeners: {} }
  const plugin2 = { id: '2', listeners: {} }
  const plugin3 = { id: '3', listeners: {}, before: ['2'] }
  const plugin4 = { id: '4', listeners: {}, before: ['2', '3'] }

  const initialListeners = scope.listenerMaps.map(l => l.id)

  scope.usePlugin(plugin1)
  scope.usePlugin(plugin2)
  scope.usePlugin(plugin3)
  scope.usePlugin(plugin4)

  t.deepEqual(scope.listenerMaps.map(l => l.id), [...initialListeners, '1', '4', '3', '2'])

  t.end()
})
