'use strict';

const fs = require('fs');

const child = require('./child');
const ework = require('./ework');
const vanilla = require('./vanilla');

const data = fs.readFileSync(__dirname + '/data.csv', 'utf8');

async function test(func) {
  console.time(func.name);
  const tests = [];
  for (var i = 0; i < 50; i++) {
    tests.push(func(data));
  }
  await Promise.all(tests);
  console.timeEnd(func.name);
}

async function testAll() {
  await test(vanilla);
  await test(child);
  await test(ework);
}

testAll();
