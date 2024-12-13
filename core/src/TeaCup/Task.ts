/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { Cmd } from './Cmd';
import { Dispatcher } from './Dispatcher';
import { err, Err, ok, Ok, Result } from './Result';
import { just, Maybe, nothing } from './Maybe';
import { asError } from './Try';

/**
 * Base class for Tasks.
 */
export abstract class Task<E, R> {
  /**
   * To be implemented by concrete Tasks.
   * @param callback the callback to call when the task is ran
   */
  abstract execute(callback: (r: Result<E, R>) => void): void;

  /**
   * Send a Task to the runtime for execution
   * @param t the task
   * @param toMsg a function that turns the result of the task into a Msg
   */
  static attempt<E, R, M>(t: Task<E, R>, toMsg: (r: Result<E, R>) => M): Cmd<M> {
    return new TaskCmd(t, toMsg);
  }

  /**
   * Send a Task that never fails to the runtime for execution
   * @param t the task
   * @param toMsg a function that turns the result of the task into a Msg
   */
  static perform<R, M>(t: Task<never, R>, toMsg: (r: R) => M): Cmd<M> {
    return new TaskNoErrCmd(t, toMsg);
  }

  /**
   * Create a task that succeeds with a value
   * @param r the value
   */
  static succeed<R>(r: R): Task<never, R> {
    return new TSuccess(() => r);
  }

  /**
   * Create a task that succeeds with a lazily-supplied value
   * @param r the value supplier
   */
  static succeedLazy<R>(r: () => R): Task<never, R> {
    return new TSuccess(r);
  }

  /**
   * Create a task that fails with an error
   * @param e the error
   */
  static fail<E>(e: E): Task<E, never> {
    return new TError(() => e);
  }

  /**
   * Create a task that fails with a lazily-supplied error
   * @param e the error supplier
   */
  static failLazy<E>(e: () => E): Task<E, never> {
    return new TError(e);
  }

  /**
   * Create a task from a Promise
   * @param promiseSupplier a function that returns the promise (will be called on Task execution)
   */
  static fromPromise<R>(promiseSupplier: PromiseSupplier<R>): Task<any, R> {
    return new TPromise(promiseSupplier);
  }

  /**
   * Create a task from a supplier (lazy). Will return an error if the lambda throws an error.
   */
  static fromLambda<R>(lambda: () => R): Task<Error, R> {
    return new TLambda(lambda);
  }

  /**
   * Map the ok result of this task
   * @param f the mapping function
   */
  map<R2>(f: (r: R) => R2): Task<E, R2> {
    return new TMapped(this, f);
  }

  /**
   * Map the error result of this task
   * @param f the mapping function
   */
  mapError<E2>(f: (e: E) => E2): Task<E2, R> {
    return new TMappedErr(this, f);
  }

  /**
   * Recover from error (turns error into a success !)
   * @param f the error-to-success converter
   */
  recover(f: (e: E) => R): Task<never, R> {
    return new TRecover(this, f);
  }

  /**
   * Chain this task with another task
   * @param f a function that accepts the result of this task, and yields a new task
   */
  andThen<R2>(f: (r: R) => Task<E, R2>): Task<E, R2> {
    return new TThen(this, f);
  }

  /**
   * Runs tasks in parallel
   * @param t the task to be run in parallel with this task
   * @param f a function that maps the results of the 2 parallel tasks
   */
  parallel<T2, R2>(t: Task<E, T2>, f: (a: R, b: T2) => R2): Task<E, R2> {
    return new TParallel<E, R2, R, T2>(f, this, t);
  }
}

class TRecover<E, R> extends Task<never, R> {
  constructor(private readonly t: Task<E, R>, private readonly f: (e: E) => R) {
    super();
  }

  execute(callback: (r: Result<never, R>) => void): void {
    this.t.execute((tRes) =>
      tRes.match(
        (tOk) => callback(ok(tOk)),
        (tErr) => callback(ok(this.f(tErr))),
      ),
    );
  }
}

class TParallel<E, R, A, B> extends Task<E, R> {
  constructor(private readonly f: (a: A, b: B) => R, private readonly t1: Task<E, A>, private readonly t2: Task<E, B>) {
    super();
  }

