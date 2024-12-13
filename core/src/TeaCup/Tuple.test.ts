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

import { Tuple } from './Tuple';
import { expect, test } from "vitest";

const t = Tuple.t2('foo', 123);

test('values', () => {
  expect(t.a).toBe('foo');
  expect(t.b).toBe(123);
});

test('mapFirst', () => {
  const t2 = t.mapFirst((s) => s + 'bar');
  expect(t2.a).toBe('foobar');
  expect(t2.b).toBe(123);
});

test('mapSecond', () => {
  const t2 = t.mapSecond((i) => i + 1);
  expect(t2.a).toBe('foo');
  expect(t2.b).toBe(124);
});

test('mapBoth', () => {
  const t2 = t.mapBoth(
    (s) => s + 'bar',
    (i) => i + 1,
  );
  expect(t2.a).toBe('foobar');
  expect(t2.b).toBe(124);
});

test('from native', () => {
  const t = Tuple.fromNative(['foo', 123]);
  expect(t.a).toBe('foo');
  expect(t.b).toBe(123);
});
