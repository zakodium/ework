'use strict';

if (process.env.IS_CHILD) {
  const parser = require('papaparse');
  process.on('message', (data) => {
    process.send(parser.parse(data));
  });
} else {
  const childProcess = require('child_process');

  const proc = childProcess.fork(__filename, [], {
    env: { IS_CHILD: true },
    serialization: 'advanced',
  });

  function child(data) {
    return new Promise((resolve) => {
      proc.once('message', resolve);
      proc.send(data);
    });
  }

  module.exports = child;
}
