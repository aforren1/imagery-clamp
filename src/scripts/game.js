import '@babel/polyfill'
import Phaser from './phaser-custom' // slightly more nuanced custom build

import log from './utils/logger'
import 'devtools-detect'
import UAParser from 'ua-parser-js'

import RoundRectanglePlugin from 'phaser3-rex-plugins/plugins/roundrectangle-plugin.js'
import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js'
import TitleScene from './scenes/titleScene'
import InstructScene from './scenes/instructScene'
import MainScene from './scenes/mainScene'
import EndScene from './scenes/endScene'
//import scheds from '../scheds/sched.json'

// let small_dim = Math.min(screen.width, screen.height)
let small_dim = 800 // nothing's going to be perfectly scaled, but that's fine?
const phaser_config = {
  type: Phaser.AUTO,
  backgroundColor: '#222222',
  scale: {
    parent: 'phaser-game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: small_dim,
    height: small_dim,
  },
  scene: [TitleScene, InstructScene, MainScene, EndScene],
  plugins: {
    global: [
      {
        key: 'rexRoundRectanglePlugin',
        plugin: RoundRectanglePlugin,
        start: true,
      },
      {
        key: 'rexBBCodeTextPlugin',
        plugin: BBCodeTextPlugin,
        start: true,
      },
    ],
  },
}

window.addEventListener('load', () => {
  const game = new Phaser.Game(phaser_config)
  log.info('Phaser loaded.')
  // TODO: figure out prolific/mturk/elsewhere here (URL parsing)
  // Remember that localStorage *only stores strings*
  const url_params = new URL(window.location.href).searchParams
  // add flag to clear localStorage
  if (url_params.get('clear') !== null) {
    localStorage.clear()
  }
  // If coming from prolific, use that ID. Otherwise, generate some random chars
  let id = localStorage['id']
  if (typeof id === 'undefined') {
    const randomString = (length) => [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join('')
    id = url_params.get('PROLIFIC_PID') || url_params.get('id') || randomString(10)
    localStorage['id'] = id
    // TODO: assert prolific ID matches one in localStorage
  }

  let group = localStorage['group']
  if (typeof group === 'undefined') {
    // assign group (either in URL or randomly) 1-N
    // note we lop of the -1, because the last element is the test one
    let group_count = Object.keys(scheds).length - 1
    group = (url_params.get('group') || Math.floor(Math.random() * group_count) + 1).toString()
    localStorage['group'] = group
  }

  let user_config = {
    id: id,
    // if not on prolific, might be all null
    prolific_config: {
      prolific_pid: url_params.get('PROLIFIC_PID'),
      study_id: url_params.get('STUDY_ID'),
      session_id: url_params.get('SESSION_ID'),
    },
    width: game.config.width,
    height: game.config.height,
    renderer: game.config.renderType === Phaser.CANVAS ? 'canvas' : 'webgl',
    user_agent: new UAParser().getResult(),
    fullscreen_supported: document.fullscreenEnabled, // this is pretty important for us?
    group: group,
    debug: url_params.get('debug') !== null, // if debug !== null, use flashing square
  }
  game.user_config = user_config // patch in to pass into game
  // set up for user
  log.info('Exiting initialization.')
})

// once the data is successfully sent, null this out
// need to log this too
export function onBeforeUnload(event) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
  event.preventDefault()
  log.warn('Early termination impending?')
  event.returnValue = ''
  return 'experiment not done yet.'
}
// TODO: add back after iterating
//window.addEventListener('beforeunload', onBeforeUnload)

// if prematurely ended, shuffle logs away?
// we'll at least store a local time to get an idea if they're
// refreshing
window.addEventListener('unload', (event) => {})

// breaks on IE, so dump if that's really a big deal
// Might be able to polyfill our way out, too?
window.addEventListener('devtoolschange', (event) => {
  log.warn(`Devtools opened: ${event.detail.isOpen} at time ${window.performance.now()}`)
})
