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

import { Program } from './Program';
import { List, Cmd, Dispatcher, Sub, Task, Ok, Result, just, Maybe, maybeOf, nothing } from 'tea-cup-core';
import * as React from 'react';
import { Component, createRef, ReactNode, RefObject } from 'react';
import { DevTools } from './DevTools';

/**
 * Props for the ProgramWithNav.
 */
export interface NavProps<Model, Msg> {
  readonly onUrlChange: (l: Location) => Msg;
  readonly init: (l: Location) => [Model, Cmd<Msg>];
  readonly view: (dispatch: Dispatcher<Msg>, m: Model) => ReactNode;
  readonly update: (msg: Msg, model: Model) => [Model, Cmd<Msg>];
  readonly subscriptions: (model: Model) => Sub<Msg>;
  readonly devTools?: DevTools<Model, Msg>;
}

/**
 * Program that handles navigation (routing).
 */
export class ProgramWithNav<Model, Msg> extends Component<NavProps<Model, Msg>, any> {
  private listener: Maybe<EventListener>;
  private readonly ref: RefObject<Program<Model, Msg>> = createRef();

  constructor(props: Readonly<NavProps<Model, Msg>>) {
    super(props);
    this.listener = nothing;
  }

  render(): React.ReactNode {
    return (
      <Program
        init={() => this.props.init(window.location)}
        view={this.props.view}
        update={this.props.update}
        subscriptions={this.props.subscriptions}
        devTools={this.props.devTools}
        ref={this.ref}
      />
    );
  }

  componentDidMount(): void {
    const l = () => {
      if (this.ref.current) {
        this.ref.current.dispatch(this.props.onUrlChange(window.location));
      }
    };
    this.listener = just(l);
    window.addEventListener('popstate', l);
  }

  componentWillMount(): void {
    if (this.listener.type === 'Just') {
      window.removeEventListener('popstate', this.listener.value);
      this.listener = nothing;
    }
  }
}

/**
 * Return a Task that will eventually change the browser location via historty.pushState,
 * and send back a Msg into the Program
 * @param url the url to navigate to
 */
export function newUrl(url: string): Task<never, Location> {
  return new NewUrlTask(url);
}

class NewUrlTask extends Task<never, Location> {
  readonly url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  execute(callback: (r: Result<never, Location>) => void): void {
    const state = {};
    window.history.pushState(state, '', this.url);
    const popStateEvent = new PopStateEvent('popstate', { state: state });
    dispatchEvent(popStateEvent);
    callback(new Ok(document.location));
  }
}

// router
// ------

export abstract class PathElem<T> {
  abstract mapPart(part: string): Maybe<T>;
}

class ConstantPathElem extends PathElem<string> {
  readonly s: string;

  constructor(s: string) {
    super();
    this.s = s;
  }

  mapPart(part: string): Maybe<string> {
    if (part === this.s) {
      return just(part);
    } else {
      return nothing;
    }
  }
}

class RegexPathElem<T> extends PathElem<T> {
  private readonly regex: RegExp;
  private readonly converter: (s: string) => Maybe<T>;

  constructor(regex: RegExp, converter: (s: string) => Maybe<T>) {
    super();
    this.regex = regex.compile();
    this.converter = converter;
  }

  mapPart(part: string): Maybe<T> {
    if (this.regex.test(part)) {
      return this.converter(part);
    } else {
      return nothing;
    }
  }
}

class IntPathElem extends RegexPathElem<number> {
  constructor() {
    super(new RegExp('^\\d+$'), (s) => {
      try {
        const i = parseInt(s, 10);
        if (isNaN(i)) {
          return nothing;
        } else {
          return just(i);
        }
      } catch (e) {
        return nothing;
      }
    });
  }

  static INSTANCE: IntPathElem = new IntPathElem();
}

class StrPathElem extends PathElem<string> {
  mapPart(part: string): Maybe<string> {
    return just(part);
  }
}

export function str(s?: string): PathElem<string> {
  if (s === undefined) {
    return new StrPathElem();
  } else {
    return new ConstantPathElem(s);
  }
}

export function int(): PathElem<number> {
  return IntPathElem.INSTANCE;
}

export function regex<T>(r: RegExp, converter: (s: string) => Maybe<T>): PathElem<T> {
  return new RegexPathElem(r, converter);
}

export class Path0 {
  map<R>(f: (query: QueryParams) => R): RouteDef<R> {
    return new RouteDef<R>([], f);
  }
}

export class QueryParams {
  private readonly store: { [id: string]: string[] };
  private readonly hash: Maybe<string>;

  private constructor(store: { [id: string]: string[] }, hash: Maybe<string>) {
    this.store = store;
    this.hash = hash;
  }

  getValues(name: string): Maybe<ReadonlyArray<string>> {
    return maybeOf(this.store[name]);
  }

  getValue(name: string): Maybe<string> {
    const values = this.store[name];
    if (values === undefined) {
      return nothing;
    } else {
      return List.fromArray(values).head();
    }
  }

