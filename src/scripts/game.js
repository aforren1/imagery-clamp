import '@babel/polyfill'
import Phaser from './phaser-custom' // slightly more nuanced custom build

import log from './utils/logger'
// import 'devtools-detect'
import UAParser from 'ua-parser-js'

import RoundRectanglePlugin from 'phaser3-rex-plugins/plugins/roundrectangle-plugin.js'
import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js'
import TextTypingPlugin from 'phaser3-rex-plugins/plugins/texttyping-plugin.js'
import TitleScene from './scenes/titleScene'
import MainScene from './scenes/mainScene'
import PauseScene from './scenes/pauseScene'
import EndScene from './scenes/endScene'

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
  audio: {
    noAudio: true,
  },
  scene: [TitleScene, MainScene, PauseScene, EndScene],
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
      {
        key: 'rexTextTypingPlugin',
        plugin: TextTypingPlugin,
        start: true,
      },
    ],
  },
}

// https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

window.addEventListener('load', () => {
  const game = new Phaser.Game(phaser_config)
  log.info('Phaser loaded.')
  // TODO: figure out prolific/mturk/elsewhere here (URL parsing)
  // Remember that localStorage *only stores strings*
  const url_params = new URL(window.location.href).searchParams
  // If coming from prolific, use that ID. Otherwise, generate some random chars
  const randomString = (length) => [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join('')
  let id = url_params.get('PROLIFIC_PID') || url_params.get('id') || randomString(10)

  // assign group if need be
  //let group = url_params.get('group') || randint(1, 4)
  let group = 1

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
    debug: url_params.get('debug') !== null,
    group: group,
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
// window.addEventListener('devtoolschange', (event) => {
//   log.warn(`Devtools opened: ${event.detail.isOpen} at time ${window.performance.now()}`)
// })
