const CHARCOAL = 0x36454f

export default function make_question(scene, x, y, question, responses) {
  let foo = scene.rexUI.add
    .dialog({
      x: x,
      y: y,
      background: scene.add.rexRoundRectangle(0, 0, 50, 100, 10, CHARCOAL),
      choicesType: 'radio',
      content: scene.add.text(0, 0, question, {
        fontSize: '22px',
        fontFamily: 'Verdana',
        wordWrap: { width: 650, useAdvancedWrap: true },
      }),
      choices: responses.map((x) => createButton(scene, x)),
      space: {
        content: 15,
        choice: 5,
        left: 15,
        right: 15,
        top: 15,
        bottom: 15,
      },
      expand: { content: false },
    })
    .layout()
    .popUp(100)

  foo.selection = null
  foo.on('button.click', (button, groupName, index) => {
    let buttons = foo.getElement('choices')
    for (let b of buttons) {
      b.getElement('icon').setFillStyle()
    }
    button.getElement('icon').setFillStyle(0xffffff)
    foo.selection = buttons.length - index // invert 'cause highest always at top
    console.log(foo.selection)
  })
  return foo
}

export function createButton(scene, text) {
  return scene.rexUI.add.label({
    width: 100,
    height: 25,
    text: scene.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'Verdana',
      wordWrap: { width: 500, useAdvancedWrap: true },
    }),
    icon: scene.add.circle(0, 0, 10).setStrokeStyle(3, 0x000000),
    space: {
      left: 10,
      right: 10,
      icon: 10,
    },
    name: text,
  })
}
