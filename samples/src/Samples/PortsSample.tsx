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

import * as React from 'react';
import { Cmd, Dispatcher, noCmd, Port, Sub } from 'tea-cup-core';

export type Model = number;

export type Msg = { tag: 'inc' } | { tag: 'set-value'; value: number };

function onSetValue(value: number): Msg {
  return {
    tag: 'set-value',
    value,
  };
}

// the ports allow to send Msgs to the update loop from the outside
export const appSamplePorts = {
  setCounter: new Port<number>(),
};

// export as a global to play in dev tools
// @ts-ignore
window['appSamplePorts'] = appSamplePorts;

export function init(): [Model, Cmd<Msg>] {
  return noCmd(0);
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
  return (
    <div>
      <h2>Counter with ports</h2>
      <span>Value = {model}</span>
      <button onClick={() => dispatch({ tag: 'inc' })}>+</button>
    </div>
  );
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.tag) {
    case 'inc': {
      return noCmd(model + 1);
    }
    case 'set-value': {
      return noCmd(msg.value);
    }
  }
}

export function subscriptions(): Sub<Msg> {
  // wire ports to get Msgs into our update func
  return appSamplePorts.setCounter.subscribe(onSetValue);
}
