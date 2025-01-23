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

import { ProgramEvent, ProgramListener, SetModelBridge } from './Program';

export interface PartialProgramProps<Model, Msg> {
  readonly setModelBridge?: SetModelBridge<Model>;
  readonly listener?: ProgramListener<Model, Msg>;
  readonly paused?: () => boolean;
}

export class DevTools<Model, Msg> {
  private _pausedOnEvent?: number;
  private _maxEvents: number = 1000;
  private _events: ProgramEvent<Model, Msg>[] = [];
  private _verbose: boolean = true;

  private _setModelBridge: SetModelBridge<Model> = new SetModelBridge();

  asGlobal(name?: string): DevTools<Model, Msg> {
    // @ts-ignore
    window[name ?? 'teaCupDevTools'] = this;
    return this;
  }

  get events(): readonly ProgramEvent<Model, Msg>[] {
    return this._events;
  }

  getMaxEvents(): number {
    return this._maxEvents;
  }

  getProgramProps(): PartialProgramProps<Model, Msg> {
    return {
      setModelBridge: this._setModelBridge,
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
          console.log('[tea-cup]', e.count, e.tag, e.mac[0], e.mac[1]);
          break;
        }
        case 'update': {
          console.log('[tea-cup]', e.count, e.tag, e.msg, e.mac[0], e.mac[1]);
          break;
        }
      }
    }
    this._events.push(e);
    this.removeEventsIfNeeded();
  }

  travelTo(evtNum: number) {
    console.log('[tea-cup] travelling to', evtNum);
    const evt = this._events[evtNum];
    if (evt) {
      const model = this.getEventModel(evt);
      this._pausedOnEvent = evtNum;
      this._setModelBridge.setModel(model);
    } else {
      console.warn('[tea-cup] no such event', evtNum);
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
      console.log('[tea-cup] resuming (paused on ' + this._pausedOnEvent + ')');
      const lastEvent = this.lastEvent();
      if (lastEvent) {
        const model = this.getEventModel(lastEvent);
        this._setModelBridge.setModel(model);
      }
      console.log('[tea-cup] resumed');
      this._pausedOnEvent = undefined;
    } else {
      console.warn('[tea-cup] not paused');
    }
  }

  forward() {
    console.log('[tea-cup] forward');
    if (this._pausedOnEvent === undefined) {
      console.warn('[tea-cup] not paused');
      return;
    }
    if (this._pausedOnEvent >= 0 && this._pausedOnEvent < this._events.length - 1) {
      this.travelTo(this._pausedOnEvent + 1);
    }
  }

  backward() {
    console.log('[tea-cup] backward');
    if (this._pausedOnEvent === undefined) {
      console.warn('[tea-cup] not paused');
      return;
    }
    if (this._pausedOnEvent >= 1) {
      this.travelTo(this._pausedOnEvent - 1);
    }
  }

  lastEvent(): ProgramEvent<Model, Msg> {
    return this._events[this._events.length - 1];
  }

  lastModel(): Model {
    const e = this.lastEvent();
    return this.getEventModel(e);
  }

  clear() {
    if (this.isPaused()) {
      this.resume();
    }
    this._events = [];
    console.log('[tea-cup] all events cleared');
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
}
