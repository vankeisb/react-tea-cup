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

import { Task } from './Task';
import { Result } from './Result';
import { Time } from './Time';
import { expect, test, assert } from "vitest";

test('succeed', () => new Promise<void>(done => {
  expectOk(done, Task.succeed(123), 123);
}));

test('fail', () => new Promise<void>(done => {
  expectErr(done, Task.fail('wtf?'), 'wtf?');
}));

test('map', () => new Promise<void>(done => {
  expectOk(
    done,
    Task.succeed(1).map((i) => i + 1),
    2,
  );
}));

test('mapError', () => new Promise<void>(done => {
  expectErr(
    done,
    Task.fail('wtf').mapError((s) => s + ' is wrong?'),
    'wtf is wrong?',
  );
}));

test('andThen', () => new Promise<void>(done => {
  expectOk(
    done,
    Task.succeed(1).andThen((i: number) => {
      return Task.succeed(i + 10);
    }),
    11,
  );
}));

test('more complex stuff', () => new Promise<void>(done => {
  expectOk(
    done,
    Task.succeed('hello')
      .map((s) => s + ' world')
      .andThen((s) => Task.succeed(s + ' and').map((s) => s + ' people'))
      .map((s) => s + ' and dolphins'),
    'hello world and people and dolphins',
  );
}));

test('more complex stuff with err', () => new Promise<void>(done => {
  expectErr(
    done,
    Task.fail('hello')
      .mapError((s) => s + ' world')
      .andThen((s) => Task.fail(s + ' foo')), // this should not appear ! second task never gets executed
    'hello world',
  );
}));

test('from lambda', () => new Promise<void>(done => {
  const t: Task<Error, number> = Task.fromLambda(() => 123);
  expectOk(done, t, 123);
}));

test('parallel', () => new Promise<void>(done => {
  const t1 = Time.in(1000).map(() => 1);
  const t2 = Time.in(2000).map(() => 2);
  const t3 = Time.in(1000).map(() => 4);
  const p = t1.parallel(t2, (a, b) => a + b).parallel(t3, (a, b) => a + b);
  const t = new Date().getTime();
  perform(p, (x: number) => {
    const elapsed = new Date().getTime() - t;
    expect(x).toBe(7);
    expect(elapsed < 2100).toBeTruthy();
    done();
  });
}));

test('lazy', () => new Promise<void>(done => {
  expectOk(
    done,
    Task.succeedLazy(() => 123),
    123,
  );
  expectErr(
    done,
    Task.failLazy(() => 'kaboom'),
    'kaboom',
  );
}));

test('recover', () => new Promise<void>(done => {
  const t: Task<string, number> = Task.fromLambda(() => {
    throw new Error('kaboom');
  }).mapError((e) => e.message);
  expectErr(done, t, 'kaboom');
  const t2: Task<never, number> = t.recover((e) => e.length);
  expectOk(done, t2, 6);
  const t3: Task<string, number> = t2.andThen(() => Task.succeed(123));
  expectOk(done, t3, 123);
  const t4: Task<string, number> = t3.andThen(() => Task.fail('yalla'));
  expectErr(done, t4, 'yalla');
}));

export function attempt<E, R>(t: Task<E, R>, callback: (r: Result<E, R>) => void) {
  Task.attempt(t, (m) => m).execute(callback);
}

export function perform<R>(t: Task<never, R>, callback: (r: R) => void) {
  Task.perform(t, (m) => m).execute(callback);
}

export function expectOk<E, R>(done: () => void, t: Task<E, R>, r: R) {
  attempt(t, (result) => {
    result.match(
      (res: R) => expect(res).toBe(r),
      () => assert.fail('expected a success'),
    );
    done();
  });
}

export function expectErr<E, R>(done: () => void, t: Task<E, R>, e: E) {
  attempt(t, (result) => {
    result.match(
      (_: R) => assert.fail('expected an error'),
      (err: E) => expect(err).toBe(e),
    );
    done();
  });
}
