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
import { Cmd, Dispatcher, just, Maybe, nothing, Sub } from 'tea-cup-fp';

export class DispatchBridge<Msg> {
  private d?: Dispatcher<Msg>;

  subscribe(d: Dispatcher<Msg>): void {
    this.d = d;
  }

  dispatch(msg: Msg) {
    this.d?.(msg);
  }
}

export type SetModelFunc<Model> = (model: Model) => void;

export class SetModelBridge<Model> {
  private sm: SetModelFunc<Model> | undefined;

  subscribe(sm: SetModelFunc<Model>): void {
    this.sm = sm;
  }

  setModel(model: Model) {
    this.sm?.(model);
  }
}

export type ProgramListener<Model, Msg> = (e: ProgramEvent<Model, Msg>) => void;

export type ProgramEvent<Model, Msg> =
  | { tag: 'init'; count: number; mac: [Model, Cmd<Msg>] }
  | { tag: 'update'; count: number; msg: Msg; mac: [Model, Cmd<Msg>] };

export interface ProgramInterop<Model, Msg> {
  dispatchBridge?: DispatchBridge<Msg>;
  setModelBridge?: SetModelBridge<Model>;
  listener?: ProgramListener<Model, Msg>;
  paused?: () => boolean;
}

/**
 * The program props : asks for init, view, update and subs in order
 * to start the TEA MVU loop.
 */
export interface ProgramProps<Model, Msg> extends ProgramInterop<Model, Msg> {
  init: () => [Model, Cmd<Msg>];
  view: (dispatch: Dispatcher<Msg>, model: Model) => ReactNode;
  update: (msg: Msg, model: Model) => [Model, Cmd<Msg>];
  subscriptions: (model: Model) => Sub<Msg>;
}

/**
 * A React component that holds a TEA "program", implementing the MVU loop.
 */
export function Program<Model, Msg>(props: ProgramProps<Model, Msg>) {
  const [model, setModel] = useState<Maybe<Model>>(nothing);

  const cmd = useRef<Cmd<Msg>>(Cmd.none());
  // this could go in state only but as we need it effects it's easier with a ref
  const modelRef = useRef(model);
  const sub = useRef<Sub<Msg>>(Sub.none());

  const count = useRef(0);

  const dispatch = (msg: Msg) => {
    if (props.paused?.() === true) {
      // do not process messages if we are paused
      return;
    }

    const c = count.current + 1;
    count.current = c;

    if (modelRef.current.type === 'Just') {
      const m = modelRef.current.value;
      const [uModel, uCmd] = props.update(msg, m);
      modelRef.current = just(uModel);
      cmd.current = uCmd;
      setModel(just(uModel));
      const newSub = props.subscriptions(uModel);
      newSub.init(dispatch);
      sub.current.release();
      sub.current = newSub;
      props.listener?.({ tag: 'update', count: count.current, msg, mac: [uModel, uCmd] });

      setTimeout(() => {
        uCmd.execute(dispatch);
      });
    }
  };

  // init : run once (good old componentDidMount)
  useEffect(() => {
    if (modelRef.current.isNothing()) {
      // sub to bridges if any
      props.setModelBridge?.subscribe((model) => {
        setModel(just(model));
      });
      props.dispatchBridge?.subscribe(dispatch);

      // init
      const mac = props.init();

      // and start the MVU
      const [uModel, uCmd] = mac;
      setModel(just(uModel));
      modelRef.current = just(uModel);
      cmd.current = uCmd;
      const newSub = props.subscriptions(uModel);
      sub.current = newSub;
      newSub.init(dispatch);
      props.listener?.({ tag: 'init', count: count.current, mac });

      setTimeout(() => {
        uCmd.execute(dispatch);
      });
    }
  });

  return model.map((m) => props.view(dispatch, m)).withDefault(<></>);
}
