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

import * as Counter from './Counter';
import { Dispatcher, map, Cmd, Sub } from 'tea-cup-fp';
import * as React from 'react';

export type Model = ReadonlyArray<Counter.Model>;

export type Msg = Readonly<{
  childIndex: number;
  childMsg: Counter.Msg;
}>;

export function init(): [Model, Cmd<Msg>] {
  const macs = [Counter.init(), Counter.init(), Counter.init()];
  const models: Array<Counter.Model> = macs.map((mac) => mac[0]);
  return [
    models,
    Cmd.batch(
      macs
        .map((mac) => mac[1])
        .map((cmd, index) =>
          cmd.map((c: Counter.Msg) => {
            return {
              childIndex: index,
              childMsg: c,
            };
          }),
        ),
    ),
  ];
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
  return (
    <div>
      {model.map((counterModel, index) => {
        return (
          <div key={index}>
            {Counter.view(
              map(dispatch, (cMsg: Counter.Msg) => {
                return {
                  childIndex: index,
                  childMsg: cMsg,
                };
              }),
              counterModel,
            )}
          </div>
        );
      })}
    </div>
  );
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  const newModels: Array<Counter.Model> = [];
  const cmds: Array<Cmd<Msg>> = [];
  model.forEach((cModel, cIndex) => {
    if (cIndex === msg.childIndex) {
      const mc = Counter.update(msg.childMsg, cModel);
      newModels.push(mc[0]);
      cmds.push(
        mc[1].map((cMsg: Counter.Msg) => {
          return {
            childIndex: cIndex,
            childMsg: cMsg,
          };
        }),
      );
    } else {
      newModels.push(cModel);
    }
  });
  return [newModels, Cmd.batch(cmds)];
}

export function subscriptions(model: Model) {
  return Sub.batch(
    model.map((cModel, index) =>
      Counter.subscriptions(cModel).map((cMsg: Counter.Msg) => {
        return {
          childIndex: index,
          childMsg: cMsg,
        };
      }),
    ),
  );
}
