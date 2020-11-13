import log from '../utils/logger'
import { TypingText } from '../objects/typingtext'
import { Enum } from '../utils/enum'
import { Examples, Examples2 } from '../objects/examples'
import merge_data from '../utils/merge'
import { smootherstep } from '../utils/ease'
import trials from '../../assets/trial_settings.json'
import { clamp } from '../utils/clamp'

const WHITE = 0xffffff
const MAGENTA = 0xff00ff // imagine moving to the target
const GREEN = 0x00ff00 // actually move to the target

// instructions correspond to the 'section' divisions in the trial table
const txt_1 =
  'Move the mouse to the center of the screen to start a trial. You will see [color=yellow]four targets[/color]. When a target turns [color=#00ff00]green[/color], move your mouse [color=yellow]straight through[/color] the target. You will not be able to see the mouse cursor, but will receive feedback that you have moved far enough when the target turns back to [color=white]white[/color]. Always try to make straight mouse movements.'
const txt_2 =
  'You will continue doing the same task, but now will be able to see the mouse cursor. Continue to make [color=yellow]straight mouse movements through the target[/color].'
const txt_3 =
  'Now you will receive a mixture of [color=magenta]imagined[/color] and [color=#00ff00]action[/color] trials.\n\nWhen the target turns [color=magenta]magenta[/color] in [color=magenta]imagined[/color] trials, you will [color=red]not move the mouse[/color], but will instead imagine moving the mouse [color=yellow]straight through[/color] the target. We will show you a moving cursor in these trials.\n\nWhen the target turns [color=#00ff00]green[/color], you will [color=#00ff00]move[/color] the move your mouse [color=yellow]straight through[/color] the target. You will not be able to see the mouse cursor on these trials, but will receive feedback that you have moved far enough when the target turns back to [color=white]white[/color]. On these trials, always try to make straight mouse movements.'
const txt_4 =
  'One more section! This will be identical to the first section. When a target turns [color=#00ff00]green[/color], move your mouse [color=yellow]straight through[/color] the target. You will not be able to see the mouse cursor, but will receive feedback that you have moved far enough when the target turns back to [color=white]white[/color]. Always try to make straight mouse movements.'

