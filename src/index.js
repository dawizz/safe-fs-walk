var assert = require('assert')
var path = require('path')
var Readable = require('stream').Readable
var util = require('util')

function Walker (dirs, options) {
  if (typeof dirs === 'string') dirs = [dirs]
  assert.ok(Array.isArray(dirs), 'First parameter should be a string of an array.')
  dirs.forEach(function (dir) {
    assert.strictEqual(typeof dir, 'string', 'Item in the array should be of type string. Got type: ' + typeof dir)
  })
  var defaultStreamOptions = { objectMode: true }
  var defaultOpts = { queueMethod: 'pop', filter: undefined, depthLimit: undefined }
  options = Object.assign(defaultOpts, options, defaultStreamOptions)

  Readable.call(this, options)
  this.roots = dirs.map(function (dir) {
    return path.resolve(dir)
  })
  this.paths = []
  this.options = options
  const fs = this.fs = options.fs || require('graceful-fs')
  this.lstat = util.promisify(fs.lstat)
  this.access = util.promisify(fs.access)
  this.readdir = util.promisify(fs.readdir)

  this.log = options.log === undefined ? console.error : options.log
  this.onlyReadable = options.onlyReadable === undefined ? true : options.onlyReadable
}
util.inherits(Walker, Readable)

Walker.prototype._read = async function () {
  let iterationOk = false
  // If iterate return an item we push it and _read will be called again
  // if it returns null we will stop
  // if it fails on current item we keep iterating
  while (!iterationOk) {
    try {
      this.push(await this.iterate())
      iterationOk = true
    } catch (err) {
      // error is arlready logged
    }
  }
}

Walker.prototype.iterate = async function () {
  if (this.paths.length === 0 && this.roots.length > 0) {
    this.root = this.roots.shift()
    this.paths.push(this.root)
    if (this.options.depthLimit > -1) this.rootDepth = this.root.split(path.sep).length + 1
  }

  if (this.paths.length === 0) return null
  const pathItem = this.paths[this.options.queueMethod]()

  let stats
  try {
    stats = await this.lstat(pathItem)
  } catch (err) {
    if (this.log) {
      this.log('safe-fs-walk - Failed to perform lstat on directory ' + pathItem, err)
    }
    throw err
  }
  var item = { path: pathItem, stats: stats }
  if (!stats.isDirectory()) {
    if (!this.onlyReadable) {
      return item
    }
    try {
      await this.access(pathItem, this.fs.constants.R_OK)
    } catch (err) {
      if (this.log) {
        this.log('safe-fs-walk - File is not readable ' + pathItem, err)
      }
      throw err
    }
    return item
  }

  // If we attained max depth we do not recurse in the folder
  if ((this.rootDepth &&
    pathItem.split(path.sep).length - this.rootDepth >= this.options.depthLimit)) {
    return item
  }

  // List directory children
  let pathItems
  try {
    pathItems = await this.readdir(pathItem)
  } catch (err) {
    if (this.log) {
      this.log('safe-fs-walk - Failed to perform readdir on directory ' + pathItem, err)
    }
    throw err
  }

  pathItems = pathItems.map((part) => path.join(pathItem, part))
  if (this.options.filter) pathItems = pathItems.filter(this.options.filter)
  // faster way to do do incremental batch array pushes
  this.paths.push.apply(this.paths, pathItems)
  return item
}

function walk (root, options) {
  return new Walker(root, options)
}

module.exports = walk
