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

import {Program} from "./Program";
import {Cmd, noCmd} from "./Cmd";
import {ObjectSerializer} from "./ObjectSerializer";


export interface HasTime {
    readonly time: number
}

interface HasTag {
    readonly tag: string;
}

export type DevToolsEvent<Model,Msg>
    = Init<Model,Msg>
    | Updated<Model,Msg>


export interface Init<Model,Msg> extends HasTime, HasTag {
    readonly tag: "init"
    readonly model: Model
}

export interface Updated<Model,Msg> extends HasTime, HasTag {
    readonly tag: "updated"
    readonly msgNum: number
    readonly msg: Msg
    readonly modelBefore: Model
    readonly modelAfter: Model
    readonly cmd: Cmd<Msg>
}

interface ReduxMsg {
    type: string;
};

function defaultTeaCupToReduxMessage(msg: any): ReduxMsg {
    const { tag, type, ...others } = msg;
    return {
        type: type || tag,
        ...others,
    }
}

interface ReduxDevToolsMessage {
    readonly type: 'DISPATCH' | 'ACTION' | 'IMPORT' | 'EXPORT' | 'UPDATE' | 'START' | 'STOP';
    readonly payload?: {
        readonly type: 'JUMP_TO_STATE' | 'JUMP_TO_ACTION' | 'TOGGLE_ACTION' | 'REORDER_ACTION' | 'IMPORT_STATE' | 'LOCK_CHANGES' | 'PAUSE_RECORDING';
        readonly index: number;
        readonly actionId: number;
    }
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
    readonly teaCuptoReduxMessage: (msg: any) => ReduxMsg;
    readonly name?: string;
    readonly actionsCreators?: any; // TODO
    readonly latency?: number;
    readonly maxAge?: number;
    readonly trace?: boolean;
    readonly traceLimit?: number;
    readonly serialize?: boolean | {
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
        readonly export?: boolean | "custom";
        readonly import?: boolean | "custom";
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

const snapshotKey = "teaCupSnapshot";

export class DevTools<Model,Msg> {

    private program?: Program<Model,Msg>;
    private events: DevToolsEvent<Model,Msg>[] = [];
    private pausedOnEvent: number = -1;
    private listener?: (e:DevToolsEvent<Model,Msg>) => void;
    private objectSerializer: ObjectSerializer;
    private reduxDevTools?: ReduxDevtools;
    private teaCuptoReduxMessage?: (msg: any) => ReduxMsg;

    constructor(objectSerializer: ObjectSerializer) {
        this.objectSerializer = objectSerializer;
    }

    static init<Model,Msg>(window:Window, objectSerializer?: ObjectSerializer, reduxDevToolsOptions?: ReduxDevToolsOptions): DevTools<Model,Msg> {
        const dt = new DevTools<Model,Msg>(objectSerializer || ObjectSerializer.withTeaCupClasses());
        // @ts-ignore
        window["teaCupDevTools"] = dt;
        const reduxDevtoolsExtension: ReduxDevToolsExtension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
        if (reduxDevtoolsExtension) {
            dt.reduxDevTools = reduxDevtoolsExtension.connect(reduxDevToolsOptions);
            dt.teaCuptoReduxMessage = reduxDevToolsOptions?.teaCuptoReduxMessage || defaultTeaCupToReduxMessage;
            dt.reduxDevTools.subscribe((message: ReduxDevToolsMessage) => {
                if (message.type === 'DISPATCH' && message.state) {
                    // console.log('DISPATCH', message.payload);
                    if (message.payload?.type === 'JUMP_TO_ACTION' || message.payload?.type === 'JUMP_TO_STATE') {
                        // console.log('travelling to ', message.payload.actionId);
                        dt.travelTo(message.payload.actionId);
                    }
                }
            });
        }
        return dt;
    }

    isPaused(): boolean {
        return this.pausedOnEvent !== -1;
    }

    connected(program: Program<Model,Msg>) {
        this.program = program;
    }

    onEvent(e:DevToolsEvent<Model, Msg>) : void {
        if (this.reduxDevTools && this.teaCuptoReduxMessage) {
            if (e.tag === 'init') {
                // console.log(e);
                this.reduxDevTools.init(e.model);
            } else if (e.tag === 'updated') {
                // console.log(e);
                const action = this.teaCuptoReduxMessage(e.msg);
                this.reduxDevTools.send(action, e.modelAfter);
            }
        }
        this.events.push(e);
        this.listener && this.listener(e);
    }

    getEvents() : ReadonlyArray<DevToolsEvent<Model,Msg>> {
        return this.events;
    }

    travelTo(evtNum: number) {
        if (this.program) {
            const evt: DevToolsEvent<Model, Msg> = this.events[evtNum];
            if (evt) {
                const model = this.getEventModel(evt);
                this.pausedOnEvent = evtNum;
                this.program.setModel(model, false)
            }
        }
    }

    private getEventModel(e:DevToolsEvent<Model,Msg>): Model {
        switch (e.tag) {
            case "init":
                return e.model;
            case "updated":
                return e.modelAfter;
        }
    }

    resume() {
        if (this.program) {
            if (this.events.length > 0) {
                const lastEvent = this.events[this.events.length -1];
                if (lastEvent) {
                    const model = this.getEventModel(lastEvent);
                    this.pausedOnEvent = -1;
                    this.program.setModel(model, true);
                }
            }
        }
    }

    forward() {
        if (this.pausedOnEvent >= 0 && this.pausedOnEvent < this.events.length - 1) {
            this.travelTo(this.pausedOnEvent + 1);
        }
    }

    backward() {
        if (this.pausedOnEvent >= 1) {
            this.travelTo(this.pausedOnEvent - 1);
        }
    }

    observe(l:(e:DevToolsEvent<Model,Msg>) => void): void {
        this.listener = l;
    }

    lastEvent(): DevToolsEvent<Model, Msg> {
        return this.events[this.events.length - 1];
    }

    lastModel(): Model {
        const e = this.lastEvent();
        switch (e.tag) {
            case "init": {
                return e.model;
            }
            case "updated": {
                return e.modelAfter;
            }
        }
    }

    snapshot() {
        localStorage.setItem(snapshotKey, this.objectSerializer.serialize(this.lastModel()));
        console.log(
              "********************************************************************\n"
            + "*** The current application state has been saved to local storage.\n"
            + "*** The application will now load with this initial state.\n"
            + "*** Call 'teaCupDevTools.clearSnapshot()' to restore normal loading.\n"
            + "********************************************************************"
        );
    }

    initFromSnapshot(): [Model, Cmd<Msg>]|undefined {
        const json = localStorage.getItem(snapshotKey);
        if (json) {
            try {
                // @ts-ignore
                const model = this.objectSerializer.deserialize(json) as Model;
                console.log(
                      "**********************************************************************************************\n"
                    + "*** The application has initialized from a state saved by calling 'teaCupDevTools.snapshot()'.\n"
                    + "*** Call 'teaCupDevTools.clearSnapshot()' if you want to restore normal loading.\n"
                    + "**********************************************************************************************"
                );
                return noCmd(model);
            } catch (e) {
                console.log("*** Error restoring state from local storage: ", e);
            }
        }
    }

    clearSnapshot() {
        localStorage.removeItem(snapshotKey);
        console.log(
              "***********************************************************************\n"
            + "*** Application state cleared, the application will now start normally.\n"
            + "***********************************************************************"
        );
    }
}
