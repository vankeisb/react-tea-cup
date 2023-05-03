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
type ListenerOptions = boolean | AddEventListenerOptions;
type Mapper<E, Msg> = (ev: E) => Msg;

let subCount = 0;

class DocSub<K extends keyof Map, Map, Msg> extends Sub<Msg> {
  private readonly listener: Listener<Map[K]>;
  private sc: number;

  constructor(
    private readonly documentEvents: EventMapEvents<Map, Msg>,
    private readonly key: K,
    private readonly mapper: Mapper<Map[K], Msg>,
    private readonly options?: ListenerOptions,
  ) {
    super();
    subCount++;
    this.sc = subCount;
    this.listener = (e) =>
      this.isActive() &&
      setTimeout(() => {
        this.dispatch(this.mapper(e));
      });
  }

  protected onInit() {
    super.onInit();
    this.documentEvents.doAddListener(this.key, this.listener, this.options);
  }

  protected onRelease() {
    super.onRelease();
    this.documentEvents.doRemoveListener(this.key, this.listener, this.options);
  }
}

abstract class EventMapEvents<Map, Msg> {
  abstract doAddListener<K extends keyof Map>(
    key: K,
    listener: (ev: Map[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;

  abstract doRemoveListener<K extends keyof Map>(
    key: K,
    listener: (ev: Map[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * Subscribe to an event.
   * @param key the event type to subscribe to.
   * @param mapper map the event to a message.
   * @param options options for this listener
   */
  public on<K extends keyof Map, Msg>(
    key: K,
    mapper: (e: Map[K]) => Msg,
    options?: boolean | AddEventListenerOptions,
  ): Sub<Msg> {
    return new DocSub<K, Map, Msg>(this, key, mapper, options);
  }
}

/**
 * Subscribe to document events.
 */
export class DocumentEvents<Msg> extends EventMapEvents<DocumentEventMap, Msg> {
  doAddListener<K extends keyof DocumentEventMap>(
    key: K,
    listener: (ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    document.addEventListener(key, listener, options);
  }

  doRemoveListener<K extends keyof DocumentEventMap>(
    key: K,
    listener: (ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    document.removeEventListener(key, listener, options);
  }
}

/**
 * Bonus, WindowEvents
 */
export class WindowEvents<Msg> extends EventMapEvents<WindowEventMap, Msg> {
  doAddListener<K extends keyof WindowEventMap>(
    key: K,
    listener: (ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    window.addEventListener(key, listener, options);
  }

  doRemoveListener<K extends keyof WindowEventMap>(
    key: K,
    listener: (ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    window.removeEventListener(key, listener, options);
  }
}
