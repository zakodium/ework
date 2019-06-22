/* eslint-env browser */

export const numCpus = navigator.hardwareConcurrency || 1;

export function spawnWorker(workerCode: string): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

export function addWorkerListener(
  worker: Worker,
  type: string,
  listener: Function,
): void {
  // @ts-ignore
  worker.addEventListener(type, (event) => listener(event.data));
}

export function makeWorkerCode(workerString: string): string {
  return `'use strict';

const workerFunction = ${workerString};

self.onmessage = async (event) => {
  const { data: message } = event;
  if (message.type === 'work') {
    try {
      const result = await workerFunction(message.value);
      self.postMessage({
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
        self.postMessage({
          id: message.id,
          type: 'result',
          status: 'error',
          error: errorToTransfer
        });
      } catch (e) {
        self.postMessage({
          id: message.id,
          type: 'result',
          status: 'error',
          error: 'Work failed but error could not be transferred: ' + e.message
        });
      }
    }
  }
};
  `;
}
