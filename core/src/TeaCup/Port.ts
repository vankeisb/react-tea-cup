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

import {Sub} from "./Sub";

export class Port<T> {
  private subs: PortSub<T, any>[] = [];

  send(t: T): void {
    this.subs.forEach((s) => s.notify(t));
  }

  subscribe<M>(f: (t: T) => M): Sub<M> {
    return new PortSub(
        f,
        (p) => this.subs.push(p),
        (p) => {
          this.subs = this.subs.filter((x) => x !== p);
        },
    );
  }
}

class PortSub<T, M> extends Sub<M> {
  constructor(
      private readonly f: (t: T) => M,
      private readonly _onInit: (p: PortSub<T, M>) => void,
      private readonly _onRelease: (p: PortSub<T, M>) => void,
  ) {
    super();
  }

  protected onInit() {
    this._onInit(this);
  }

  protected onRelease() {
    this._onRelease(this);
  }

  notify(t: T): void {
    this.dispatch(this.f(t));
  }
}
