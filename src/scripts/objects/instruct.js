// rounded rectangle with text on one side and
// a repeating gif/texture on the other side
// probably need to hook into the `scene.update`
// to call clear/draw/etc.

//

export default class InstructCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, alpha) {
    //
    let frame = this.add.rexRoundRectangle(0, 0)
  }
}
