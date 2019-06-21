// eslint-disable-next-line import/no-unresolved
import { Worker } from 'worker_threads';

type Eworker<Input, Output> = (value: Input) => Output;

export class Ework<Input, Output> {
  private work: Eworker<Input, Output>;
  private workers: Worker[];

  public constructor(worker: Eworker<Input, Output>) {
    this.work = worker;
    this.workers = [];
  }

  public async execute(value: Input): Promise<Output> {
    return this.work(value);
  }

  public async map(values: Input[]): Promise<Output[]> {
    return values.map((value) => this.work(value));
  }
}
