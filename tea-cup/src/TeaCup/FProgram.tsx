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
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Cmd, Dispatcher, just, Maybe, nothing, Sub } from 'tea-cup-core';
import { DevTools, DevToolsEvent } from './DevTools';

export class DispatchBridge<Msg> {
  private d?: Dispatcher<Msg>;

  subscribe(d: Dispatcher<Msg>): void {
    this.d = d;
  }

  dispatch(msg: Msg) {
    this.d?.(msg);
  }
}

/**
 * The program props : asks for init, view, update and subs in order
 * to start the TEA MVU loop.
 */
export interface FProgramProps<Model, Msg> {
  init: () => [Model, Cmd<Msg>];
  view: (dispatch: Dispatcher<Msg>, model: Model) => ReactNode;
  update: (msg: Msg, model: Model) => [Model, Cmd<Msg>];
  subscriptions: (model: Model) => Sub<Msg>;
  dispatchBridge?: DispatchBridge<Msg>;
  devTools?: DevTools<Model, Msg>;
}

/**
 * A React component that holds a TEA "program", implementing the MVU loop.
 */
export function FProgram<Model, Msg>(props: FProgramProps<Model, Msg>) {
  const [model, setModel] = useState<Maybe<Model>>(nothing);
  const [count, setCount] = useState(0);

  const cmd = useRef<Cmd<Msg>>(Cmd.none());
  const modelRef = useRef(model);
  const sub = useRef<Sub<Msg>>(Sub.none());

  const { devTools } = props;

  const dispatch = (msg: Msg) => {
    if (devTools && devTools.isPaused()) {
      // do not process messages if we are paused
      return;
    }

    const c = count + 1;
    setCount(c);

    if (modelRef.current.type === 'Just') {
      const m = modelRef.current.value;
      const [uModel, uCmd] = props.update(msg, m);
      if (devTools) {
        fireEvent({
          tag: 'updated',
          msgNum: count,
          time: new Date().getTime(),
          msg: msg,
          modelBefore: m,
          modelAfter: uModel,
          cmd: uCmd,
        });
      }

      modelRef.current = just(uModel);
      cmd.current = uCmd;
      setModel(just(uModel));
      const newSub = props.subscriptions(uModel);
      newSub.init(dispatch);
      sub.current.release();
      sub.current = newSub;
    }
  };

  const fireEvent = (e: DevToolsEvent<Model, Msg>) => {
    props.devTools?.onEvent(e);
  };

  // init : run once (componentDidMount)
  useEffect(() => {
    if (modelRef.current.isNothing()) {
      console.log('*** init ***');

      // init from dev tools snap if any
      const mac = (props.devTools && props.devTools.initFromSnapshot()) || props.init();
      if (props.devTools) {
        fireEvent({
          tag: 'init',
          time: new Date().getTime(),
          model: mac[0],
        });
      }

      // and start the MVU
      const [uModel, uCmd] = mac;
      setModel(just(uModel));
      modelRef.current = just(uModel);
      cmd.current = uCmd;
      const newSub = props.subscriptions(uModel);
      sub.current = newSub;
      newSub.init(dispatch);
    }
  });

  // executed at every render
  useEffect(() => {
    console.log('*** render ***', cmd.current);
    props.dispatchBridge?.subscribe(dispatch);
    cmd.current.execute(dispatch);
  });

  return model.map((m) => props.view(dispatch, m)).withDefault(<></>);
}

class Guid {
  static newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
