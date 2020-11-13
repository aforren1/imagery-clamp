//

export class Examples extends Phaser.GameObjects.Container {
  constructor(scene, x, y, alpha) {
    super(scene, x, y, [])
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
