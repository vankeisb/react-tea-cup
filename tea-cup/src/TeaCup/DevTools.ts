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

import { DispatchBridge, ProgramEvent, ProgramInterop, SetModelBridge } from './Program';

// @ts-ignore
import * as pkg from '../package.json';
import React from 'react';

export class DevTools<Model, Msg> {
  private _pausedOnEvent?: number;
  private _maxEvents: number = 1000;
  private _events: ProgramEvent<Model, Msg>[] = [];
  private _verbose: boolean = true;

  private _setModelBridge: SetModelBridge<Model> = new SetModelBridge();
  private _dispatchBridge: DispatchBridge<Msg> = new DispatchBridge();

  asGlobal(name?: string): DevTools<Model, Msg> {
    const varName = name ?? 'teaCupDevTools';
    // @ts-ignore
    window[varName] = this;
    console.log(`🍵 react-tea-cup 🍵
version: ${pkg.version}
react: ${React.version}
devTools available as '${varName}'`);
    return this;
  }

  get events(): readonly ProgramEvent<Model, Msg>[] {
    return this._events;
  }

  getMaxEvents(): number {
    return this._maxEvents;
  }

  getProgramProps(): ProgramInterop<Model, Msg> {
    return {
      setModelBridge: this._setModelBridge,
      dispatchBridge: this._dispatchBridge,
      listener: this.onEvent.bind(this),
      paused: () => {
        return this.isPaused();
      },
    };
  }

  setMaxEvents(max: number): DevTools<Model, Msg> {
    this._maxEvents = max < 0 ? -1 : max;
    this.removeEventsIfNeeded();
    return this;
  }

  setVerbose(v: boolean): DevTools<Model, Msg> {
    this._verbose = v;
    return this;
  }

  isPaused(): boolean {
    return this._pausedOnEvent !== undefined;
  }

  private onEvent(e: ProgramEvent<Model, Msg>): void {
    if (this._verbose) {
      switch (e.tag) {
        case 'init': {
          console.log('🍵', e.count, e.tag, e.mac[0], e.mac[1]);
          break;
        }
        case 'update': {
          console.log('🍵', e.count, e.tag, e.msg, e.mac[0], e.mac[1]);
          break;
        }
      }
    }
    this._events.push(e);
    this.removeEventsIfNeeded();
  }

  travelTo(evtNum: number) {
    console.log('🍵 travelling to', evtNum);
    const evt = this._events[evtNum];
    if (evt) {
      const model = this.getEventModel(evt);
      this._pausedOnEvent = evtNum;
      this._setModelBridge.setModel(model);
    } else {
      console.warn('🍵 no such event', evtNum);
    }
  }

  private getEventModel(e: ProgramEvent<Model, Msg>): Model {
    switch (e.tag) {
      case 'init':
        return e.mac[0];
      case 'update':
        return e.mac[0];
    }
  }

  resume() {
    if (this._events.length > 0 && this._pausedOnEvent !== undefined) {
      console.log('🍵 resuming (paused on ' + this._pausedOnEvent + ')');
      const lastEvent = this.lastEvent;
      if (lastEvent) {
        const model = this.getEventModel(lastEvent);
        this._setModelBridge.setModel(model);
      }
      console.log('🍵 resumed');
      this._pausedOnEvent = undefined;
    } else {
      console.warn('🍵 not paused');
    }
  }

  forward() {
    console.log('🍵 forward');
    if (this._pausedOnEvent === undefined) {
      console.warn('🍵 not paused');
      return;
    }
    if (this._pausedOnEvent >= 0 && this._pausedOnEvent < this._events.length - 1) {
      this.travelTo(this._pausedOnEvent + 1);
    }
  }

  backward() {
    console.log('🍵 backward');
    if (this._pausedOnEvent === undefined) {
      console.warn('🍵 not paused');
      return;
    }
    if (this._pausedOnEvent >= 1) {
      this.travelTo(this._pausedOnEvent - 1);
    }
  }

  get lastEvent(): ProgramEvent<Model, Msg> {
    return this._events[this._events.length - 1];
  }

  get lastModel(): Model {
    const e = this.lastEvent;
    return this.getEventModel(e);
  }

  clear() {
    if (this.isPaused()) {
      this.resume();
    }
    this._events = [];
    console.log('🍵 all events cleared');
  }

  private removeEventsIfNeeded(): void {
    if (this._maxEvents > 0) {
      const delta = this._events.length - this._maxEvents;
      if (delta > 0) {
        const newEvents = this._events.slice(delta, this._events.length);
        this._events = newEvents;
      }
    }
  }

  setModel(model: Model): void {
    this._setModelBridge.setModel(model);
  }

  dispatch(msg: Msg): void {
    this._dispatchBridge.dispatch(msg);
  }
}
