const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const sendMail = require('../kitbag/mailer')
const config = require('../config')
const upload = require('../kitbag/filer').upload
const deleteStorageItem = require('../kitbag/filer').deleteItem
const User = require('./model')

const singleUpload = upload.single('file_item')

// Create User
router.post('/', (req, res, next) => {
  let newUser = new User(req.body)

  User.createUser(newUser, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    return res.status(201).json(user)
  })
})

// Get User
router.get('/:userId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  User.getUserById(req.params.userId, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    if (req.param.userId !== req.user.id) {
      user = user.toObject()
      user.is_follow = user.followers.includes(req.user.id.toString())
      user.is_followed = user.following.includes(user._id.toString())
    }

    return res.status(200).json(user)
  })
})

// Create Forgot Password Request
router.post('/forgot_password/', (req, res, next) => {
  User.getUserByEmail(req.body.email, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    let forgotPasswordToken = crypto.randomBytes(20).toString('hex')

    User.updateUser(user.id, user.id,
      { 'forgot_password_token': forgotPasswordToken }, (err, updatedUser) => {
        if (err) {
          return res.status(400).json({ msg: err.toString() })
        }
        let content = '<p>Hi <b>' + user.first_name + ' ' +
          user.last_name + '</b>,</p>' +
          '<p>Please confirm your email address for change password.</p>' +
          '<p>' + config.APPFULLPATH + '/users/forgot_password/' + user.id +
          '/' + forgotPasswordToken + '</p>'

        let mailOptions = {
          to: user.email,
          subject: 'I Forgot Password',
          html: content
        }
        sendMail(mailOptions)
        return res.status(200).json({
          msg: 'Forgot Password token sent via email.'
        })
      })
  })
})

// Change Password Via Forgot Password
router.get('/forgot_password/:user_id/:forgot_password_token', (req, res, next) => {
  User.getUserById(req.params.user_id, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found!'
      })
    }

    if (req.params.forgot_password_token && user.forgot_password_token) {
      let newPassword = Math.random().toString(36).substring(7)

      User.changePassword(user, newPassword, (err, updatedUser) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        let content = '<p>Hi <b>' + user.first_name + ' ' +
          user.last_name + '</b>,</p>' +
          '<p>This is your new password. Please Login and change password.</p>' +
          '<p><b>New Password :  </b>' + newPassword + '</p>'

        let mailOptions = {
          to: user.email,
          subject: 'User New Password',
          html: content
        }
        sendMail(mailOptions)
        return res.status(200).json({
          msg: 'Your password sent via email.'
        })
      })
    } else {
      return res.status(404).json({
        msg: 'Wrong token, Please try again!'
      })
    }
  })
})

// Change Password
router.put('/:userId/change_password', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.body.password !== req.body.repeat_password) {
    return res.status(400).json({
      msg: 'Password aren \'t same!'
    })
  }

  User.changePassword(req.user, req.body.password, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    return res.status(200).json(user)
  })
})

// Login
router.post('/login', (req, res, next) => {
  const email = req.body.email
  const password = req.body.password

  User.getUserByEmail(email, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    if (!user.verified) {
      return res.status(400).json({
        msg: 'User not verified'
      })
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(400).json({
          msg: err.toString()
        })
      }

      if (isMatch) {
        const token = jwt.sign({
          user
        }, config.SECRET_KEY, {
          expiresIn: 33868800 // 1 week
        })

        return res.status(201).json({
          token: token,
          user: user
        })
      } else {
        return res.status(400).json({
          msg: 'Wrong password'
        })
      }
    })
  })
})

// Add User Profile Photo
router.post('/:userId/profile_image', passport.authenticate('jwt', {
  session: false
}), function (req, res, next) {
  let userId = req.user._id.toString()
  if (userId.toString() !== req.params.userId) {
    return res.status(401).json({ msg: 'you can only update your own user' })
  }

  req.file_path = 'users/' + userId + '/profile_image/' + Date.now().toString() + '/'

  User.getUserById(req.params.userId, (err, user) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    singleUpload(req, res, function (err, some) {
      if (err) {
        return res.status(400).json()
      }

      User.updateUser(req.params.userId, userId,
        { 'profile_image': req.file.location }, (err, updatedUser) => {
          if (err) {
            return res.status(400).json({ msg: err.toString() })
          }

          deleteStorageItem(user.profile_image, (err, deleted) => {
            if (err) {
              return res.status(400).json({ msg: err.toString() })
            }

            return res.status(200).json(updatedUser)
          })
        })
    })
  })
})

module.exports = router
