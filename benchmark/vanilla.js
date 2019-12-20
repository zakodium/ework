'use strict';

const parser = require('papaparse');

async function vanilla(data) {
  return parser.parse(data);
}

module.exports = vanilla;
