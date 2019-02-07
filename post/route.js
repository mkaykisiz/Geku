const express = require('express')
const router = express.Router()
const passport = require('passport')
const upload = require('../kitbag/filer').upload
const deleteStorageItem = require('../kitbag/filer').deleteItem
const Post = require('./model')

const singleUpload = upload.single('file_item')

// Create Post
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  let newPost = new Post(req.body)
  newPost.user_id = req.user._id.toString()

  Post.createPost(newPost, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    } else {
      return res.status(201).json(post)
    }
  })
})

// Get Post by id
router.get('/:postId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }

    return res.status(200).json(post)
  })
})

// List Posts
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.listPosts(req.query, (err, posts) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!posts) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }
    return res.status(200).json(posts)
  })
})

// Like Post
router.post('/:postId/like', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.like(req.params.postId, req.user._id.toString(), (err, updatedPost) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedPost) {
      return res.status(400).json({
        msg: 'Post not updated!'
      })
    }
    return res.status(200).json(updatedPost)
  })
})

// Unlike Post
router.delete('/:postId/like', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.unlike(req.params.postId, req.user._id.toString(), (err, updatedPost) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedPost) {
      return res.status(400).json({
        msg: 'Post not updated!'
      })
    }
    return res.status(200).json(updatedPost)
  })
})

// Delete Post
router.delete('/:postId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.updatePost(req.params.postId, req.user._id.toString(), {
    deleted_at: new Date()
  }, (err, deletedPost) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!deletedPost) {
      return res.status(400).json({
        msg: 'Post not deleted!'
      })
    }
    return res.status(204)
  })
})

// Add Post Image
router.post('/:postId/image', passport.authenticate('jwt', {
  session: false }), function (req, res, next) {
  req.file_path = 'posts/images/' + req.user._id.toString() + '/' + Date.now().toString() + '/'

  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' })
    }

    singleUpload(req, res, function (err, some) {
      if (err) return res.status(400).json()
      Post.addImage(req.params.postId, req.file.location, (err, updatedPost) => {
        if (err) {
          return res.status(400).json({ msg: err.toString() })
        }

        return res.status(200).json(updatedPost)
      })
    })
  })
})

// Delete Post Image
router.delete('/:postId/image', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' })
    }

    Post.removeImage(req.params.postId, req.body.file_item, (err, deletedPostImage) => {
      if (err) {
        return res.status(400).json({ msg: err.toString() })
      }

      if (!deletedPostImage) {
        return res.status(400).json({ msg: 'Post Image not deleted!' })
      }

      deleteStorageItem(req.body.file_item, (err, deleted) => {
        if (err) return res.status(400).json({ msg: err.toString() })
        return res.status(204).json()
      })
    })
  })
})

// Add Post Video
router.post('/:postId/video', passport.authenticate('jwt', {
  session: false }), function (req, res, next) {
  req.file_path = 'posts/videos/' + req.user._id.toString() + '/' + Date.now().toString() + '/'

  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' })
    }

    singleUpload(req, res, function (err, some) {
      if (err) {
        return res.status(400).json()
      }

      Post.addImage(req.params.postId, req.file.location, (err, updatedPost) => {
        if (err) {
          return res.status(400).json({ msg: err.toString() })
        }

        return res.status(200).json(updatedPost)
      })
    })
  })
})

// Delete Post Video
router.delete('/:postId/video', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' })
    }

    Post.removeVideo(req.params.postId, req.body.file_item, (err, deletedPostVideo) => {
      if (err) {
        return res.status(400).json({ msg: err.toString() })
      }

      if (!deletedPostVideo) {
        return res.status(400).json({ msg: 'Post video not deleted!' })
      }

      deleteStorageItem(req.body.file_item, (err, deleted) => {
        if (err) {
          return res.status(400).json({ msg: err.toString() })
        }

        return res.status(204).json()
      })
    })
  })
})

module.exports = router
