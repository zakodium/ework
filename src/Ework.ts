import { Worker } from 'worker_threads';

import {
  numCpus,
  makeWorkerCode,
  spawnWorker,
  addWorkerListener,
} from './worker';

export type Eworker<Input, Output> = (value: Input) => Output | Promise<Output>;

export interface IEworkOptions {
  /**
   * Maximum number of workers that will be spawned. This number must be at least
   * one and is only taken into account if smaller than the number of CPUs.
   * Default: number of logical CPUs.
   */
  maxWorkers?: number;
  /**
   * Minimum number of CPU threads that will be kept free.
   * Along with `maxWorkers`, this will determine the number of workers that will
   * be spawned. If there is only one CPU, this option is ignored and one worker
   * will be spawned.
   * Default: 1.
   */
  minFreeThreads?: number;
}

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

interface IWorkerMessage<Output> {
  id: number;
  type: 'result';
  status: 'success' | 'error';
  result?: Output;
  error?: any;
}

export class Ework<Input, Output> {
  private totalWorkers: number;
  private freeWorkers: number;
  private workers: IWorker<Input, Output>[];
  private queue: IWorkerJob<Input, Output>[];
  private nextWorkId: number;

  public constructor(
    worker: Eworker<Input, Output>,
    options: IEworkOptions = {},
  ) {
    if (typeof worker !== 'function') {
      throw new TypeError('worker must be a function');
    }
    if (typeof options !== 'object' || options === null) {
      throw new TypeError('options must be an object');
    }

    const { maxWorkers = numCpus, minFreeThreads = 1 } = options;

    if (!Number.isInteger(maxWorkers) || maxWorkers < 1) {
      throw new RangeError('options.maxWorkers must be a positive integer');
    }
    if (!Number.isInteger(minFreeThreads) || minFreeThreads < 0) {
      throw new RangeError(
        'options.minFreeThreads must be a positive integer or 0',
      );
    }

    const workerString = worker.toString();
    const workerCode = makeWorkerCode(workerString);

    this.totalWorkers = Math.max(
      Math.min(maxWorkers, numCpus - minFreeThreads),
      1,
    );
    this.freeWorkers = this.totalWorkers;

    this.workers = [];
    for (let i = 0; i < this.totalWorkers; i++) {
      const worker = spawnWorker(workerCode);
      const workerObj: IWorker<Input, Output> = {
        worker,
        isWorking: false,
        job: null,
      };
      addWorkerListener(
        worker,
        'message',
        (message: IWorkerMessage<Output>) => {
          if (message.type === 'result') {
            const job = workerObj.job;
            if (job === null) {
              throw new Error('UNREACHABLE');
            }
            if (job.id !== message.id) {
              throw new Error('UNREACHABLE');
            }
            if (message.status === 'success') {
              if (message.result === undefined) {
                throw new Error('UNREACHABLE');
              }
              job.resolve(message.result);
            } else {
              job.reject(new Error(message.error));
            }
            workerObj.job = null;
            workerObj.isWorking = false;
            this.freeWorkers++;
            this.run();
          }
        },
      );
      this.workers.push(workerObj);
    }

    this.queue = [];
    this.nextWorkId = 0;
  }

  public async execute(value: Input): Promise<Output> {
    return this.enqueue(value);
  }

  public async terminate(): Promise<void> {
    await Promise.all(
      this.workers.map(
        (w) =>
          new Promise((resolve) => {
            w.worker.terminate(() => resolve());
            if (w.job !== null) {
              w.job.reject(new Error('worker terminated'));
            }
          }),
      ),
    );
    this.freeWorkers = 0;
    this.queue = [];
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
