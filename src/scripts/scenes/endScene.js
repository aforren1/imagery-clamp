// all done, send the data
import log from '../utils/logger'
import postData from '../utils/postdata'
import { onBeforeUnload } from '../game'

export default class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScene' })
  }
  create(today_data) {
    let height = this.game.config.height
    let center = height / 2
    this.scale.stopFullscreen()
    window.removeEventListener('beforeunload', onBeforeUnload)
    this.add
      .text(center, 100, 'Last question!\nSelect which input device\nyou used (will auto redirect\nafter selection).', {
        fontFamily: 'Verdana',
        fontSize: 30,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)

    let mostly = 'https://app.prolific.co/submissions/complete?cc='

    function postSelection(scene) {
      if (scene.game.user_config.prolific_config.prolific_pid === null) {
        mostly = 'https://google.com/?cc='
      }

      let alldata = { config: scene.game.user_config, data: today_data }

      Promise.all(postData(alldata)).then((values) => {
        window.location.href = mostly + '78F974E9'
      })
    }

    function shrink(scene) {
      scene.tweens.add({
        targets: [mouse, trackball, trackpad, touchscreen],
        scale: { from: 1, to: 0 },
        duration: 1000,
      })
    }

    const mouse = this.add.image(200, 300, 'mouse').setInteractive().setOrigin(0.5, 0.5)
    mouse.on('pointerdown', () => {
      this.game.user_config.device = 'mouse'
      shrink(this)
      postSelection(this)
    })
    const touchscreen = this.add.image(200, 600, 'touchscreen').setInteractive().setOrigin(0.5, 0.5)
    touchscreen.on('pointerdown', () => {
      this.game.user_config.device = 'touchscreen'
      shrink(this)
      postSelection(this)
    })
    const trackball = this.add.image(600, 300, 'trackball').setInteractive().setOrigin(0.5, 0.5)
    trackball.on('pointerdown', () => {
      this.game.user_config.device = 'trackball'
      shrink(this)
      postSelection(this)
    })
    const trackpad = this.add.image(600, 600, 'trackpad').setInteractive().setOrigin(0.5, 0.5)
    trackpad.on('pointerdown', () => {
      this.game.user_config.device = 'trackpad'
      shrink(this)
      postSelection(this)
    })
  }
}
