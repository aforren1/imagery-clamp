//
const WHITE = 0xffffff
const MAGENTA = 0xff00ff // imagine moving to the target
const GREEN = 0x00ff00 // actually move to the target
const GRAY = 0x666666
const TARGET_SIZE_RADIUS = 30

export class VisExample extends Phaser.GameObjects.Container {
  // vis cursor + target
  constructor(scene, x, y, alpha) {
    let target = scene.add.circle(-200, 0, TARGET_SIZE_RADIUS, GRAY)
    let center = scene.add.circle(200, 0, 15, WHITE)
    let img_cur = scene.add.image(200, 0, 'cursor').setOrigin(0, 0).setScale(0.2)

    let cur = scene.add.circle(200, 0, 10, WHITE)
    super(scene, x, y, [target, center, cur, img_cur])
    this.cur = cur
    this.alpha = alpha
    scene.add.existing(this)
    scene.tweens.timeline({
      //delay: 500,
      loop: -1,
      loopDelay: 1000,
      tweens: [
        {
          targets: [target],
          x: -200,
          ease: 'Linear',
          duration: 200,
          onStart: () => {
            target.fillColor = GRAY
          },
          onComplete: () => {
            target.fillColor = GREEN
          },
        },
        {
          //delay: 500,
          offset: 800,
          targets: [cur, img_cur],
          x: -300,
          ease: 'Power2',
          duration: 1000,
          onComplete: () => {
            target.fillColor = GRAY
            cur.x = 200
            img_cur.x = 200
          },
        },
      ],
    })
  }
}

export class InvisExample extends VisExample {
  // cursor is now invisible oooooo
  constructor(scene, x, y, alpha) {
    super(scene, x, y, alpha)
    this.cur.setFillStyle()
    this.cur.setStrokeStyle(1, 0xffffff)
  }
}

export class ImageryExample extends Phaser.GameObjects.Container {}
