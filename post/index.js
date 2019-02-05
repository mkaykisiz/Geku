const posts = require('./route')

function initPosts (app) {
  app.use('/posts', posts)
}

module.exports = initPosts
