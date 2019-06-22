import { Ework } from '..';

describe('execute', () => {
  it('should execute the job', async () => {
    function toUpperCase(value: string): string {
      return value.toUpperCase();
    }
    const worker = new Ework(toUpperCase);
    const result = await worker.execute('test');
    expect(result).toBe('TEST');
    worker.terminate();
  });

  it('should reject in case of error', async () => {
    function throwError(): never {
      throw new Error('boom');
    }
    const worker = new Ework(throwError);
    await expect(worker.execute('hello')).rejects.toThrow(/boom/);
    worker.terminate();
  });
});

describe('map', () => {
  it('should map an array of values', async () => {
    function double(value: number): number {
      return value * 2;
    }
    const worker = new Ework(double);
    const result = await worker.map([0, 1, 2, 3]);
    expect(result).toStrictEqual([0, 2, 4, 6]);
    worker.terminate();
  });

  it('should reject in case of error', async () => {
    function mabyePlusOne(value: number): number {
      if (value < 5) return value + 1;
      throw new Error('value must be smaller than 5');
    }
    const worker = new Ework(mabyePlusOne);
    await expect(worker.map([4, 5, 6])).rejects.toThrow(
      /value must be smaller than 5/,
    );
    worker.terminate();
  });
});
