var fs = require('fs')
var path = require('path')
var test = require('./_test')
var klaw = require('../')

test('walk directory, if non readable file ignore it', function (t, testDir) {
  // simulate directory issue
  var unreadableFile = path.join(testDir, 'unreadable-file.txt')
  fs.writeFileSync(unreadableFile, 'test')
  fs.chmodSync(unreadableFile, '0222')

  // not able to simulate on windows
  if (process.platform === 'win32') return t.end()

  t.plan(1)
  klaw(testDir)
    .on('data', function (item) {
      if (item.path === unreadableFile) t.fail('do not emit non readable file')
    })
    .on('error', function () {
      t.fail('do not emit error')
    })
    .on('end', function () {
      t.true(true, 'be sure we end')
      t.end()
    })
})
