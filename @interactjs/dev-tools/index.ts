/* eslint-disable no-console */
/* global process */
import domObjects from '@interactjs-fork/utils/domObjects'
import { parentNode } from '@interactjs-fork/utils/domUtils'
import extend from '@interactjs-fork/utils/extend'
import * as is from '@interactjs-fork/utils/is'
import win from '@interactjs-fork/utils/window'

declare module '@interactjs-fork/core/scope' {
  interface Scope {
    logger: Logger
  }
}

declare module '@interactjs-fork/core/defaultOptions' {
  interface BaseDefaults {
    devTools?: DevToolsOptions
  }
}

declare module '@interactjs-fork/core/Interactable' {
  interface Interactable {
    devTools?: Interact.OptionMethod<DevToolsOptions>
  }
}

export interface DevToolsOptions {
  ignore: { [P in keyof typeof CheckName]?: boolean }
}

export interface Logger {
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  log: (...args: any[]) => void
}

export interface Check {
  name: CheckName
  text: string
  perform: (interaction: Interact.Interaction) => boolean
  getInfo: (interaction: Interact.Interaction) => any[]
}

enum CheckName {
  touchAction = 'touchAction',
  boxSizing = 'boxSizing',
  noListeners = 'noListeners',
}

const prefix  = '[interact.js] '
const links = {
  touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
  boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing',
}

const isProduction = process.env.NODE_ENV === 'production'

// eslint-disable-next-line no-restricted-syntax
function install (scope: Interact.Scope, { logger }: { logger?: Logger } = {}) {
  const {
    Interactable,
    defaults,
  } = scope

  scope.logger = logger || console

  defaults.base.devTools = {
    ignore: {},
  }

  Interactable.prototype.devTools = function (options?: object) {
    if (options) {
      extend(this.options.devTools, options)
      return this
    }

    return this.options.devTools
  }
}

const checks: Check[] = [
  {
    name: CheckName.touchAction,
    perform ({ element }) {
      return !parentHasStyle(element, 'touchAction', /pan-|pinch|none/)
    },
    getInfo ({ element }) {
      return [
        element,
        links.touchAction,
      ]
    },
    text: 'Consider adding CSS "touch-action: none" to this element\n',
  },

  {
    name: CheckName.boxSizing,
    perform (interaction) {
      const { element } = interaction

      return interaction.prepared.name === 'resize' &&
        element instanceof domObjects.HTMLElement &&
        !hasStyle(element, 'boxSizing', /border-box/)
    },
    text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
    getInfo ({ element }) {
      return [
        element,
        links.boxSizing,
      ]
    },
  },

  {
    name: CheckName.noListeners,
    perform (interaction) {
      const actionName = interaction.prepared.name
      const moveListeners = interaction.interactable.events.types[`${actionName}move`] || []

      return !moveListeners.length
    },
    getInfo (interaction) {
      return [
        interaction.prepared.name,
        interaction.interactable,
      ]
    },
    text: 'There are no listeners set for this action',
  },
]

function hasStyle (element: HTMLElement, prop: keyof CSSStyleDeclaration, styleRe: RegExp) {
  return styleRe.test(element.style[prop] || win.window.getComputedStyle(element)[prop])
}

function parentHasStyle (element: Interact.Element, prop: keyof CSSStyleDeclaration, styleRe: RegExp) {
  let parent = element as HTMLElement

  while (is.element(parent)) {
    if (hasStyle(parent, prop, styleRe)) {
      return true
    }

    parent = parentNode(parent) as HTMLElement
  }

  return false
}

const id = 'dev-tools'
const defaultExport: Interact.Plugin = isProduction
  ? { id, install: () => {} }
  : {
    id,
    install,
    listeners: {
      'interactions:action-start': ({ interaction }, scope) => {
        for (const check of checks) {
          const options = interaction.interactable && interaction.interactable.options

          if (
            !(options && options.devTools && options.devTools.ignore[check.name]) &&
            check.perform(interaction)
          ) {
            scope.logger.warn(prefix + check.text, ...check.getInfo(interaction))
          }
        }
      },
    },
    checks,
    CheckName,
    links,
    prefix,
  }

export default defaultExport
