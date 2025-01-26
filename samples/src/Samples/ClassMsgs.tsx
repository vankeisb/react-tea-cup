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

import { Cmd, Dispatcher, noCmd } from 'tea-cup-fp';
import * as React from 'react';

export type Model = number;

export interface Msg {
  execute: (model: Model) => [Model, Cmd<Msg>];
}

class Add implements Msg {
  private readonly v: number;

  constructor(v?: number) {
    this.v = v || 1;
  }

  execute(model: Model): [Model, Cmd<Msg>] {
    return noCmd(model + this.v);
  }
}

class Times2 implements Msg {
  execute(model: Model): [Model, Cmd<Msg>] {
    return noCmd(model * 2);
  }
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
  const btn = (s: string, m: Msg) => <button onClick={(_) => dispatch(m)}>{s}</button>;

  return (
    <div>
      <p>My messages contain the update logic ! This is more OOP...</p>
      <p>Value = {model}</p>
      {btn('add', new Add())}
      {btn('remove', new Add(-1))}
      {btn('add 10', new Add(10))}
      {btn('remove 10', new Add(-10))}
      {btn('times 2', new Times2())}
    </div>
  );
}

export function update(msg: Msg, model: Model) {
  return msg.execute(model);
}

export function init(): [Model, Cmd<Msg>] {
  return noCmd(0);
}
