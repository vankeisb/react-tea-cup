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

const snapshotKey = "teaCupSnapshot";

export type DevToolsListener<Model,Msg> = (e:DevToolsEvent<Model,Msg>) => void;

export class DevTools<Model,Msg> {

    private program?: Program<Model,Msg>;
    private events: DevToolsEvent<Model,Msg>[] = [];
    private pausedOnEvent: number = -1;
    private listeners: DevToolsListener<Model, Msg>[] = [];
    private objectSerializer: ObjectSerializer;

    constructor(objectSerializer: ObjectSerializer) {
        this.objectSerializer = objectSerializer;
    }

    static init<Model,Msg>(window:Window, objectSerializer?: ObjectSerializer): DevTools<Model,Msg> {
        const dt = new DevTools<Model,Msg>(objectSerializer || ObjectSerializer.withTeaCupClasses());
        // @ts-ignore
        window["teaCupDevTools"] = dt;
        return dt;
    }

    isPaused(): boolean {
        return this.pausedOnEvent !== -1;
    }

    connected(program: Program<Model,Msg>) {
        this.program = program;
    }

    onEvent(e:DevToolsEvent<Model, Msg>) : void {
        this.events.push(e);
        this.listeners.forEach(l => l(e))
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

    addListener(l: DevToolsListener<Model, Msg>): void {
        this.listeners.push(l);
    }

    removeListener(l: DevToolsListener<Model, Msg>): void {
        this.listeners = this.listeners.filter(x => x !== l);
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
