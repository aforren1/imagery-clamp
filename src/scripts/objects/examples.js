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
    this.tl1 = scene.tweens.timeline({
      //delay: 500,
      loop: -1,
      loopDelay: 1000,
      paused: true,
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

  play() {
    this.tl1.play()
    this.tl1.resume()
  }
  stop() {
    this.tl1.pause()
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

export class ImageryExample extends Phaser.GameObjects.Container {
  // just imagery-- show purple target + stationary mouse + dot moving at offset
  // + thought bubble with cursor + dot moving through target
  constructor(scene, x, y, alpha) {
    let target = scene.add.circle(-100, 50, TARGET_SIZE_RADIUS, GRAY)
    let center = scene.add.circle(-300, 50, 15, WHITE)
    let img_cur = scene.add.image(-300, 50, 'cursor').setOrigin(0, 0).setScale(0.2)
    let cur = scene.add.circle(-300, 50, 10, WHITE)

    let thought = scene.add.image(200, 80, 'think').setScale(1.7, 1.3)
    let target2 = scene.add.circle(300, 50, TARGET_SIZE_RADIUS, GRAY)
    let center2 = scene.add.circle(100, 50, 15, WHITE)
    let img_cur2 = scene.add.image(100, 50, 'cursor').setOrigin(0, 0).setScale(0.2)
    let cur2 = scene.add.circle(100, 50, 10, WHITE)

    super(scene, x, y, [target, center, cur, img_cur, thought, target2, center2, cur2, img_cur2])
    this.cur = cur
    this.cur2 = cur2
    this.alpha = alpha

    scene.add.existing(this)
    this.tl1 = scene.tweens.timeline({
      //delay: 500,
      loop: -1,
      loopDelay: 1000,
      paused: true,
      tweens: [
        {
          targets: [target],
          x: -100,
          ease: 'Linear',
          duration: 200,
          onStart: () => {
            target.fillColor = GRAY
          },
          onComplete: () => {
            target.fillColor = MAGENTA
          },
        },
        {
          //delay: 500,
          offset: 800,
          targets: [cur],
          x: -50,
          y: -50,
          ease: 'Power2',
          duration: 1000,
          onComplete: () => {
            target.fillColor = GRAY
            cur.x = -300
            cur.y = 50
            img_cur.x = -300
          },
        },
      ],
    })

    // imaginary
    this.tl2 = scene.tweens.timeline({
      //delay: 500,
      loop: -1,
      loopDelay: 1000,
      paused: true,
      tweens: [
        {
          targets: [target2],
          x: 300,
          ease: 'Linear',
          duration: 200,
          onStart: () => {
            target2.fillColor = GRAY
          },
          onComplete: () => {
            target2.fillColor = MAGENTA
          },
        },
        {
          //delay: 500,
          offset: 800,
          targets: [cur2, img_cur2],
          x: 350,
          ease: 'Power2',
          duration: 1000,
          onComplete: () => {
            target2.fillColor = GRAY
            cur2.x = 100
            img_cur2.x = 100
          },
        },
      ],
    })
  }
  play() {
    this.tl1.play()
    this.tl2.play()
    this.tl1.resume()
    this.tl2.resume()
  }
  stop() {
    this.tl1.pause()
    this.tl2.pause()
  }
}
