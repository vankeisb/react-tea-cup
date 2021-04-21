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

import { Component, ReactNode } from 'react';
import { Dispatcher, Cmd, Sub, nextUuid, CmdNone } from 'tea-cup-core';
import { DevToolsEvent, DevTools } from './DevTools';

/**
 * The program props : asks for init, view, update and subs in order
 * to start the TEA MVU loop.
 */
export interface ProgramProps<Model, Msg> {
  init: () => [Model, Cmd<Msg>];
  view: (dispatch: Dispatcher<Msg>, model: Model) => ReactNode;
  update: (msg: Msg, model: Model) => [Model, Cmd<Msg>];
  subscriptions: (model: Model) => Sub<Msg>;
  devTools?: DevTools<Model, Msg>;
}

/**
 * A React component that holds a TEA "program", provides the Dispatcher, and implements the MVU loop.
 */
export class Program<Model, Msg> extends Component<ProgramProps<Model, Msg>, never> {
  readonly uuid = nextUuid();
  private readonly bd: Dispatcher<Msg>;
  private count: number = 0;
  private initialCmd?: Cmd<any>;
  private currentModel?: Model;
  private currentSub?: Sub<Msg>;

  constructor(props: Readonly<ProgramProps<Model, Msg>>) {
    super(props);
    this.bd = this.dispatch.bind(this);
  }

  private fireEvent(e: DevToolsEvent<Model, Msg>) {
    if (this.props.devTools) {
      this.props.devTools.onEvent(e);
    }
  }

  dispatch(msg: Msg) {
    if (this.props.devTools && this.props.devTools.isPaused()) {
      // do not process messages if we are paused
      return;
    }

    this.count++;
    const count = this.count;
    const currentModel = this.currentModel;
    if (currentModel !== undefined) {
      const updated = this.props.update(msg, currentModel);
      if (this.props.devTools) {
        this.fireEvent({
          tag: 'updated',
          msgNum: count,
          time: new Date().getTime(),
          msg: msg,
          modelBefore: currentModel,
          modelAfter: updated[0],
          cmd: updated[1],
        });
      }
      const newSub = this.props.subscriptions(updated[0]);
      const prevSub = this.currentSub;

      const d = this.dispatch.bind(this);

      newSub.init(d);
      prevSub && prevSub.release();

      // perform commands in a separate timout, to
      // make sure that this dispatch is done
      const cmd = updated[1];
      // if (!(cmd instanceof CmdNone)) {
        setTimeout(() => {
          // console.log("dispatch: processing commands");
          // debug("performing command", updated[1]);
          updated[1].execute(d);
          // debug("<<<  done");
        }, 0);
      // }

      // const needsUpdate = this.currentModel === updated[0];

      this.currentModel = updated[0];
      this.currentSub = newSub;

      // trigger rendering
      // console.log('render')
      // if (needsUpdate) {
        // console.log('render update')
        this.forceUpdate();
      // }
    }
  }

  componentDidMount() {
    const { devTools } = this.props;
    if (devTools) {
      devTools.connected(this);
    }
    const mac = (devTools && devTools.initFromSnapshot()) || this.props.init();
    if (devTools) {
      this.fireEvent({
        tag: 'init',
        time: new Date().getTime(),
        model: mac[0],
      });
    }
    const sub = this.props.subscriptions(mac[0]);
    this.currentModel = mac[0];
    this.currentSub = sub;
    // connect to sub
    sub.init(this.bd);
    this.initialCmd = mac[1];

    // trigger initial command
    setTimeout(() => {
      this.initialCmd && this.initialCmd.execute(this.bd);
    }, 0);

    // trigger rendering after mount
    this.forceUpdate();
  }

  render(): ReactNode {
    if (this.currentModel && this.bd) {
      return this.props.view(this.bd, this.currentModel);
    }
    return null;
  }

  setModel(model: Model, withSubs: boolean) {
    if (this.bd) {
      let newSub: Sub<Msg>;
      if (withSubs) {
        newSub = this.props.subscriptions(model);
      } else {
        newSub = Sub.none();
      }
      newSub.init(this.bd);
      this.currentSub && this.currentSub.release();
      this.currentModel = model;
      this.currentSub = newSub;
      this.forceUpdate();
    }
  }
}
