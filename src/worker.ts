import { cpus } from 'os';

import { Worker } from 'worker_threads';

import { IWorker } from './Ework';

const cpuList = cpus();

export const numCpus = cpuList ? cpuList.length : 1;

export function spawnWorker(workerCode: string): Worker {
  return new Worker(workerCode, { eval: true });
}

export function terminateWorker<Input, Output>(
  worker: IWorker<Input, Output>,
): Promise<void> {
  return new Promise((resolve) => {
    worker.worker.terminate(() => resolve());
    if (worker.job !== null) {
      worker.job.reject(new Error('worker terminated'));
    }
  });
}

export function addWorkerListener(
  worker: Worker,
  type: string,
  listener: any,
): void {
  worker.addListener(type, listener);
}

export function makeWorkerCode(
  initString: string,
  workerString: string,
): string {
  return `'use strict';

const { parentPort } = require('worker_threads');

const initFunction = ${initString};
const workerFunction = ${workerString};
const messagePort = parentPort;

function postError(obj, error) {
  let errorToTransfer = error;
  if (error) {
    if (error.stack) {
      errorToTransfer = error.stack;
    } else if (error.message) {
      errorToTransfer = error.message;
    }
  }
  try {
    messagePort.postMessage(Object.assign({}, obj, {
      status: 'error',
      error: errorToTransfer
    }));
  } catch (e) {
    messagePort.postMessage({
      status: 'error',
      error: 'Work failed but error could not be transferred: ' + e.message
    });
  }
}

messagePort.on('message', async (message) => {
  if (message.type === 'work') {
    try {
      const result = await workerFunction(message.value);
      messagePort.postMessage({
        id: message.id,
        type: 'result',
        status: 'success',
        result
      });
    } catch (error) {
      postError({
        id: message.id,
        type: 'result'
      }, error);
    }
  } else if (message.type === 'init') {
    try {
      await initFunction();
      messagePort.postMessage({
        type: 'init',
        status: 'success'
      });
    } catch (error) {
      postError({
        type: 'init'
      }, error);
    }
  }
});
`;
}
