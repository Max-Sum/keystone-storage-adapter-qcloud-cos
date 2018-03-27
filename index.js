"use strict";

let assign = require('object-assign');
let nameFunctions = require('keystone-storage-namefunctions');
let ensureCallback = require('keystone-storage-namefunctions/ensureCallback');
let pathlib = require('path');
let cos = require('cos-nodejs-sdk-v5');

let DEFAULT_OPTIONS = {
    secret: process.env.COS_SECRET_ID,
    key: process.env.COS_SECRET_KEY,
    bucket: process.env.COS_BUCKET,
    region: process.env.COS_REGION || 'ap-guangzhou',
    generateFilename: nameFunctions.randomFilename,
};

function COSAdapter(options, schema) {
    this.options = assign({}, DEFAULT_OPTIONS, options.cos);

    this.client = new COS({
        SecretId: this.options.secret,
        SecretKey: this.options.key,
        FileParallelLimit: 3,    // 控制文件上传并发数
        ChunkParallelLimit: 3,   // 控制单个文件下分片上传并发数
        ChunkSize: 8 * 1024 * 1024, // 控制分片大小，单位 B
    });

    // If path is specified it must be absolute.
    if (options.path != null && !pathlib.isAbsolute(options.path)) {
        throw Error('Configuration error: COS path must be absolute');
    }

    // Ensure the generateFilename option takes a callback
    this.options.generateFilename = ensureCallback(this.options.generateFilename);
}

COSAdapter.compatibilityLevel = 1;

// All the extra schema fields supported by this adapter.
COSAdapter.SCHEMA_TYPES = {
    filename: String,
    bucket: String,
    path: String,
};

COSAdapter.SCHEMA_FIELD_DEFAULTS = {
    filename: true,
    bucket: false,
    path: false,
};

COSAdapter.prototype.uploadFile = function (file, callback) {
    this.options.generateFilename(file, 0, (err, filename) => {
        if (err) return callback(err);

        // The expanded path of the file on the filesystem.
        let localpath = file.path;

        file.path = this.options.path[0] == '/' ? this.options.path.substr(1, this.options.path.length) : this.options.path;
        file.filename = filename;
        file.key = file.path + '/' + filename;
        file.bucket = this.config.bucket;

        let uploader = this.client.uploadFiles({
            files: [{
                Bucket: this.config.bucket, // Bucket 格式：test-1250000000
                Region: this.config.region,
                Key: file.key,
                FilePath: localpath,
            }],
            onProgress: (info) => {
                var percent = parseInt(info.percent * 10000) / 100;
                var speed = parseInt(info.speed / 1024 / 1024 * 100) / 100;
                console.log('进度：' + percent + '%; 速度：' + speed + 'Mb/s;');
            },
            onFileFinish: (err, data, options) => {
                if (err) {
                    console.log(options.Key + ' 上传失败', err.stack);
                    callback(new Error(err.stack));
                } else {
                    file.key = data.Key;
                    callback(null, file);
                }
            },
        }, (err, data) => {
            console.log(err || data);
            callback(new Error(err.stack))
        });
    });
};

COSAdapter.prototype.removeFile = function (file, callback) {
	var fullpath = this._resolveFilename(file);
	this.client.deleteObject({
        Bucket: this.config.bucket, // Bucket 格式：test-1250000000
        Region: this.config.region,
        Key: file.key
    }, (err, data) => {
        console.log(err || data);
        callback(new Error(err.stack))
    })
};

COSAdapter.prototype.getFileURL = function (file) {
    return this.client.getObjectUrl({
        Bucket: this.config.bucket, // Bucket 格式：test-1250000000
        Region: this.config.region,
        Key: file.key
    }, (err, data) => {
        console.log(err || data);
    })
};

module.exports = COSAdapter;
