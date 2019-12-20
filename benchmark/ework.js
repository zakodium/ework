'use strict';

const { Ework } = require('..');

const worker = new Ework(
  (data) => {
    return this.parser.parse(data);
  },
  {
    init: function init() {
      this.parser = require('papaparse');
    },
    numWorkers: 5,
  },
);

async function ework(data) {
  return worker.execute(data);
}

module.exports = ework;
