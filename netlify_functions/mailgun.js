const API_KEY = process.env.MAILGUN_API_KEY
const DOMAIN = process.env.MAILGUN_DOMAIN
const mailgun = require('mailgun-js')({ apiKey: API_KEY, domain: DOMAIN })

function sendMailgun(buf2, id, day, callback) {
  let buf = new Buffer.from(buf2, 'utf8')

  var attach = new mailgun.Attachment({
    data: buf,
    filename: `data_${id}_day${day}.json`,
    contentType: 'application/json',
    knownLength: buf.length,
  })

  let data = {
    from: "Alex 'Mailgun' Forrence <mailgun@" + DOMAIN + '>',
    to: 'actlab@yale.edu',
    subject: `Fresh data from ${id}, day ${day}`,
    text: 'see attached',
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

  sendMailgun(event.body, data_in['config']['id'], data_in['config']['day'], callback)
}
