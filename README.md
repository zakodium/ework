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

## API

### `new Ework(executor[, options])`

#### `executor`

Must be a function or async function. It will receive the argument passed to
`execute()`. The code of this function will be passed to the worker, but not
its context, so it shouldn't use variables from its surrounding scope.

#### `options`

An object with the following optional properties:

- `init`: Function  
  Initialization function that will be executed after spawning the worker and
  before sending jobs to it. If the function returns a Promise, it will be awaited.
- `initData`: any  
  Optional data passed to the init function of each spawned worker.
- `numWorkers`: number  
  Number of workers to spawn. If this option is specified, `maxWorkers` and
  `minFreeThreds` will be ignored.
- `maxWorkers`: number (Default: number of logical CPUs)  
  Maximum number of workers that will be spawned. This number must be at least
  one and is only taken into account if smaller than the total number of CPUs.
- `minFreeThreads`: number (Default: 1)  
  Minimum number of CPU threads that will be kept free.
  Along with `maxWorkers`, this will determine the number of workers that will
  be spawned. If there is only one CPU, this option is ignored and one worker
  will be spawned.

### `Ework#execute(value)`

Run the executor on one of the free workers with the passed value. Returns a
Promise that will be resolved with the value returned from the executor. If no
worker is free, the call is added to a FIFO queue.

### `Ework#map(iterable)`

Send each value of the iterable to the executor. Once every value was processed,
resolves with an array of results.

### `Ework#terminate`

Terminate all the spawned workers. This must be called to cleanup if the ework
instance won't be used anymore.

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/ework.svg
[npm-url]: https://www.npmjs.com/package/ework
[ci-image]: https://github.com/zakodium/ework/workflows/Node.js%20CI/badge.svg?branch=master
[ci-url]: https://github.com/zakodium/ework/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/ework.svg
[download-url]: https://www.npmjs.com/package/ework
