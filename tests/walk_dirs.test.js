var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var test = require('./_test')
var klaw = require('../')
var fixtures = require('./fixtures')

test('should walk 2 root directories', function (t, testDir) {
  var children = ['a/child', 'child2', 'child3']
  children.forEach(function (child) {
    fixtures.forEach(function (f) {
      f = path.join(testDir, child, f)
      var dir = path.dirname(f)
      mkdirp.sync(dir)
      fs.writeFileSync(f, path.basename(f, path.extname(f)))
    })
  })

  var items = []
  klaw(children.map(function (child) { return path.join(testDir, child) }))
    .on('data', function (item) {
      items.push(item.path)
    })
    .on('error', t.end)
    .on('end', function () {
      items.sort()
      var expected = ['a', 'a/b', 'a/b/c', 'a/b/c/d.txt', 'a/e.jpg', 'h', 'h/i', 'h/i/j',
        'h/i/j/k.txt', 'h/i/l.txt', 'h/i/m.jpg']
      var fullExpected = []
      children.forEach(function (child) {
        fullExpected.push(path.join(testDir, child))
        expected.forEach(function (item) {
          fullExpected.push(path.join(testDir, child, item))
        })
      })

      t.same(items, fullExpected)
      t.end()
    })
})
