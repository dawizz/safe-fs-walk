# safe-fs-walk

Another file system walker for node forked from [node-klaw](https://github.com/jprichardson/node-klaw) with safety in mind. This walker will not stop on system errors.

See the original [node-klaw](https://github.com/jprichardson/node-klaw) project for documentation of options.

The main difference is in error management : this crawler will do its best to prevent errors in your program due to permissions or other system errors and will just keep walking.

Additional options:
  - log (default=console.error): logger.error will be used to log file system errors. Pass null to be silent (errors will neither be emitted nor logged).
  - onlyReadable (default=true): do not emit paths of files that can not be read.
