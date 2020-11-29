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

import { DevTools } from './DevTools';

interface ReduxMsg {
  type: string;
}

function defaultTeaCupToReduxMessage(msg: any): ReduxMsg {
  const { tag, type, ...others } = msg;
  return {
    type: type || tag,
    ...others,
  };
}

interface ReduxDevToolsMessage {
  readonly type: 'DISPATCH' | 'ACTION' | 'IMPORT' | 'EXPORT' | 'UPDATE' | 'START' | 'STOP';
  readonly payload?: {
    readonly type:
      | 'JUMP_TO_STATE'
      | 'JUMP_TO_ACTION'
      | 'TOGGLE_ACTION'
      | 'REORDER_ACTION'
      | 'IMPORT_STATE'
      | 'LOCK_CHANGES'
      | 'PAUSE_RECORDING';
    readonly index: number;
    readonly actionId: number;
  };
  readonly state?: any;
}

interface ReduxDevtools {
  subscribe(listener: (message: ReduxDevToolsMessage) => void): void;
  unsubscribe(): void;
  send(action: string | ReduxMsg, state: any): void;
  init(state: any): void;
  error(message: string): void;
}

export interface ReduxDevToolsOptions {
  readonly teacupToReduxMessage: (msg: any) => ReduxMsg;
  readonly name?: string;
  readonly actionsCreators?: any; // TODO
  readonly latency?: number;
  readonly maxAge?: number;
  readonly trace?: boolean;
  readonly traceLimit?: number;
  readonly serialize?:
    | boolean
    | {
        date?: boolean;
        regex?: boolean;
        undefined?: boolean;
        error?: boolean;
        symbol?: boolean;
        map?: boolean;
        set?: boolean;
        function?: boolean | Function;
      };
  actionSanitizer?(action: any, id: number): any;
  stateSanitizer?(state: any, index?: number): any;
  readonly actionsBlacklist?: string | string[];
  readonly actionsWhitelist?: string | string[];
  predicate?(state: any, action: any): boolean;
  readonly shouldRecordChanges?: boolean;
  readonly pauseActionType?: string;
  readonly autoPause?: boolean;
  readonly shouldStartLocked?: boolean;
  readonly shouldHotReload?: boolean;
  readonly shouldCatchErrors?: boolean;
  readonly features?: {
    readonly pause?: boolean;
    readonly lock?: boolean;
    readonly persist?: boolean;
    readonly export?: boolean | 'custom';
    readonly import?: boolean | 'custom';
    readonly jump?: boolean;
    readonly skip?: boolean;
    readonly reorder?: boolean;
    readonly dispatch?: boolean;
    readonly test?: boolean;
  };
}

interface ReduxDevToolsExtension {
  (options?: ReduxDevToolsOptions): ReduxDevtools;
  connect(options?: ReduxDevToolsOptions): ReduxDevtools;
  disconnect(): void;
}

export function withReduxDevTools<Model, Msg>(
  dt: DevTools<Model, Msg>,
  options?: ReduxDevToolsOptions,
): DevTools<Model, Msg> {
  const reduxDevtoolsExtension: ReduxDevToolsExtension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
  if (reduxDevtoolsExtension) {
    const reduxDevTools = reduxDevtoolsExtension.connect(options);
    reduxDevTools.subscribe((message: ReduxDevToolsMessage) => {
      if (message.type === 'DISPATCH' && message.state) {
        // console.log('DISPATCH', message.payload);
        if (message.payload?.type === 'JUMP_TO_ACTION' || message.payload?.type === 'JUMP_TO_STATE') {
          // console.log('travelling to ', message.payload.actionId);
          //dt.travelTo(message.payload.actionId);
        }
      }
    });
    const teacupToReduxMessage = options?.teacupToReduxMessage || defaultTeaCupToReduxMessage;
    dt.addListener((e) => {
      switch (e.tag) {
        case 'init':
          reduxDevTools.init(e.model);
          break;
        case 'updated':
          const action = teacupToReduxMessage(e.msg);
          reduxDevTools.send(action, e.modelAfter);
          break;
      }
    });
  }
  return dt;
}
