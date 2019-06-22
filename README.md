# ework

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

Ework.

Execute your tasks on another thread or in parallel, with a simple to use and
cross-platform (Node.js >=10 and modern browsers) API.

## Installation

`$ npm i ework`

## Usage

```js
import { Ework } from 'ework';

async function run() {
  const worker = new Ework((value) => value ** 2);
  const value = await worker.execute(6); // 36
  const values = await worker.map([1, 2, 3]); // [1, 4, 9]
  await worker.terminate();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/ework.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/ework
[travis-image]: https://img.shields.io/travis/zakodium/ework/master.svg?style=flat-square
[travis-url]: https://travis-ci.com/zakodium/ework
[codecov-image]: https://img.shields.io/codecov/c/github/zakodium/ework.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/zakodium/ework
[download-image]: https://img.shields.io/npm/dm/ework.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/ework
