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
  var defaultOpts = { queueMethod: 'shift', pathSorter: undefined, filter: undefined, depthLimit: undefined }
  options = Object.assign(defaultOpts, options, defaultStreamOptions)

  Readable.call(this, options)
  this.roots = dirs.map(function (dir) {
    return path.resolve(dir)
  })
  this.paths = []
  this.options = options
  this.fs = options.fs || require('graceful-fs')
  this.log = options.log === undefined ? console.error : options.log
  this.onlyReadable = options.onlyReadable === undefined ? true : options.onlyReadable
}
util.inherits(Walker, Readable)

Walker.prototype._read = function () {
  this.iterate()
}

Walker.prototype.iterate = function () {
  if (this.paths.length === 0 && this.roots.length > 0) {
    this.root = this.roots.shift()
    this.paths.push(this.root)
    if (this.options.depthLimit > -1) this.rootDepth = this.root.split(path.sep).length + 1
  }

  if (this.paths.length === 0) return this.push(null)
  var self = this
  var pathItem = this.paths[this.options.queueMethod]()

  self.fs.lstat(pathItem, function (err, stats) {
    var item = { path: pathItem, stats: stats }
    if (err) {
      if (self.log) {
        self.log('safe-fs-walk - Failed to perform lstat on directory ' + pathItem, err)
      }
      return self.iterate()
    }

    if (!stats.isDirectory()) {
      if (self.onlyReadable) {
        self.fs.access(pathItem, self.fs.constants.R_OK, function (err) {
          if (err) {
            if (self.log) {
              self.log('safe-fs-walk - File is not readable ' + item, err)
            }
            return self.iterate()
          }
          self.push(item)
        })
      } else {
        self.push(item)
      }
      return
    }

    if ((self.rootDepth &&
      pathItem.split(path.sep).length - self.rootDepth >= self.options.depthLimit)) {
      return self.push(item)
    }

    self.fs.readdir(pathItem, function (err, pathItems) {
      if (err) {
        self.push(item)
        if (self.log) {
          self.log('safe-fs-walk - Failed to perform readdir on directory ' + pathItem, err)
        }
        return self.iterate()
      }

      pathItems = pathItems.map(function (part) { return path.join(pathItem, part) })
      if (self.options.filter) pathItems = pathItems.filter(self.options.filter)
      if (self.options.pathSorter) pathItems.sort(self.options.pathSorter)
      // faster way to do do incremental batch array pushes
      self.paths.push.apply(self.paths, pathItems)

      self.push(item)
    })
  })
}

function walk (root, options) {
  return new Walker(root, options)
}

module.exports = walk
