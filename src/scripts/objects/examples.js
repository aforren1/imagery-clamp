//
const WHITE = 0xffffff
const MAGENTA = 0xff00ff // imagine moving to the target
const GREEN = 0x00ff00 // actually move to the target
const GRAY = 0x666666
const TARGET_SIZE_RADIUS = 30

export class Examples extends Phaser.GameObjects.Container {
  constructor(scene, x, y, alpha) {
    let target = scene.add.circle(-200, 0, TARGET_SIZE_RADIUS, GRAY)
    super(scene, x, y, [target])
    this.alpha = alpha
    scene.add.existing(this)
  }
}

export class Examples2 extends Phaser.GameObjects.Container {
  constructor(scene, x, y, alpha) {
    super(scene, x, y, [])
    this.alpha = alpha
    scene.add.existing(this)
  }
}
