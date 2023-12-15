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

import { Cmd, Dispatcher, noCmd } from 'tea-cup-core';
import * as React from 'react';
import { memo } from 'react-tea-cup';

export type Model = number;

export type Msg = 'add' | 'remove';

export function init(): [Model, Cmd<Msg>] {
  return noCmd(0);
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
  return (
    <div>
      <p>I'm another counter, that embeds a stateful component in view()</p>
      <p>Value = {model}</p>
      <button onClick={() => dispatch('add')}>Add</button>
      <button onClick={() => dispatch('remove')}>Remove</button>
      <MyComponent initialValue={123} />
      {memoizedView(dispatch, model)}
    </div>
  );
}

function memoizedView(dispatch: Dispatcher<Msg>, model: Model) {
  return memo(model)((m: Model) => (
    <div>
      I am memoized, and I include another stateful component...
      <MyComponent initialValue={456} />
    </div>
  ));
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg) {
    case 'add':
      return noCmd(model + 1);
    case 'remove':
      return noCmd(model - 1);
  }
}

type MyProps = Readonly<{
  initialValue: number;
}>;

type MyState = Readonly<{
  value: number;
}>;

class MyComponent extends React.Component<MyProps, MyState> {
  constructor(props: Readonly<MyProps>) {
    super(props);
    this.state = {
      value: props.initialValue,
    };
  }

  render(): React.ReactNode {
    return (
      <div>
        I am stateful ! My value is {this.state.value}, you can
        <button
          onClick={() => {
            this.setState({
              value: Math.random(),
            });
          }}
        >
          randomize
        </button>{' '}
        another value...
      </div>
    );
  }
}
