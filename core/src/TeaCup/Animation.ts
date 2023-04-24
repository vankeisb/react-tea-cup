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

import { Sub } from './Sub';

let subs: Array<RafSub<any>> = [];

let ticking = false;

function tick() {
  console.log("tick()");
  if (!ticking) {
    ticking = true;
    requestAnimationFrame((t: number) => {
      console.log("got RAF", t, "subs", subs.length);
      subs.forEach((s) => s.trigger(t));
      ticking = false;
    });
  }
}

class RafSub<M> extends Sub<M> {
  readonly mapper: (t: number) => M;

  constructor(mapper: (t: number) => M) {
    super();
    this.mapper = mapper;
  }

  protected onInit() {
    super.onInit();
    subs.push(this);
    tick();
  }

  protected onRelease() {
    super.onRelease();
    subs = subs.filter((s) => s !== this);
  }

  trigger(t: number) {
    this.dispatch(this.mapper(t));
  }
}

export function onAnimationFrame<M>(mapper: (t: number) => M): Sub<M> {
  return new RafSub(mapper);
}
