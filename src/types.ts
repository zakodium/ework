import { Worker } from 'worker_threads';

export interface IWorker<Input, Output> {
  worker: Worker;
  isWorking: boolean;
  job: IWorkerJob<Input, Output> | null;
}

export interface IWorkerJob<Input, Output> {
  id: number;
  value: Input;
  resolve: WorkerResolveFn<Output>;
  reject: WorkerRejectFn;
}

export type WorkerResolveFn<Output> = (result: Output) => void;
export type WorkerRejectFn = (reason: unknown) => void;

export type IWorkerMessage<Output> =
  | {
      type: 'result';
      id: number;
      status: 'success';
      result: Output;
    }
  | {
      type: 'result';
      id: number;
      status: 'error';
      error: string;
    }
  | {
      type: 'init';
      status: 'success';
    }
  | {
      type: 'init';
      status: 'error';
      error: string;
    };
