const { google } = require('googleapis')

const GOOGLE_JSON = JSON.parse(process.env.GOOGLE_DRIVE_JSON)
const FOLDER_ID = '1oRsAXm-gCwDWFefxOkTc8eOLpx8RzIZG'

async function sendFile(buf2, id, day) {
  const client = await google.auth.getClient({
    credentials: GOOGLE_JSON,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  // send to drive
  const drive = google.drive({ version: 'v3', auth: client })

  await drive.files.create({
    requestBody: {
      name: `data_${id}_day${day}.json`,
      mimeType: 'application/json',
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: 'application/json',
      body: buf2,
    },
  })
}

exports.handler = function (event, context, callback) {
  // adddlert('Welcome guest!') // break for testing
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const data_in = JSON.parse(event.body)

  sendFile(event.body, data_in['config']['id'], data_in['config']['day'])
    .then(() => {
      callback(null, {
        statusCode: 200,
      })
    })
    .catch((e) => {
      callback(e, {})
    })
}
