# ework

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
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

[npm-image]: https://img.shields.io/npm/v/ework.svg
[npm-url]: https://www.npmjs.com/package/ework
[ci-image]: https://github.com/zakodium/ework/workflows/Node.js%20CI/badge.svg?branch=master
[ci-url]: https://github.com/zakodium/ework/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/ework.svg
[download-url]: https://www.npmjs.com/package/ework
