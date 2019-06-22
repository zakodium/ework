import { cpus } from 'os';

// eslint-disable-next-line import/no-unresolved
import { Worker } from 'worker_threads';

type Eworker<Input, Output> = (value: Input) => Output;
type WorkerResolveFn<Output> = (result: Output) => void;
type WorkerRejectFn = (reason: unknown) => void;

interface IWorker<Input, Output> {
  worker: Worker;
  isWorking: boolean;
  job: IWorkerJob<Input, Output> | null;
}

interface IWorkerJob<Input, Output> {
  id: number;
  value: Input;
  resolve: WorkerResolveFn<Output>;
  reject: WorkerRejectFn;
}

const numCpus = cpus().length;

export class Ework<Input, Output> {
  private totalWorkers: number;
  private freeWorkers: number;
  private workers: IWorker<Input, Output>[];
  private queue: IWorkerJob<Input, Output>[];
  private nextWorkId: number;

  public constructor(worker: Eworker<Input, Output>) {
    const workerString = worker.toString();
    const workerCode = makeWorkerCode(workerString);

    this.totalWorkers = Math.max(numCpus - 1, 2);
    this.freeWorkers = this.totalWorkers;

    this.workers = [];
    for (let i = 0; i < this.totalWorkers; i++) {
      const worker = new Worker(workerCode, { eval: true });
      const workerObj: IWorker<Input, Output> = {
        worker,
        isWorking: false,
        job: null,
      };
      worker.on('message', (message) => {
        if (message.type === 'result') {
          const job = workerObj.job;
          if (job === null) {
            throw new Error('UNREACHABLE');
          }
          if (job.id !== message.id) {
            throw new Error('UNREACHABLE');
          }
          if (message.status === 'success') {
            job.resolve(message.result);
          } else {
            job.reject(new Error(message.error));
          }
          workerObj.job = null;
          workerObj.isWorking = false;
          this.freeWorkers++;
          this.run();
        }
      });
      this.workers.push(workerObj);
    }

    this.queue = [];
    this.nextWorkId = 0;
  }

  public async execute(value: Input): Promise<Output> {
    return this.enqueue(value);
  }

  public terminate(): void {
    this.workers.forEach((w) => {
      w.worker.terminate();
      if (w.job !== null) {
        w.job.reject(new Error('worker terminated'));
      }
    });
    this.workers = [];
  }

  public async map(values: Input[]): Promise<Output[]> {
    return Promise.all(values.map((value) => this.enqueue(value)));
  }

  private enqueue(value: Input): Promise<Output> {
    let resolve: WorkerResolveFn<Output>;
    let reject: WorkerRejectFn;
    const promise = new Promise<Output>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const workload: IWorkerJob<Input, Output> = {
      id: this.nextWorkId++,
      value,
      // @ts-ignore
      resolve,
      // @ts-ignore
      reject,
    };
    this.queue.push(workload);
    this.run();
    return promise;
  }

  private run(): void {
    while (this.freeWorkers > 0 && this.queue.length > 0) {
      const nextJob = this.queue.shift();
      if (nextJob === undefined) {
        throw new Error('UNREACHABLE');
      }
      const worker = this.getFreeWorker();
      worker.worker.postMessage({
        id: nextJob.id,
        type: 'work',
        value: nextJob.value,
      });
      worker.job = nextJob;
      worker.isWorking = true;
      this.freeWorkers--;
    }
  }

  private getFreeWorker(): IWorker<Input, Output> {
    const worker = this.workers.find((w) => !w.isWorking);
    if (worker === undefined) {
      throw new Error('UNREACHABLE');
    }
    return worker;
  }
}

function makeWorkerCode(workerString: string): string {
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
