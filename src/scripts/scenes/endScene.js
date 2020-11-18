// all done, send the data
import log from '../utils/logger'
import postData from '../utils/postdata'
import { onBeforeUnload } from '../game'

export default class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScene' })
  }
  create(today_data) {
    let height = this.game.config.height
    let center = height / 2

    window.removeEventListener('beforeunload', onBeforeUnload)
    this.add
      .text(center, center, 'Thank you for participating!\nRedirecting shortly...', {
        fontFamily: 'Verdana',
        fontSize: 30,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)

    let mostly = 'https://app.prolific.co/submissions/complete?cc='
    if (this.game.user_config.prolific_config.prolific_pid === null) {
      mostly = 'https://google.com/?cc='
    }

    let alldata = { config: this.game.user_config, data: today_data }

    Promise.all(postData(alldata)).then((values) => {
      window.location.href = mostly + '321B5ECD'
      // if (values[0] !== 500 || values[1] !== 500) {
      // } else {
      //   log.error('Forwarding failed HARD')
      // }
    })
  }
}