const states = Enum([
  'INSTRUCT', // show text instructions (based on stage of task)
  'PRETRIAL', // wait until in center
  'MOVING', // shoot through
  'POSTTRIAL', // auto teleport back to -30, -30
  'TAKE_A_BREAK', // every 80 trials, take a break
  'END_SECTION', //
])

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
    this._state = states.INSTRUCT
    this.entering = true
    this.all_data = { warmup_invis: [], warmup_vis: [], imagine: [], washout: [] }
  }

  create() {
    let config = this.game.config
    this.cameras.main.setBounds(-config.width / 2, -config.height / 2, config.width, config.height)
    let height = config.height
    let hd2 = height / 2
    this.trial_counter = 0
    this.entering = true
    this.state = states.INSTRUCT
    this.anim_flag = false

    let group = this.game.user_config.group
    this.trial_table = trials[group]

    this.trial_incr = 1
    // in debug mode, just do subset of trials
    if (this.game.user_config.debug) {
      this.trial_incr = 8
    }

    let angles = []
    for (let i = 0; i < this.trial_table.length; i++) {
      angles.push(this.trial_table[i].target_angle)
    }
    let unique_angles = [...new Set(angles)]
    let radius = this.trial_table[0].target_radius
    this.targets = {}
    // center
    this.add.circle(0, 0, 15, WHITE)
    this.origin = new Phaser.Geom.Circle(0, 0, 15)
    for (let angle of unique_angles) {
      let radians = Phaser.Math.DegToRad(angle)
      let x = radius * Math.cos(radians)
      let y = radius * Math.sin(radians)
      this.targets[angle] = this.add.circle(x, y, 30, WHITE)
    }
    console.log(this.targets)

    // user cursor
    this.user_cursor = this.add.circle(-30, -30, 5, WHITE)
    this.fake_cursor = this.add.circle(0, 0, 5, WHITE)

    // big fullscreen quad in front of game, but behind text instructions
    this.darkener = this.add.rectangle(0, 0, 800, 800, 0x000000).setAlpha(0.9)

    this.instructions = TypingText(this, 0, -hd2 + 20, '', {
      fontFamily: 'Verdana',
      fontSize: 20,
      wrap: {
        mode: 'word',
        width: 650,
      },
    })
      .setOrigin(0.5, 0)
      .setVisible(false)

    this.any_start = this.add
      .text(0, hd2 - 100, 'Click the mouse button to continue.', {
        fontFamily: 'Verdana',
        fontSize: 40,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false)

    // start the mouse at offset
    this.raw_x = -30
    this.raw_y = -30

    // set up mouse callback (does all the heavy lifting)
    this.input.on('pointerdown', (ptr) => {
      this.input.mouse.requestPointerLock()
    })
    this.input.on('pointerlockchange', (ptr) => {
      console.log('oh no, this does not work')
    })

    this.input.on('pointermove', (ptr) => {
      let time = window.performance.now() // the time in the ptr should be a little quicker...
      if (this.input.mouse.locked) {
        let dx = ptr.movementX
        let dy = ptr.movementY
        // update "raw" mouse position (remember to set these back to (0, 0)
        // when starting a new trial)
        this.raw_x += dx
        this.raw_y += dy
        this.raw_x = clamp(this.raw_x, -400, 400)
        this.raw_y = clamp(this.raw_y, -400, 400)

        // useful for deciding when to turn on/off visual feedback
        let extent = Math.sqrt(Math.pow(this.raw_x, 2) + Math.pow(this.raw_y, 2))
        this.extent = extent
        this.user_cursor.x = this.raw_x
        this.user_cursor.y = this.raw_y
        if (this.state === states.MOVING) {
          /* three cases:
          user controls cursor and is visible
          user controls cursor and is invisible
          user does not control cursor-- animated by 
          */
          this.trial_data.push({ time: time, cursor_x: this.raw_x, cursor_y: this.raw_y })
          let tifo = this.trial_info
          if (tifo.trial_type === 'online_feedback') {
          }
        }
      }
    })
  }

  update() {
    switch (this.state) {
      case states.INSTRUCT:
        if (this.entering) {
          this.entering = false
          this.instructions.visible = true
          this.darkener.visible = true
          let txt = txt_1

          if (this.trial_counter >= 200) {
            txt = txt_4
          } else if (this.trial_counter >= 40) {
            txt = txt_3
          } else if (this.trial_counter >= 20) {
            txt = txt_2
          }
          this.instructions.start(txt, 10)
          this.instructions.typing.once('complete', () => {
            this.any_start.visible = true
            this.input.once('pointerdown', () => {
              this.darkener.visible = false
              this.instructions.visible = false
              this.any_start.visible = false
              this.state = states.PRETRIAL
            })
          })
        }
        break
      case states.PRETRIAL:
        if (this.entering) {
          this.entering = false
          this.hold_t = 1000
        }
        if (Phaser.Geom.Circle.ContainsPoint(this.origin, this.user_cursor)) {
          this.hold_t -= this.game.loop.delta
          if (this.hold_t <= 0) {
            this.raw_x = 0
            this.raw_y = 0
            this.user_cursor.x = 0
            this.user_cursor.y = 0
            this.state = states.MOVING
            this.trial_data = []
          }
        } else {
          this.hold_t = 1000
        }
        break
      case states.MOVING:
        this.trial_info = this.trial_table[this.trial_counter]
        let tifo = this.trial_info
        if (this.entering) {
          this.entering = false
          this.reference_time = this.game.loop.now
          // look up trial info

          console.log(tifo)
          let color = GREEN
          let target = this.targets[tifo.target_angle]
          if (tifo.trial_type === 'no_feedback') {
            this.user_cursor.visible = false
          } else if (tifo.trial_type === 'clamp_imagery') {
            this.user_cursor.visible = false // use fake_cursor instead
            this.fake_cursor.visible = true
            this.anim_flag = false
            color = MAGENTA
            let radians = Phaser.Math.DegToRad(tifo.target_angle + tifo.clamp_angle)
            let radius = tifo.target_radius + 60
            let x = radius * Math.cos(radians)
            let y = radius * Math.sin(radians)
            this.tweens.timeline({
              tweens: [
                {
                  delay: 500, // TODO: median RT + jitter?
                  targets: this.fake_cursor,
                  x: x,
                  y: y,
                  ease: 'Power4',
                  duration: 300, // TODO: calc from how long it takes to get beyond
                  onComplete: () => {
                    this.anim_flag = true
                  },
                },
              ],
            })
          } else {
            this.user_cursor.visible = true
          }
          target.fillColor = color
        }
        if (tifo.trial_type === 'clamp_imagery' && this.extent >= 15) {
          console.log('Do not move on imagery trials.')
        }
        if (this.extent >= tifo.target_radius + 30 || this.anim_flag) {
          this.targets[tifo.target_angle].fillColor = WHITE
          this.state = states.POSTTRIAL
          this.fake_cursor.visible = false
          this.fake_cursor.x = 0
          this.fake_cursor.y = 0
          this.user_cursor.visible = false
        }
        break
      case states.POSTTRIAL:
        // teleport cursor back to -30, -30 and show
        if (this.entering) {
          this.entering = false
          // deal with trial data
          let trial_data = { movement_data: this.trial_data, reference_time: this.reference_time }
          let combo_data = merge_data(this.trial_info, trial_data)
          console.log(combo_data)
          console.log(this.trial_info)
          this.all_data[this.trial_info.section].push(combo_data)
          this.time.delayedCall(1500, () => {
            this.raw_x = this.raw_y = this.user_cursor.x = this.user_cursor.y = -30
            this.user_cursor.visible = true
            this.trial_counter += this.trial_incr
            this.state = states.PRETRIAL
          })
        }
    }
  }
  get state() {
    return this._state
  }

  set state(newState) {
    if (this.state != newState) {
      this.entering = true
      this._state = newState
    }
  }
}
