# safe-fs-walk

Another file system walker for node forked from [node-klaw](https://github.com/jprichardson/node-klaw) with safety in mind. This walker will not stop on system errors.

[![npm Package](https://img.shields.io/npm/v/safe-fs-walk.svg?style=flat-square)](https://www.npmjs.org/package/safe-fs-walk)
[![build status](https://api.travis-ci.org/dawizz/safe-fs-walk.svg)](http://travis-ci.org/dawizz/safe-fs-walk)
[![windows build status](https://ci.appveyor.com/api/projects/status/github/dawizz/safe-fs-walk?branch=master&svg=true)](https://ci.appveyor.com/project/dawizz/safe-fs-walk/branch/master)

Install:

    npm install safe-fs-walk

See the original [node-klaw](https://github.com/jprichardson/node-klaw) project for documentation of usage and options. Simply replace `require('klaw')` with `require('safe-fs-walk')`

The main difference is in error management : this crawler will do its best to prevent errors in your program due to permissions or other system errors and will just keep walking.

Additional options:
  - log (default=console.error): a function that will be used to log errors. Pass null to be silent (errors will neither be emitted nor logged).
  - onlyReadable (default=true): do not emit paths of files that can not be read.
