'use strict';

const fs = require('fs');

const child = require('./child');
const ework = require('./ework');
const vanilla = require('./vanilla');

const data = fs.readFileSync(__dirname + '/data.csv', 'utf8');

vanilla(data).then(console.log);
