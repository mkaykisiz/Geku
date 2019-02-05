const users = require('./route')

function initUser (app) {
  app.use('/users', users)
}

module.exports = initUser
