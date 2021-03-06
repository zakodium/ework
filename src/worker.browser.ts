import { IWorker } from './types';

/* eslint-env browser */

export const numCpus = navigator.hardwareConcurrency || 1;

export function spawnWorker(workerCode: string): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

export async function terminateWorker<Input, Output>(
  worker: IWorker<Input, Output>,
): Promise<void> {
  await worker.worker.terminate();
}

export function addWorkerListener(
  worker: Worker,
  type: string,
  listener: Function,
): void {
  // @ts-ignore
  worker.addEventListener(type, (event) => listener(event.data));
}

export function makeWorkerCode(
  initString: string,
  workerString: string,
): string {
  return `
const initFunction = ${initString};
const workerFunction = ${workerString};
const messagePort = self;

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

messagePort.onmessage = async (event) => {
  const { data: message } = event;
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
};
`;
}
