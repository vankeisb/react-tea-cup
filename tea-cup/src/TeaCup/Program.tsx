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
import { Cmd, CmdNone, Dispatcher, just, Maybe, nothing, Sub } from 'tea-cup-fp';

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

const createNewObject = (): Record<string, never> => ({});

export default function useForceUpdate(): VoidFunction {
  const [, setValue] = useState<Record<string, never>>(createNewObject);

  return React.useCallback((): void => {
    setValue(createNewObject());
  }, []);
}

interface State<Model, Msg> {
  model: Model;
  cmds: Cmd<Msg>[];
  sub: Sub<Msg>;
}

/**
 * A React component that holds a TEA "program", implementing the MVU loop.
 */
export function Program<Model, Msg>(props: ProgramProps<Model, Msg>) {
  const count = useRef(0);
  const [state, setState] = useState<State<Model, Msg> | null>(null);

  const dispatch = (msg: Msg) => {
    debugger;
    if (props.paused?.() === true) {
      // do not process messages if we are paused
      return;
    }
    setState((prev) => {
      if (prev) {
        const { cmds, model, sub } = prev;
        const [uModel, uCmd] = props.update(msg, model);
        const newSub = props.subscriptions(uModel);
        newSub.init(dispatch);
        sub.release();
        props.listener?.({ tag: 'update', count: count.current, msg, mac: [uModel, uCmd] });
        count.current = count.current + 1;
        return { model: uModel, cmds: [...cmds, uCmd], sub: newSub };
      } else {
        return null;
      }
    });
  };

  useEffect(() => {
    debugger;
    let c = null;
    if (state && state.cmds.length > 0) {
      const [cmd, ...rest] = state.cmds;
      setState({
        ...state,
        cmds: rest,
      });
      cmd.execute(dispatch);
    }
  }, [state]);

  // init : run once (good old componentDidMount)
  useEffect(() => {
    debugger;
    // sub to bridges if any
    props.setModelBridge?.subscribe((model) => {
      setState((state) => {
        if (state) {
          return {
            ...state,
            model,
          };
        } else {
          return null;
        }
      });
    });
    props.dispatchBridge?.subscribe(dispatch);

    // init
    const mac = props.init();

    // and start the MVU
    const [uModel, uCmd] = mac;

    // const m2 = just(uModel);
    // modelRef.current = m2;
    const newSub = props.subscriptions(uModel);
    // sub.current = newSub;
    props.listener?.({ tag: 'init', count: count.current, mac });
    newSub.init(dispatch);
    setState({ model: uModel, cmds: [uCmd], sub: newSub });
    count.current = count.current + 1;
    // forceUpdate();
    return () => {
      newSub.release();
    };
  }, []);

  if (state) {
    return props.view(dispatch, state.model);
  } else {
    return <></>;
  }
}
