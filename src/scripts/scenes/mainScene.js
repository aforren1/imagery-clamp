import log from '../utils/logger'
import { TypingText } from '../objects/typingtext'
import { Enum } from '../utils/enum'
import { Examples, Examples2 } from '../objects/examples'
import merge_data from '../utils/merge'

const WHITE = 0xffffff
const MAGENTA = 0xff00ff // imagine moving to the target
const GREEN = 0x00ff00 // actually move to the target

// intro instructions
const txt_1 = ''
const txt_2 = ''

const states = Enum([
  'INSTRUCT', // show text instructions (based on stage of task)
  'COUNTDOWN', // 3-2-1-GO
  'MAIN_LOOP', // handle task state
  'TAKE_A_BREAK', // every 80 trials, take a break
  'END_SECTION', //
])

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
  }
}
