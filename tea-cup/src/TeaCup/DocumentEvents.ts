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

type KeyType = keyof DocumentEventMap

type Listener<E> = (ev: E) => any;

type ListenerMap<T> = {
  [K in keyof T]?: Listener<T[K]>
}

const listeners: ListenerMap<DocumentEventMap> = {}

function initListener<K extends keyof DocumentEventMap>(key: K) {
  if (!listeners[key]) {
    const listener = (ev: DocumentEventMap[K]) => {
      const subs: SubsMap<any>[K] = getSubs(allSubs, key) ?? [];
      new Array().concat(subs).forEach((s: DocSub<K, any>) => s.event(ev))
      return {};
    };
    setListener(listeners, key, listener);
    document.addEventListener(key, listener);
  }
}

function releaseListener<K extends keyof DocumentEventMap>(key: K) {
  const listener: Listener<DocumentEventMap[K]> | undefined = getListener(listeners, key);
  if (listener) {
    setListener(listeners, key, undefined);
    document.removeEventListener(key, listener);
  }
}

function setListener<T, K extends keyof T>(o: ListenerMap<T>, k: K, v: Listener<T[K]> | undefined) {
  o[k] = v;
}

function getListener<T, K extends keyof T>(o: ListenerMap<T>, k: K): Listener<T[K]> | undefined {
  return o[k];
}

type SubsMap<M> = {
  [K in keyof DocumentEventMap]?: ReadonlyArray<DocSub<K, M>>
}

let allSubs: SubsMap<any> = {}

function addSub<K extends keyof DocumentEventMap, M>(key: K, sub: DocSub<K, M>) {
  initListener(key);
  const subs: SubsMap<M>[K] = getSubs(allSubs, key) ?? [];
  setSubs(allSubs, key, addOneSub(sub, subs))
}

function removeSub<K extends keyof DocumentEventMap, M>(key: K, sub: DocSub<K, M>) {
  const subs: SubsMap<M>[K] = getSubs(allSubs, key) ?? [];
  const subs1 = removeOneSub(sub, subs)
  setSubs(allSubs, key, subs1)
  if (!subs1) {
    releaseListener(key);
  }
}

function addOneSub<K extends keyof DocumentEventMap, M>(sub: DocSub<K, M>, subs: SubsMap<M>[K]): SubsMap<M>[K] {
  const result = new Array().concat(subs);
  result.push(sub);
  return result;
}

function removeOneSub<K extends keyof DocumentEventMap, M>(sub: DocSub<K, M>, subs: SubsMap<M>[K]): SubsMap<M>[K] | undefined {
  const result = new Array().concat(subs).filter(s => s !== sub);
  return result.length !== 0 ? result : undefined;
}
function getSubs<K extends keyof DocumentEventMap, M>(o: SubsMap<M>, k: K): SubsMap<M>[K] | undefined {
  return o[k];
}

function setSubs<K extends keyof DocumentEventMap, M>(o: SubsMap<M>, k: K, v: SubsMap<M>[K] | undefined) {
  o[k] = v;
}

class DocSub<K extends keyof DocumentEventMap, M> extends Sub<M> {

  constructor(
    private readonly key: K,
    private readonly mapper: (t: DocumentEventMap[K]) => M
  ) {
    super();
  }

  protected onInit() {
    super.onInit();
    addSub(this.key, this)
  }

  protected onRelease() {
    super.onRelease();
    removeSub(this.key, this);
  }

  event(e: DocumentEventMap[K]) {
    this.dispatch(this.mapper(e));
  }
}

/**
 * Subscribe to a document event.
 * @param key the event type to subscribe to.
 * @param mapper map the event to a message.
 */

export function onDocument<K extends keyof DocumentEventMap, M>(key: K, mapper: (e: DocumentEventMap[K]) => M): Sub<M> {
  return new DocSub(key, mapper);
}

///

export function onClick<M>(mapper: (e: MouseEvent) => M): Sub<M> {
  return onDocument("click", mapper);
}

// etc.