  getHash(): Maybe<string> {
    return this.hash;
  }

  static empty(): QueryParams {
    return new QueryParams({}, nothing);
  }

  static fromQueryStringAndHash(queryString?: string, hash?: string): QueryParams {
    const params = queryString === undefined ? [] : queryString.split('&');
    const store: { [id: string]: string[] } = {};

    function addToStore(name: string, value: string) {
      let values = store[name];
      if (values === undefined) {
        values = [value];
        store[name] = values;
      } else {
        values.push(value);
      }
    }

    params.forEach((param) => {
      const parts = param.split('=');
      if (parts.length === 1) {
        addToStore(parts[0], '');
      } else if (parts.length > 1) {
        addToStore(parts[0], parts[1]);
      }
    });

    return new QueryParams(
      store,
      hash === '' ? nothing : maybeOf(hash).map((h) => (h.startsWith('#') ? h.substring(1) : h)),
    );
  }
}

export class Path1<T> {
  readonly e: PathElem<T>;

  constructor(e: PathElem<T>) {
    this.e = e;
  }

  map<R>(f: (t: T, query: QueryParams) => R): RouteDef<R> {
    return new RouteDef<R>([this.e], f);
  }
}

export class Path2<T1, T2> {
  readonly e1: PathElem<T1>;
  readonly e2: PathElem<T2>;

  constructor(e1: PathElem<T1>, e2: PathElem<T2>) {
    this.e1 = e1;
    this.e2 = e2;
  }

  map<R>(f: (t1: T1, t2: T2, query: QueryParams) => R): RouteDef<R> {
    return new RouteDef<R>([this.e1, this.e2], f);
  }
}

export class Path3<T1, T2, T3> {
  readonly e1: PathElem<T1>;
  readonly e2: PathElem<T2>;
  readonly e3: PathElem<T3>;

  constructor(e1: PathElem<T1>, e2: PathElem<T2>, e3: PathElem<T3>) {
    this.e1 = e1;
    this.e2 = e2;
    this.e3 = e3;
  }

  map<R>(f: (t1: T1, t2: T2, t3: T3, query: QueryParams) => R): RouteDef<R> {
    return new RouteDef<R>([this.e1, this.e2, this.e3], f);
  }
}

export const route0: Path0 = new Path0();

export function route1<E>(e: PathElem<E>): Path1<E> {
  return new Path1<E>(e);
}

export function route2<E1, E2, R>(e1: PathElem<E1>, e2: PathElem<E2>): Path2<E1, E2> {
  return new Path2<E1, E2>(e1, e2);
}

export function route3<E1, E2, E3, R>(e1: PathElem<E1>, e2: PathElem<E2>, e3: PathElem<E3>): Path3<E1, E2, E3> {
  return new Path3<E1, E2, E3>(e1, e2, e3);
}

export interface RouteBase<R> {
  checkRoute(pathname: string, query: QueryParams): Maybe<R>;
}

export class RouteDef<R> implements RouteBase<R> {
  readonly pathElems: ReadonlyArray<PathElem<any>>;
  readonly f: Function;

  constructor(pathElems: ReadonlyArray<PathElem<any>>, f: Function) {
    this.pathElems = pathElems;
    this.f = f;
  }

  static sanitizePath(path: string): string {
    const p1 = path.startsWith('/') ? path.substring(1) : path;
    return p1.endsWith('/') ? p1.substring(0, p1.length - 2) : p1;
  }

  static splitPath(path: string): ReadonlyArray<string> {
    const p = RouteDef.sanitizePath(path);
    return p === '' ? [] : p.split('/').map(decodeURIComponent);
  }

  checkRoute(pathname: string, query: QueryParams): Maybe<R> {
    // extract path parts from location and split
    const parts = RouteDef.splitPath(pathname);
    if (parts.length === this.pathElems.length) {
      // map every individual part, bail out if
      // something cannot be converted
      const mappedParts = [];
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const pe = this.pathElems[i];
        const mapped = pe.mapPart(part);
        switch (mapped.type) {
          case 'Just':
            mappedParts.push(mapped.value);
            break;
          case 'Nothing':
            return nothing;
        }
      }

      // append query params to args
      mappedParts.push(query);

      // now we have mapped args, let's call the route's func
      return just(this.f.apply({}, mappedParts));
    } else {
      return nothing;
    }
  }
}

export class Router<R> {
  readonly routes: ReadonlyArray<RouteBase<R>>;

  constructor(...routeDefs: RouteBase<R>[]) {
    this.routes = routeDefs;
  }

  parse(pathname: string, query: QueryParams): Maybe<R> {
    // try all routes one after the other
    for (let i = 0; i < this.routes.length; i++) {
      const d = this.routes[i];
      const r = d.checkRoute(pathname, query);
      if (r.type === 'Just') {
        return r;
      }
    }
    return nothing;
  }

  parseLocation(location: Location): Maybe<R> {
    return this.parse(location.pathname, QueryParams.fromQueryStringAndHash(location.search, location.hash));
  }
}
