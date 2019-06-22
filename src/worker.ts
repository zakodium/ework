import { cpus } from 'os';

import { Worker } from 'worker_threads';

const cpuList = cpus();

export const numCpus = cpuList ? cpuList.length : 1;

export function spawnWorker(workerCode: string): Worker {
  return new Worker(workerCode, { eval: true });
}

export function addWorkerListener(
  worker: Worker,
  type: string,
  listener: any,
): void {
  worker.addListener(type, listener);
}

export function makeWorkerCode(workerString: string): string {
  return `'use strict';

const { parentPort } = require('worker_threads');

const workerFunction = ${workerString};

parentPort.on('message', async (message) => {
  if (message.type === 'work') {
    try {
      const result = await workerFunction(message.value);
      parentPort.postMessage({
        id: message.id,
        type: 'result',
        status: 'success',
        result
      });
    } catch (error) {
      let errorToTransfer = error;
      if (error) {
        if (error.stack) {
          errorToTransfer = error.stack;
        } else if (error.message) {
          errorToTransfer = error.message;
        }
      }
      try {
        parentPort.postMessage({
          id: message.id,
          type: 'result',
          status: 'error',
          error: errorToTransfer
        });
      } catch (e) {
        parentPort.postMessage({
          id: message.id,
          type: 'result',
          status: 'error',
          error: 'Work failed but error could not be transferred: ' + e.message
        });
      }
    }
  }
});
  `;
}
