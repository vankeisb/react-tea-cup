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
import {Cmd} from "./Cmd";


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

export class DevTools<Model,Msg> {

    private program?: Program<Model,Msg>;
    private events: DevToolsEvent<Model,Msg>[] = [];
    private pausedOnEvent: number = -1;
    private listener?: (e:DevToolsEvent<Model,Msg>) => void;

    static init<Model,Msg>(window:Window): DevTools<Model,Msg> {
        const dt = new DevTools<Model,Msg>();
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
}
