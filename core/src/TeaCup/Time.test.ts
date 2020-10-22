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

import { Time } from './Time';
import { expectErr, expectOk, perform } from './Task.test';
import { Task } from './Task';

const margin = 10;

test('now', (done) => {
  const now = new Date().getTime();
  perform(Time.now(), (r) => {
    expect(r - now).toBeLessThan(margin);
    done();
  });
});

test('in', (done) => {
  const now = new Date().getTime();
  const timeout = 500;
  perform(Time.in(timeout), (r) => {
    const elapsed = r - now;
    expect(elapsed).toBeLessThan(timeout + margin);
    expect(elapsed).toBeGreaterThanOrEqual(timeout);
    done();
  });
});

test('Time is chainable with success', (done) => {
  const t1: Task<never, number> = Time.now();
  const t2: Task<Error, string> = Task.fromLambda(() => 'test');
  const t: Task<never|Error, string> = t1.andThen(() => t2);
  expectOk(done, t, 'test')
});

test('Time is chainable with success', (done) => {
  const err = new Error('test');
  const t1: Task<never, number> = Time.now();
  const t2: Task<Error, string> = Task.fromLambda(() => { throw err });
  const t: Task<never|Error, string> = t1.andThen(() => t2);
  expectErr(done, t, err);
})