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
import { perform } from './Task.test';
import { expect, test } from "vitest";

const margin = 10;

test('now', () => new Promise<void>(done => {
  const now = new Date().getTime();
  perform(Time.now(), (r) => {
    expect(r - now).toBeLessThan(margin);
    done();
  });
}));

test('in', () => new Promise<void>(done => {
  const now = new Date().getTime();
  const timeout = 500;
  perform(Time.in(timeout), (r) => {
    const elapsed = r - now;
    expect(elapsed).toBeLessThan(timeout + margin);
    expect(elapsed).toBeGreaterThanOrEqual(timeout);
    done();
  });
}));
