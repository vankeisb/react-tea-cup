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

// export class Program<Model, Msg> extends React.Component<ProgramProps<Model, Msg>, never> {
//   readonly uuid = nextUuid();
//   private readonly bd: Dispatcher<Msg>;
//   private count: number = 0;
//   private initialCmd?: Cmd<any>;
//   private currentModel?: Model;
//   private currentSub?: Sub<Msg>;

//   constructor(props: Readonly<ProgramProps<Model, Msg>>) {
//     super(props);
//     this.bd = this.dispatch.bind(this);
//   }

//   dispatch(msg: Msg) {
//     console.log('dispatch', msg);

//     if (this.currentSub === undefined) {
//       return;
//     }
//     if (this.props.paused?.()) {
//       // do not process messages if we are paused
//       return;
//     }

//     this.count++;
//     const count = this.count;
//     const currentModel = this.currentModel;
//     if (currentModel !== undefined) {
//       const updated = this.props.update(msg, currentModel);
//       if (this.props.listener) {
//         this.props.listener({ tag: 'update', count: count, msg, mac: updated });
//       }
//       const newSub = this.props.subscriptions(updated[0]);
//       const prevSub = this.currentSub;

//       const d = this.dispatch.bind(this);

//       newSub.init(d);
//       prevSub?.release();

//       // perform commands in a separate timout, to
//       // make sure that this dispatch is done
//       const cmd = updated[1];
//       if (!(cmd instanceof CmdNone)) {
//         setTimeout(() => {
//           // console.log("dispatch: processing commands");
//           // debug("performing command", updated[1]);
//           updated[1].execute(d);
//           // debug("<<<  done");
//         }, 0);
//       }

//       const needsUpdate = this.currentModel !== updated[0];

//       this.currentModel = updated[0];
//       this.currentSub = newSub;

//       // trigger rendering
//       if (needsUpdate) {
//         this.forceUpdate();
//       }
//     }
//   }

//   componentWillUnmount() {
//     this.currentSub?.release();
//     this.currentSub = undefined;
//   }

//   componentDidMount() {
//     const mac = this.props.init();
//     this.props.listener?.({ tag: 'init', count: 0, mac });
//     const sub = this.props.subscriptions(mac[0]);
//     this.currentModel = mac[0];
//     this.currentSub = sub;
//     // connect to sub
//     sub.init(this.bd);
//     this.initialCmd = mac[1];

//     // trigger initial command
//     setTimeout(() => {
//       this.initialCmd && this.initialCmd.execute(this.bd);
//     }, 0);

//     // trigger rendering after mount
//     this.forceUpdate();
//   }

//   render(): ReactNode {
//     if (this.currentModel !== undefined && this.bd) {
//       return this.props.view(this.bd, this.currentModel);
//     }
//     return null;
//   }

//   setModel(model: Model, withSubs: boolean) {
//     if (this.bd) {
//       let newSub: Sub<Msg>;
//       if (withSubs) {
//         newSub = this.props.subscriptions(model);
//       } else {
//         newSub = Sub.none();
//       }
//       newSub.init(this.bd);
//       this.currentSub && this.currentSub.release();
//       this.currentModel = model;
//       this.currentSub = newSub;
//       this.forceUpdate();
//     }
//   }
// }
