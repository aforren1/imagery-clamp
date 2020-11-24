const API_KEY = process.env.MAILGUN_API_KEY
const DOMAIN = process.env.MAILGUN_DOMAIN
const mailgun = require('mailgun-js')({ apiKey: API_KEY, domain: DOMAIN })

function sendMailgun(buf2, id, p_count, tot, callback) {
  let buf = new Buffer.from(buf2, 'utf8')

  var attach = new mailgun.Attachment({
    data: buf,
    filename: `imagine_data_${id}.json`,
    contentType: 'application/json',
    knownLength: buf.length,
  })

  let data = {
    from: 'The Mailgun Machine <mailgun@' + DOMAIN + '>',
    to: 'actlab@yale.edu',
    subject: `[imagine] Fresh data from ${id}`,
    text: `see attached, punished ${p_count} / ${tot} trials.`,
    attachment: attach,
  }

  mailgun.messages().send(data, function (error, body) {
    if (error) {
      callback(null, {
        statusCode: error.statusCode,
      })
    } else {
      callback(null, {
        statusCode: 200,
      })
    }
  })
}

exports.handler = function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  const data_in = JSON.parse(event.body)
  let p_count = 0
  let dat = data_in.data['imagine']
  for (let i = 0; i < dat.length; i++) {
    if (dat[i].any_punishment) {
      p_count += 1
    }
  }

  sendMailgun(event.body, data_in['config']['id'], p_count, dat.length, callback)
}
