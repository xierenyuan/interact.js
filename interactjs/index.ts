import interact, { init } from '@interactjs-fork/interactjs/index'
export * from '@interactjs-fork/interactjs/index'

if (typeof module === 'object' && !!module) {
  try { module.exports = interact }
  catch {}
}

(interact as any).default = interact // tslint:disable-line no-string-literal
;(interact as any).init = init // tslint:disable-line no-string-literal

export default interact
