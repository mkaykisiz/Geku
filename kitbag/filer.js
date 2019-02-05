// const express = require('express');
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const config = require('../config')

aws.config.update({
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  region: config.AWS_REGION
})

const s3 = new aws.S3()

module.exports.upload = multer({
  storage: multerS3({
    acl: 'public-read',
    s3,
    bucket: config.AWS_BUCKET,
    key: function (req, file, cb) {
      console.log(req.file_path + file.originalname)
      cb(null, req.file_path + file.originalname)
    }
  })
})

module.exports.deleteItem = function (item, callback) {
  if (!item) return callback(null, item)
  item = item.split(config.AWS_PATH).pop()
  var params = {
    Bucket: config.AWS_BUCKET,
    Delete: {
      Objects: [{ Key: item }],
      Quiet: false
    }
  }

  s3.deleteObjects(params, function (err, data) {
    if (err) return callback(new Error(err))
    return callback(null, data)
  })
}