  execute(callback: (r: Result<E, R>) => void): void {
    let ra: Maybe<A> = nothing;
    let rb: Maybe<B> = nothing;
    let error: Maybe<E> = nothing;

    const done = () => {
      if (error.type !== 'Nothing' || ra.type === 'Nothing' || rb.type === 'Nothing') {
        return;
      }
      callback(ok(this.f(ra.value, rb.value)));
    };

    function handle<X>(t: Task<E, X>, assign: (x: X) => void) {
      t.execute((r: Result<E, X>) => {
        switch (r.tag) {
          case 'Err': {
            if (error?.isNothing()) {
              callback(err(r.err));
              error = just(r.err);
            }
            break;
          }
          case 'Ok': {
            assign(r.value);
            done();
            break;
          }
        }
      });
    }

    handle(this.t1, (x) => (ra = just(x)));
    handle(this.t2, (x) => (rb = just(x)));
  }
}

class TLambda<R> extends Task<Error, R> {
  private readonly f: () => R;

  constructor(f: () => R) {
    super();
    this.f = f;
  }

  execute(callback: (r: Result<Error, R>) => void): void {
    try {
      callback(ok(this.f()));
    } catch (e) {
      callback(err(asError(e)));
    }
  }
}

export type PromiseSupplier<T> = () => Promise<T>;

class TPromise<R> extends Task<any, R> {
  private readonly p: PromiseSupplier<R>;

  constructor(p: PromiseSupplier<R>) {
    super();
    this.p = p;
  }

  execute(callback: (r: Result<any, R>) => void): void {
    this.p()
      .then(
        (r: R) => callback(ok(r)),
        (e: any) => callback(err(e)),
      )
      .catch((e) => callback(err(e)));
  }
}

class TThen<E, R, R2> extends Task<E, R2> {
  private readonly task: Task<E, R>;
  private readonly f: (r: R) => Task<E, R2>;

  constructor(task: Task<E, R>, f: (r: R) => Task<E, R2>) {
    super();
    this.task = task;
    this.f = f;
  }

  execute(callback: (r: Result<E, R2>) => void): void {
    this.task.execute((r: Result<E, R>) => {
      r.match(
        (r: R) => {
          const next = this.f(r);
          next.execute(callback);
        },
        (e: E) => {
          callback(new Err(e));
        },
      );
    });
  }
}

class TMapped<E, R, R2> extends Task<E, R2> {
  private readonly task: Task<E, R>;
  private readonly mapper: (r: R) => R2;

  constructor(task: Task<E, R>, mapper: (r: R) => R2) {
    super();
    this.task = task;
    this.mapper = mapper;
  }

  execute(callback: (r: Result<E, R2>) => void): void {
    this.task.execute((r: Result<E, R>) => {
      callback(r.map(this.mapper));
    });
  }
}

class TMappedErr<E, R, E2> extends Task<E2, R> {
  private readonly task: Task<E, R>;
  private readonly mapper: (e: E) => E2;

  constructor(task: Task<E, R>, mapper: (e: E) => E2) {
    super();
    this.task = task;
    this.mapper = mapper;
  }

  execute(callback: (r: Result<E2, R>) => void): void {
    this.task.execute((r: Result<E, R>) => {
      callback(r.mapError(this.mapper));
    });
  }
}

class TSuccess<R> extends Task<never, R> {
  private readonly result: () => R;

  constructor(result: () => R) {
    super();
    this.result = result;
  }

  execute(callback: (r: Result<never, R>) => void): void {
    callback(ok(this.result()));
  }
}

class TError<E> extends Task<E, never> {
  private readonly err: () => E;

  constructor(err: () => E) {
    super();
    this.err = err;
  }

  execute(callback: (r: Result<E, never>) => void): void {
    callback(err(this.err()));
  }
}

class TaskCmd<E, R, M> extends Cmd<M> {
  readonly task: Task<E, R>;
  readonly toMsg: (r: Result<E, R>) => M;

  constructor(task: Task<E, R>, toMsg: (r: Result<E, R>) => M) {
    super();
    this.task = task;
    this.toMsg = toMsg;
  }

  execute(dispatch: Dispatcher<M>): void {
    this.task.execute((r: Result<E, R>) => {
      dispatch(this.toMsg(r));
    });
  }
}

class TaskNoErrCmd<R, M> extends Cmd<M> {
  readonly task: Task<void, R>;
  readonly toMsg: (r: R) => M;

  constructor(task: Task<void, R>, toMsg: (r: R) => M) {
    super();
    this.task = task;
    this.toMsg = toMsg;
  }

  execute(dispatch: Dispatcher<M>): void {
    this.task.execute((r: Result<void, R>) => {
      r.match(
        (ok: R) => dispatch(this.toMsg(ok)),
        (err: any) => {
          throw Error('got an error from a void task : ' + r + ', ' + err);
        },
      );
    });
  }
}
