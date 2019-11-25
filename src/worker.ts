import { cpus } from 'os';
import { Worker } from 'worker_threads';

import { IWorker, IWorkerMessage } from './types';

const cpuList = cpus();

export const numCpus = cpuList ? cpuList.length : 1;

export function spawnWorker(workerCode: string): Worker {
  return new Worker(workerCode, { eval: true });
}

export async function terminateWorker<Input, Output>(
  worker: IWorker<Input, Output>,
): Promise<void> {
  await worker.worker.terminate();
}

export function addWorkerListener(
  worker: Worker,
  type: string,
  listener: (message: IWorkerMessage<any>) => unknown,
): void {
  worker.addListener(type, listener);
}

export function makeWorkerCode(
  initString: string,
  workerString: string,
): string {
  return `
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
      await initFunction(message.value);
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
