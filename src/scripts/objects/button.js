export default function make_submit(scene, x, y) {
  let foo = scene.rexUI.add
    .buttons({
      x: x,
      y: y,
      width: 400,
      buttons: [createButton(scene, 'SUBMIT')],
      click: {
        mode: 'pointerdown',
        clickInterval: 100,
      },
      expand: true,
    })
    .layout()
  return foo
}

function createButton(scene, text) {
  return scene.rexUI.add.label({
    width: 40,
    height: 40,
    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0xc2561a).setStrokeStyle(3, 0xffffff),
    text: scene.add.text(0, 0, text, {
      fontSize: '24px',
      fontFamily: 'Verdana',
    }),
    space: {
      left: 10,
      right: 10,
    },
    align: 'center',
  })
}
