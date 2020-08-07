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

import { ok, err, Result } from './Result';
import { just, nothing } from './Maybe';

test('ok map', () => {
  expect(ok(1).map((v) => v + 1)).toEqual(ok(2));
});

test('err map', () => {
  expect(err<string, number>('boom').map((v) => v + 1)).toEqual(err('boom'));
});

test('ok mapError', () => {
  expect(ok(1).mapError((e) => 'boom')).toEqual(ok(1));
});

test('err mapError', () => {
  expect(err<string, number>('boom').mapError((err) => err + 'boom')).toEqual(err('boomboom'));
});

test('ok toMaybe', () => {
  expect(ok(1).toMaybe()).toEqual(just(1));
});

test('err toMaybe', () => {
  expect(err<string, number>('boom').toMaybe()).toEqual(nothing);
});

test('ok match', () => {
  expect(
    ok(1).match(
      (v) => v + 1,
      (err) => 13,
    ),
  ).toEqual(2);
});

test('err match', () => {
  expect(
    err('boom').match(
      (v) => 1,
      (err) => 13,
    ),
  ).toEqual(13);
});

test('ok withDefault', () => {
  expect(ok(1).withDefault(13)).toEqual(1);
});

test('err withDefault', () => {
  expect(err('boom').withDefault(13)).toEqual(13);
});

test('ok andThen ok', () => {
  expect(ok(1).andThen((v) => ok(v + 1))).toEqual(ok(2));
});

test('ok andThen err', () => {
  expect(ok(1).andThen((v) => err('boom'))).toEqual(err('boom'));
});

test('err andThen', () => {
  expect(err('boom').andThen((v) => ok(13))).toEqual(err('boom'));
});

test('ok withDefaultSupply', () => {
  expect(ok(1).withDefaultSupply(() => 13)).toEqual(1);
});

test('err withDefaultSupply', () => {
  expect(err('boom').withDefaultSupply(() => 'hello')).toEqual('hello');
});

test('ok orElse', () => {
  expect(ok(1).orElse((err) => ok(13))).toEqual(ok(1));
});

test('err orElse', () => {
  expect(err('boom').orElse(() => ok(13))).toEqual(ok(13));
});
