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

import { Sub } from 'tea-cup-core';

type Listener<E> = (ev: E) => any;

type ListenerMap<T> = {
  [K in keyof T]?: Listener<T[K]>;
};

function setListener<T, K extends keyof T>(o: ListenerMap<T>, k: K, v: Listener<T[K]> | undefined) {
  o[k] = v;
}

function getListener<T, K extends keyof T>(o: ListenerMap<T>, k: K): Listener<T[K]> | undefined {
  return o[k];
}

type SubsMap<Map, Msg> = {
  [K in keyof Map]?: ReadonlyArray<DocSub<K, Map, Msg>>;
};

function addOneSub<K extends keyof Map, Map, Msg>(
  sub: DocSub<K, Map, Msg>,
  subs: SubsMap<Map, Msg>[K],
): SubsMap<Map, Msg>[K] {
  const result = new Array().concat(subs);
  result.push(sub);
  return result;
}

function removeOneSub<K extends keyof Map, Map, Msg>(
  sub: DocSub<K, Map, Msg>,
  subs: SubsMap<Map, Msg>[K],
): SubsMap<Map, Msg>[K] | undefined {
  const result = new Array().concat(subs).filter((s) => s !== sub);
  return result.length !== 0 ? result : undefined;
}

function getSubs<K extends keyof Map, Map, Msg>(o: SubsMap<Map, Msg>, k: K): SubsMap<Map, Msg>[K] | undefined {
  return o[k];
}

function setSubs<K extends keyof Map, Map, Msg>(o: SubsMap<Map, Msg>, k: K, v: SubsMap<Map, Msg>[K] | undefined) {
  o[k] = v;
}

class DocSub<K extends keyof Map, Map, Msg> extends Sub<Msg> {
  constructor(
    private readonly documentEvents: EventMapEvents<Map, Msg>,
    private readonly key: K,
    private readonly mapper: (t: Map[K]) => Msg,
  ) {
    super();
  }

  protected onInit() {
    super.onInit();
    this.documentEvents.addSub({ key: this.key, sub: this });
  }

  protected onRelease() {
    super.onRelease();
    this.documentEvents.removeSub(this.key, this);
  }

  event(e: Map[K]) {
    this.dispatch(this.mapper(e));
  }
}

abstract class EventMapEvents<Map, Msg> {
  private readonly listeners: ListenerMap<Map> = {};
  private readonly subs: SubsMap<Map, Msg> = {};

  constructor() {}

  public release() {
    const listeners = this.listeners;
    const keys = Object.keys(listeners) as Array<keyof typeof listeners>;
    keys.forEach((key) => this.releaseListener(key));
  }

  abstract doAddListener<K extends keyof Map>(key: K, listener: (ev: Map[K]) => any): void;

  abstract doRemoveListener<K extends keyof Map>(key: K, listener: (ev: Map[K]) => any): void;

  addSub<K extends keyof Map>({ key, sub }: { key: K; sub: DocSub<K, Map, Msg> }) {
    this.initListener(key);
    const subs: SubsMap<Map, Msg>[K] = getSubs(this.subs, key) ?? [];
    setSubs(this.subs, key, addOneSub(sub, subs));
  }

  removeSub<K extends keyof Map, M>(key: K, sub: DocSub<K, Map, Msg>) {
    const list: SubsMap<Map, Msg>[K] = getSubs(this.subs, key) ?? [];
    const list1 = removeOneSub(sub, list);
    setSubs(this.subs, key, list1);
    if (!list1) {
      this.releaseListener(key);
    }
  }

  private initListener<K extends keyof Map>(key: K) {
    if (!this.listeners[key]) {
      const listener = (ev: Map[K]) => {
        const subs: SubsMap<Map, Msg>[K] = getSubs(this.subs, key) ?? [];
        new Array().concat(subs).forEach((s: DocSub<K, Map, Msg>) => s.event(ev));
        return {};
      };
      setListener(this.listeners, key, listener);
      this.doAddListener(key, listener);
    }
  }

  private releaseListener<K extends keyof Map>(key: K) {
    const listener: Listener<Map[K]> | undefined = getListener(this.listeners, key);
    if (listener) {
      setListener(this.listeners, key, undefined);
      this.doRemoveListener(key, listener);
    }
  }

  /**
   * Subscribe to an event.
   * @param key the event type to subscribe to.
   * @param mapper map the event to a message.
   */
  public on<K extends keyof Map, Msg>(key: K, mapper: (e: Map[K]) => Msg): Sub<Msg> {
    return new DocSub<K, Map, Msg>(this, key, mapper);
  }
}

/**
 * Subscribe to document events.
 */
export class DocumentEvents<Msg> extends EventMapEvents<DocumentEventMap, Msg> {
  doAddListener<K extends keyof DocumentEventMap>(key: K, listener: (ev: DocumentEventMap[K]) => any): void {
    document.addEventListener(key, listener);
  }

  doRemoveListener<K extends keyof DocumentEventMap>(key: K, listener: (ev: DocumentEventMap[K]) => any): void {
    document.removeEventListener(key, listener);
  }
}

/**
 * Bonus, WindowEvents
 */
export class WindowEvents<Msg> extends EventMapEvents<WindowEventMap, Msg> {
  doAddListener<K extends keyof WindowEventMap>(key: K, listener: (ev: WindowEventMap[K]) => any): void {
    window.addEventListener(key, listener);
  }

  doRemoveListener<K extends keyof WindowEventMap>(key: K, listener: (ev: WindowEventMap[K]) => any): void {
    window.removeEventListener(key, listener);
  }
}
