const mongoose = require('mongoose')
const util = require('util')

// Post Schema
const PostSchema = mongoose.Schema({
  text: {
    type: String
  },
  user_id: {
    type: String,
    required: true
  },
  likes: {
    type: [String]
  },
  unlikes: {
    type: [String]
  },
  image_links: {
    type: [String]
  },
  video_links: {
    type: [String]
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  deleted_at: {
    type: Date
  }
})

const Post = module.exports = mongoose.model('Post', PostSchema)

// Get Post by id
module.exports.getPostById = function (id, callback) {
  Post.findById(id, callback)
}

// List Communities
module.exports.listPosts = function (filter, callback) {
  var perPage = 25
  if (filter.per_page) { perPage = parseInt(filter.per_page, 10) }
  var pageNumber = 0
  if (filter.page_number) { pageNumber = parseInt(filter.page_number, 10) }

  var sort = {}
  if (filter.sort_field) {
    if (filter.sort_type) {
      sort[filter.sort_field] = parseInt(filter.sort_type, 10)
    } else {
      sort[filter.sort_field] = -1
    }
  } else {
    sort['created_at'] = -1
  }

  var query = {
    deleted_at: null
  }

  if (filter.user_id) {
    query['user_id'] = filter.user_id
  }

  if (filter.text) {
    query['text'] = {
      '$regex': util.format('.*%s.*', filter.text),
      '$options': 'i'
    }
  }

  if (filter.users) {
    if (filter.users.constructor === Array) {
      query['user_id'] = { '$in': filter.users }
    } else {
      query['user_id'] = { '$in': JSON.parse(filter.users) }
    }
  }

  if (filter.likes) {
    query['likes'] = { '$in': JSON.parse(filter.likes) }
  }

  if (filter.unlikes) {
    query['unlikes'] = { '$in': JSON.parse(filter.likes) }
  }

  if (filter.not_likes) {
    query['likes'] = { '$nin': JSON.parse(filter.not_likes) }
  }

  if (filter.not_unlikes) {
    query['unlikes'] = { '$nin': JSON.parse(filter.not_unlikes) }
  }

  if (filter.start_created_at || filter.end_created_at) {
    var createdAtQuery = {}
    if (filter.start_created_at) { createdAtQuery['$gt'] = filter.start_created_at }
    if (filter.end_created_at) { createdAtQuery['$lt'] = filter.end_created_at }
    query['created_at'] = createdAtQuery
  }

  if (filter.start_updated_at || filter.end_updated_at) {
    var updatedAtQuery = {}
    if (filter.start_updated_at) { updatedAtQuery['$gt'] = filter.start_updated_at }
    if (filter.end_updated_at) { updatedAtQuery['$lt'] = filter.end_updated_at }
    query['updated_at'] = updatedAtQuery
  }

  Post.find(query, callback).skip(pageNumber > 0 ? ((pageNumber - 1) * perPage) : 0).limit(perPage).sort(sort)
}

// Update Post
module.exports.updatePost = function (id, userIdForCheck, updatePost, callback) {
  Post.findById(id, function (err, post) {
    if (err) callback(new Error(err))
    if (userIdForCheck.toString() !== post.user_id) callback(new Error('you can only update your own post'))

    updatePost.updated_at = new Date()
    post.set(updatePost)
    post.save(callback)
  })
}

// Like
module.exports.like = function (id, likedUserId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'likes': likedUserId } }
  Post.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, post) {
    if (err) callback(new Error(err))
    return callback(null, post)
  })
}

// Unlike
module.exports.unlike = function (id, likedUserId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'unlikes': likedUserId } }
  Post.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, post) {
    if (err) callback(new Error(err))
    return callback(null, post)
  })
}

// Add Image
module.exports.addImage = function (id, imageUrl, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'image_links': imageUrl } }
  Post.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, post) {
    if (err) callback(new Error(err))
    return callback(null, post)
  })
}

// Remove Image
module.exports.removeImage = function (id, imageUrl, callback) {
  var query = { '_id': id }
  var updateQuery = { '$pull': { 'image_links': imageUrl } }
  Post.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, post) {
    if (err) callback(new Error(err))
    return callback(null, post)
  })
}

// Add Video
module.exports.addVideo = function (id, videoUrl, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'video_links': videoUrl } }
  Post.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, post) {
    if (err) callback(new Error(err))
    return callback(null, post)
  })
}

// Remove Video
module.exports.removeVideo = function (id, videoUrl, callback) {
  var query = { '_id': id }
  var updateQuery = { '$pull': { 'video_links': videoUrl } }
  Post.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, post) {
    if (err) callback(new Error(err))
    return callback(null, post)
  })
}

// Create Post
module.exports.createPost = function (newPost, callback) {
  newPost.save(callback)
}
