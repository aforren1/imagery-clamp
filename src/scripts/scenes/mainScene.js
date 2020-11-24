import log from '../utils/logger'
import { TypingText } from '../objects/typingtext'
import make_question from '../objects/question'
import make_submit from '../objects/button'
import { Enum } from '../utils/enum'
import { Examples, Examples2 } from '../objects/examples'
import merge_data from '../utils/merge'
import trials from '../../assets/trial_settings.json'
import { clamp } from '../utils/clamp'
import signedAngleDeg from '../utils/angulardist'
import { mad } from '../utils/medians'

const WHITE = 0xffffff
const MAGENTA = 0xff00ff // imagine moving to the target
const GREEN = 0x00ff00 // actually move to the target
const GRAY = 0x666666
const TARGET_SIZE_RADIUS = 30

// instructions correspond to the 'section' divisions in the trial table
const txt_1 =
  'There are four circular targets arranged around the screen. Move your mouse to the small circle at the center of the screen to start a trial. When a target turns [color=#00ff00]green[/color], move your mouse straight through it. The target will turn back to [color=#777777]gray[/color] when you have moved far enough. Always try to make straight mouse movements.\n\nAfter the movement, the mouse cursor will [color=yellow]teleport[/color] next to the center.'
const txt_2 =
  'The mouse cursor will now be [color=yellow]invisible[/color] during your movements. Continue to make straight mouse movements through the targets when they turn [color=#00ff00]green[/color].'
const txt_3 =
  'You will now encounter a new type of trial.\n\nOn [color=magenta]imagination[/color] trials, the target will turn [color=magenta]magenta[/color]. [color=red]Do not move the mouse to the magenta target[/color]. Instead, [color=yellow]imagine[/color] moving the mouse straight through the target. You will see the cursor miss the target. Try your best to [color=yellow]ignore[/color] the cursor and [color=yellow]visualize yourself moving the mouse directly through the target[/color].'

const txt_4 =
  'Good job! Now you will experience a mix of [color=magenta]imagination[/color] and [color=#00ff00]action[/color] trials. When the target is [color=magenta]magenta[/color], [color=yellow]imagine[/color] moving your mouse straight through the target and [color=yellow]ignore[/color] the cursor. When the target is [color=#00ff00]green[/color], [color=yellow]move[/color] your mouse straight through the target. Always try to make straight mouse movements.'

const txt_5 =
  'This section will be the same as the second section. When a target turns [color=#00ff00]green[/color], move your mouse straight through it. You will not see the cursor while you move. The target will turn [color=#777777]gray[/color] when you have moved far enough. Always try to make straight mouse movements.'

const txt_6 =
  'Two more trials to go! The first trial will be an [color=#00ff00]action[/color] trial without a visible cursor, and the second will be an [color=magenta]imagination[/color] trial. After these two trials, we will ask you two questions about those trials.'

