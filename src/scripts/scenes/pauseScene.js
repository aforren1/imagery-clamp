export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' })
  }

  create() {
    let height = this.game.config.height
    let center = height / 2
    this.cameras.main.setBackgroundColor('rgba(1, 1, 1, 0.7)')
    this.add
      .text(center, center, 'Paused\n\nClick the left mouse\nbutton to resume.', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 60,
        color: '#dddddd',
        stroke: '#444444',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
    this.input.on('pointerdown', (ptr) => {
      this.scale.startFullscreen()
      this.input.mouse.requestPointerLock()
      this.scene.resume('mainScene')
      this.scene.sleep()
    })
  }
}
