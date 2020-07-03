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

import { Cmd, Dispatcher, just, Maybe, nothing, Random, Task } from 'react-tea-cup';
import * as React from 'react';

export type Model = Maybe<number>;

export type Msg = { type: 'clicked' } | { type: 'random-received'; value: number };

function randomize(): Cmd<Msg> {
  return Task.perform(Random.fromIntervalInclusive(0, 100), (i: number) => {
    return {
      type: 'random-received',
      value: i,
    } as Msg;
  });
}

export function init(): [Model, Cmd<Msg>] {
  return [nothing, randomize()];
}

export function view(d: Dispatcher<Msg>, model: Model) {
  return (
    <div>
      <p>This is a random number :{model.map((n: number) => n.toString()).withDefault('')}</p>
      <br />
      <button onClick={(_) => d({ type: 'clicked' })}>Randomize</button>
    </div>
  );
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.type) {
    case 'clicked':
      return [model, randomize()];
    case 'random-received':
      return [just(msg.value), Cmd.none()];
  }
}
