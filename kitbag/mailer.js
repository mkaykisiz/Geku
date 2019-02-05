var nodemailer = require('nodemailer')
const config = require('../config')

var transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: false,
  auth: {
    user: config.SENDER_MAIL,
    pass: config.SENDER_MAIL_PASSWORD
  }
})

var mailSender = function (mailOptions) {
  mailOptions['from'] = config.SENDER_MAIL
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

module.exports = mailSender