const states = Enum([
  'INSTRUCT', // show text instructions (based on stage of task)
  'PRETRIAL', // wait until in center
  'MOVING', // shoot through
  'POSTTRIAL', // auto teleport back to -30, -30
  //'TAKE_A_BREAK', // every 80 trials, take a break
  'QUESTIONS', // ask some questions about the last two trials
  'END_SECTION', //
])

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
    this._state = states.INSTRUCT
    this.entering = true
    this.all_data = {
      warmup_vis: [], // practice reaching with vis feedback
      warmup_invis: [], // practice reaching without vis feedback
      imagine_criterion: [], // unknown size, until person doesn't move on magenta
      imagine: [], // the big dance-- mix of imagery and real reaches
      washout: [], // back to warmup_invis, but now they've experienced the world
      questionnaire_reach: [], // two trials during questionnaire
      questionnaire: { a1: -1, a2: -1 }, // two questions at end
    }
  }

  create() {
    let config = this.game.config
    this.cameras.main.setBounds(-config.width / 2, -config.height / 2, config.width, config.height)
    let height = config.height
    let hd2 = height / 2
    this.trial_counter = 0
    this.entering = true
    this.state = states.INSTRUCT

    let group = this.game.user_config.group
    this.trial_table = trials[group]

    this.trial_incr = 1
    // in debug mode, just do subset of trials
    if (this.game.user_config.debug) {
      this.trial_incr = 40
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
      this.targets[angle] = this.add.circle(x, y, TARGET_SIZE_RADIUS, GRAY)
    }

    // user cursor
    this.user_cursor = this.add.circle(-30, -30, 5, WHITE)
    this.fake_cursor = this.add.circle(0, 0, 5, WHITE).setVisible(false)

    // other warnings
    this.other_warns = this.add
      .rexBBCodeText(0, 0, '', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 50,
        color: '#ffffff',
        align: 'center',
        stroke: '#444444',
        backgroundColor: '#111111',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false)

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

    this.break_txt = this.add
      .rexBBCodeText(
        0,
        0,
        'Take a 10 second break.\nRemember to visualize moving the cursor through the target on [color=magenta]imagination[/color] trials, and to make straight movements through the target on [color=#00ff00]action[/color] trials.',
        {
          fontFamily: 'Verdana',
          fontStyle: 'bold',
          fontSize: 40,
          color: '#ffffff',
          align: 'center',
          stroke: '#444444',
          backgroundColor: '#111111',
          strokeThickness: 4,
          wrap: {
            mode: 'word',
            width: 650,
          },
        }
      )
      .setOrigin(0.5, 0.5)
      .setVisible(false)

    // survey questions
    this.q1 = make_question(
      this,
      0,
      -200,
      'Rate the clarity of the visual image associated with the imagined movement:',
      [
        '5 - Image as clear as seeing',
        '4 - Clear image',
        '3 - Moderately clear image',
        '2 - Vague image',
        '1 - No image, you only "know" that you are thinking of the movement',
      ]
    ).setVisible(false)

    this.q2 = make_question(
      this,
      0,
      100,
      'Rate the intensity of the physical sensations associated with the imagined movement:',
      [
        '5 - As intense as executing the action',
        '4 - Intense',
        '3 - Moderate',
        '2 - Mild',
        '1 - No sensation, you only "know" that you are thinking of the movement',
      ]
    ).setVisible(false)

    this.submit_button = make_submit(this, 0, 300).setVisible(false)

    // start the mouse at offset
    this.raw_x = -30
    this.raw_y = -30

    // set up mouse callback (does all the heavy lifting)
    this.input.on('pointerdown', (ptr) => {
      let val = this.state !== states.QUESTIONS && this.state !== states.END_SECTION
      console.log(val)
      if (val) {
        this.scale.startFullscreen()
        this.time.delayedCall(400, () => {
          this.input.mouse.requestPointerLock()
        })
      }
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
        // convert cursor angle to degrees
        let cursor_angle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Normalize(Math.atan2(this.raw_y, this.raw_x)))
        this.cursor_angle = cursor_angle
        this.user_cursor.x = this.raw_x
        this.user_cursor.y = this.raw_y
        if (this.state === states.MOVING) {
          /* three cases:
          user controls cursor and is visible
          user controls cursor and is invisible
          user does not control cursor-- animated by 
          */
          this.trial_data.push({
            callback_time: time,
            evt_creation_time: ptr.moveTime,
            cursor_x: this.raw_x,
            cursor_y: this.raw_y,
            cursor_extent: extent,
            cursor_angle: cursor_angle,
          })
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
          let txt = txt_1 // intro (visible reaching)
          // we're going to insert a trial at index 40 for
          // imagery practice, so everything after that gets
          // bumped one (though note the data in imagine_criterion
          // may not be of length one, depending on how long it takes
          // for them to be successful. Also the trial counter won't increment
          // during the criterion.)
          if (this.trial_counter == 221) {
            txt = txt_6 // ask some questions
          } else if (this.trial_counter == 201) {
            txt = txt_5 // back to invis, w/o imagery
          } else if (this.trial_counter == 41) {
            txt = txt_4 // mix imagery + invis
          } else if (this.trial_counter == 40) {
            txt = txt_3 // practice imagery until success
          } else if (this.trial_counter == 20) {
            txt = txt_2 // start invis reaching
          }
          this.instructions.start(txt, 1) // 1 for debug, 50 for real
          this.instructions.typing.once('complete', () => {
            this.any_start.visible = true
            this.input.once('pointerdown', () => {
              this.darkener.visible = false
              this.instructions.visible = false
              this.instructions.text = ''
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
          this.break_lock = false
          if (this.trial_counter == 120) {
            this.break_lock = true
            this.break_txt.visible = true
            this.time.delayedCall(10000, () => {
              this.break_lock = false
              this.break_txt.visible = false
            })
          }
        }
        if (!this.break_lock && Phaser.Geom.Circle.ContainsPoint(this.origin, this.user_cursor)) {
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
          this.moved_on_imagery = false
          this.reference_time = this.game.loop.now
          // every trial starts at 0, 0
          this.trial_data.splice(0, 0, {
            callback_time: this.reference_time,
            evt_creation_time: this.reference_time,
            cursor_x: 0,
            cursor_y: 0,
            cursor_extent: 0,
            cursor_angle: 0,
          })
          // look up trial info

          //console.log(tifo)
          let color = GREEN
          let target = this.targets[tifo.target_angle]
          if (tifo.trial_type === 'no_feedback') {
            this.user_cursor.visible = false
          } else if (tifo.trial_type === 'clamp_imagery') {
            this.user_cursor.visible = false // use fake_cursor instead
            this.fake_cursor.visible = true
            this.fake_cursor.x = 0
            this.fake_cursor.y = 0
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
                  duration: 200, // TODO: calc from how long it takes to get beyond
                },
              ],
            })
          } else {
            this.user_cursor.visible = true
          }
          target.fillColor = color
        }

        if (tifo.trial_type === 'clamp_imagery' && this.extent >= 15) {
          this.moved_on_imagery = true
          this.fake_cursor.visible = false
        }
        let fake_extent = Math.sqrt(Math.pow(this.fake_cursor.x, 2) + Math.pow(this.fake_cursor.y, 2))
        if (
          (tifo.trial_type !== 'clamp_imagery' && this.extent >= tifo.target_radius + 30) ||
          (tifo.trial_type === 'clamp_imagery' && fake_extent >= tifo.target_radius + 30)
        ) {
          this.targets[tifo.target_angle].fillColor = GRAY
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
          let trial_data = {
            movement_data: this.trial_data,
            reference_time: this.reference_time,
            moved_on_imagery: this.moved_on_imagery,
            trial_number: this.trial_counter,
            target_size_radius: TARGET_SIZE_RADIUS, // fixed above
          }
          let combo_data = merge_data(this.trial_info, trial_data)
          console.log(combo_data)
          let delay = 1000
          // feedback about movement angle (if non-imagery)
          let first_element = trial_data.movement_data[1]
          let last_element = trial_data.movement_data[trial_data.movement_data.length - 1]
          let target_angle = this.trial_info.target_angle
          let not_imagery = this.trial_info.trial_type !== 'clamp_imagery'
          // debug reach duration and reaction time
          // if (not_imagery) {
          //   console.log(first_element.time - this.reference_time)
          //   console.log(last_element.time - first_element.time)
          // }
          // try to get an idea of how straight the movement was
          // ignore early points (which will likely have extreme values)
          let reach_angles = this.trial_data.filter((a) => a.cursor_extent > 15).map((a) => a.cursor_angle)
          let end_angle = reach_angles.slice(-1)
          let norm_reach_angles = reach_angles.map((a) => signedAngleDeg(a, end_angle))
          // console.log(norm_reach_angles)
          // console.log(mad(norm_reach_angles))
          let punished = false
          let punish_delay = 2000
          if (!not_imagery && this.moved_on_imagery) {
            punished = true
            this.other_warns.text =
              '[b]Do not move on\n[color=magenta]imagine[/color] trials, but\nimagine moving\nthrough the target.[/b]'
          } else if (not_imagery && Math.abs(signedAngleDeg(last_element.cursor_angle, target_angle)) >= 60) {
            // bad reach angle at endpoint
            punished = true
            this.other_warns.text = '[b]Make reaches toward\nthe [color=#00ff00]green[/color] target.[/b]'
          } else if (not_imagery && first_element.evt_creation_time - this.reference_time >= 1000) {
            // high RT
            punished = true
            this.other_warns.text = '[b]Please start the\nreach sooner.[/b]'
          } else if (not_imagery && last_element.evt_creation_time - first_element.evt_creation_time >= 500) {
            // slow reach
            punished = true
            this.other_warns.text = '[b]Please move more quickly.[/b]'
          } else if (mad(norm_reach_angles) > 10) {
            // wiggly reach
            punished = true
            this.other_warns.text =
              '[b]Please make [color=yellow]straight[/color]\nreaches toward the\n[color=#00ff00]green[/color] target.[/b]'
          }
          if (punished) {
            delay += punish_delay
            this.other_warns.visible = true
            this.time.delayedCall(punish_delay, () => {
              this.other_warns.visible = false
            })
          }
          combo_data['any_punishment'] = punished
          this.all_data[this.trial_info.section].push(combo_data)

          this.time.delayedCall(delay, () => {
            this.raw_x = this.raw_y = this.user_cursor.x = this.user_cursor.y = -30
            this.user_cursor.visible = true
            this.tweens.add({
              targets: this.user_cursor,
              scale: { from: 0, to: 1 },
              ease: 'Elastic',
              easeParams: [5, 0.5],
              duration: 800,
              onComplete: () => {
                if (!(this.trial_counter == 40 && punished)) {
                  this.trial_counter += this.trial_incr
                }
                // decide new state
                if (this.trial_counter >= this.trial_table.length) {
                  this.state = states.QUESTIONS
                } else if (this.trial_counter == 221) {
                  this.state = states.INSTRUCT
                } else if (this.trial_counter == 201) {
                  this.state = states.INSTRUCT
                } else if (this.trial_counter == 41) {
                  this.state = states.INSTRUCT
                } else if (this.trial_counter == 40) {
                  this.state = states.INSTRUCT
                } else if (this.trial_counter == 20) {
                  this.state = states.INSTRUCT
                } else {
                  this.state = states.PRETRIAL
                }
              },
            })
          })
        }
        break

      case states.QUESTIONS:
        if (this.entering) {
          this.input.mouse.releasePointerLock()
          this.entering = false
          this.q1.visible = true
          this.q2.visible = true
          this.submit_button.visible = true
          this.submit_button.on('button.click', (button, index, pointer, event) => {
            if (this.q1.selection !== null && this.q2.selection !== null) {
              this.all_data.questionnaire['a1'] = this.q1.selection
              this.all_data.questionnaire['a2'] = this.q2.selection
              console.log(this.q1.selection, this.q2.selection)
              this.state = states.END_SECTION
            }
          })
        }

        break
      case states.END_SECTION:
        if (this.entering) {
          this.entering = false

          // fade out
          this.tweens.addCounter({
            from: 255,
            to: 0,
            duration: 2000,
            onUpdate: (t) => {
              let v = Math.floor(t.getValue())
              this.cameras.main.setAlpha(v / 255)
            },
            onComplete: () => {
              this.scene.start('EndScene', this.all_data)
            },
          })
        }
        break
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
