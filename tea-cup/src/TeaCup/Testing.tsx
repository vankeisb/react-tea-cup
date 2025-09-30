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

import { Dispatcher, Cmd, Sub, Maybe, nothing, just } from 'tea-cup-fp';
import { ReactElement } from 'react';
import { ProgramProps, Program, DispatchBridge } from './Program';
import * as React from 'react';

export class Testing<M> {
  private _dispatched: M | undefined;

  public Testing() {}

  public readonly noop: Dispatcher<M> = () => {};

  public get dispatcher(): Dispatcher<M> {
    this._dispatched = undefined;
    return (msg: M) => {
      this._dispatched = msg;
    };
  }

  public get dispatched(): M | undefined {
    return this._dispatched;
  }

  public dispatchFrom(cmd: Cmd<M>): Promise<M> {
    return new Promise<M>((resolve, reject) => {
      const dispatchedMsg = (msg: M) => {
        resolve(msg);
      };
      cmd.execute(dispatchedMsg);
    });
  }
}

type RenderFun<Model, Msg, T> = (node: ReactElement<ProgramProps<Model, Msg>>) => T;
type Condition<Model, T> = (m: Model, t: T) => boolean;

export function updateUntilCondition<Model, Msg, T>(
  props: ProgramProps<Model, Msg>,
  render: RenderFun<Model, Msg, T>,
  condition: Condition<Model, T>,
): Promise<[Model, T]> {
  return new Promise((resolve) => {
    let wrapper: Maybe<T> = nothing;
    wrapper = just(
      render(
        <Program
          init={props.init}
          view={(d, model) => {
            const r = props.view(d, model);
            switch (wrapper.type) {
              case 'Just': {
                if (condition(model, wrapper.value)) {
                  resolve([model, wrapper.value]);
                }
                break;
              }
              default: {
                break;
              }
            }
            return r;
          }}
          update={props.update}
          subscriptions={props.subscriptions}
        />,
      ),
    );
  });
}
