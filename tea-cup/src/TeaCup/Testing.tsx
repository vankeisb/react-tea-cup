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

import { Dispatcher, Cmd, Sub } from 'tea-cup-fp';
import { ReactElement } from 'react';
import { ProgramProps, Program } from '.';
import * as React from 'react';

// export function extendJest<M>(expect: jest.Expect) {
//   expect.extend({
//     toHaveDispatchedMsg(received: Testing<M>, expected: M) {
//       const pass = this.equals(received.dispatched, expected);

//       const message = () =>
//         this.utils.matcherHint('toBe', undefined, undefined) +
//         '\n\n' +
//         `Expected: ${this.utils.printExpected(expected)}\n` +
//         `Received: ${this.utils.printReceived(received.dispatched)}`;

//       return { actual: received, message, pass };
//     },
//   });
// }

// declare global {
//   namespace jest {
//     interface Matchers<R> {
//       toHaveDispatchedMsg<M>(value: M): CustomMatcherResult;
//     }
//   }
// }

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

type Trigger<Model, Msg, T> = (node: ReactElement<ProgramProps<Model, Msg>>) => T;
type ResolveType<Model, T> = (idle: [Model, T]) => void;

export function updateUntilIdle<Model, Msg, T>(
  props: ProgramProps<Model, Msg>,
  fun: Trigger<Model, Msg, T>,
): Promise<[Model, T]> {
  return new Promise((resolve) => {
    let wrapper = fun(<Program {...testableProps(resolve, props, () => wrapper)} />);
  });
}

function testableProps<Model, Msg, T>(
  resolve: ResolveType<Model, T>,
  props: ProgramProps<Model, Msg>,
  getWrapper: () => T,
) {
  const tprops: ProgramProps<TestableModel<Model, Msg, T>, Msg> = {
    init: initTestable(resolve, props.init),
    view: viewTestable(props.view),
    update: updateTestable(props.update),
    subscriptions: subscriptionsTestable(props, getWrapper),
  };
  return tprops;
}

type TestableModel<Model, Msg, T> = {
  readonly resolve: ResolveType<Model, T>;
  readonly cmds: Cmd<Msg>[];
  readonly model: Model;
};

function initTestable<Model, Msg, T>(
  resolve: ResolveType<Model, T>,
  init: ProgramProps<Model, Msg>['init'],
): ProgramProps<TestableModel<Model, Msg, T>, Msg>['init'] {
  const mac = init();
  return () => [
    {
      resolve,
      cmds: [mac[1]],
      model: mac[0],
    },
    Cmd.none(),
  ];
}

function viewTestable<Model, Msg, T>(
  view: ProgramProps<Model, Msg>['view'],
): ProgramProps<TestableModel<Model, Msg, T>, Msg>['view'] {
  return (dispatch: Dispatcher<Msg>, model: TestableModel<Model, Msg, T>) => view(dispatch, model.model);
}

function updateTestable<Model, Msg, T>(
  update: ProgramProps<Model, Msg>['update'],
): ProgramProps<TestableModel<Model, Msg, T>, Msg>['update'] {
  return (msg: Msg, model: TestableModel<Model, Msg, T>) => {
    const [model1, cmd1] = update(msg, model.model);
    const cmds = [cmd1].filter((cmd) => cmd.constructor.name !== 'CmdNone');
    return [
      {
        ...model,
        cmds,
        model: model1,
      },
      Cmd.none(),
    ];
  };
}

function subscriptionsTestable<Model, Msg, T>(
  props: ProgramProps<Model, Msg>,
  getWrapper: () => T,
): ProgramProps<TestableModel<Model, Msg, T>, Msg>['subscriptions'] {
  return (model: TestableModel<Model, Msg, T>) => {
    const subs = props.subscriptions(model.model);
    if (model.cmds.length === 0) {
      const result = getWrapper();
      model.resolve([model.model, result]);
      return subs;
    }
    return Sub.batch([new TestableSub(model.cmds), subs]);
  };
}

class TestableSub<Msg> extends Sub<Msg> {
  constructor(private readonly cmds: readonly Cmd<Msg>[]) {
    super();
  }

  protected onInit(): void {
    setTimeout(() => {
      this.isActive() && this.cmds.forEach((cmd) => cmd.execute((m) => this.dispatch(m)));
      // if (this.dispatcher !== undefined) {
      //   const d = this.dispatcher.bind(this);
      //   this.cmds.map((cmd) => cmd.execute(d));
      // }
    }, 0);
  }
}
