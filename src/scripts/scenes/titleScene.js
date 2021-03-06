import log from '../utils/logger'
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }
  preload() {
    // load feedback images (check? x? sparks?)
    // this.load.image('check', 'assets/check_small.png')
    // this.load.image('x', 'assets/x_small.png')
    // this.load.atlas('flares', 'assets/flares.png', 'assets/flares.json')
    this.load.image('think', 'assets/think.png')
    this.load.image('cursor', 'assets/cursor.png')
    this.load.image('mouse', 'assets/mouse.jpg')
    this.load.image('touchscreen', 'assets/touchscreen.jpg')
    this.load.image('trackball', 'assets/trackball.jpg')
    this.load.image('trackpad', 'assets/trackpad.jpg')
  }
  create() {
    let height = this.game.config.height
    let center = height / 2

    this.add.image(center, center + 50, 'think').setScale(1.5, 1.2)

    this.add
      .text(center, center - 200, 'Imagine.', {
        fontSize: 160,
        fontFamily: 'Arial',
        fontStyle: 'italic',
        fill: false,
        strokeThickness: 2,
        shadow: {
          blur: 10,
          color: '#ffffff',
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5, 0.5)

    let start_txt = this.add
      .text(center, center + 300, 'Click the left mouse\nbutton to start.', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 60,
        color: '#dddddd',
        stroke: '#444444',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)

    this.flash = this.tweens.add({
      targets: start_txt,
      alpha: { from: 0.3, to: 1 },
      ease: 'Linear',
      duration: 1000,
      repeat: -1,
      yoyo: true,
    })

    this.input.once('pointerdown', (ptr) => {
      // I wish I could do both at the same time, but after the fullscreen
      // comes on it releases the pointer lock?? At least on FF, chrome does fine
      // this.input.mouse.requestPointerLock()
      // TODO: readd
      this.flash.stop()
      this.scale.startFullscreen()
      this.tweens.addCounter({
        from: 255,
        to: 0,
        duration: 2000,
        onUpdate: (t) => {
          let v = Math.floor(t.getValue())
          this.cameras.main.setAlpha(v / 255)
        },
        onComplete: () => {
          // TODO: https://docs.google.com/document/d/17pvFMFqtAIx0ZA6zMZRU_A2-VnjhNX9QlN1Cgy-3Wdg/edit
          this.input.mouse.requestPointerLock()
          this.scene.start('MainScene')
          //console.log(foo.selection, bar.selection)
        },
      })
    })
    // this.input.once('pointerup', (ptr) => {
    //   this.input.mouse.requestPointerLock()
    // })
  }
}
