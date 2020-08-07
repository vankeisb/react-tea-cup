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

import { Dispatcher } from './Dispatcher';

export abstract class Sub<Msg> {
  protected dispatcher: Dispatcher<Msg> | undefined;

  static none<Msg>(): Sub<Msg> {
    return new SubNone();
  }

  static batch<Msg>(subs: Array<Sub<Msg>>): Sub<Msg> {
    return new BatchSub(subs);
  }

  init(dispatch: Dispatcher<Msg>): void {
    this.dispatcher = dispatch;
    this.onInit();
  }

  release(): void {
    this.dispatcher = undefined;
    this.onRelease();
  }

  protected dispatch(m: Msg): void {
    this.dispatcher && this.dispatcher(m);
  }

  protected onInit() {}

  protected onRelease() {}

  map<ParentMsg>(f: (m: Msg) => ParentMsg): Sub<ParentMsg> {
    return new MappedSub(this, f);
  }
}

class SubNone<Msg> extends Sub<Msg> {}

class BatchSub<Msg> extends Sub<Msg> {
  private readonly subs: Array<Sub<Msg>>;

  constructor(subs: Array<Sub<Msg>>) {
    super();
    this.subs = subs;
  }

  init(dispatch: Dispatcher<Msg>): void {
    this.subs.forEach((s) => s.init(dispatch));
  }

  release(): void {
    this.subs.forEach((s) => s.release());
  }
}

class MappedSub<Msg, ParentMsg> extends Sub<ParentMsg> {
  private readonly childSub: Sub<Msg>;
  private readonly mapper: (cm: Msg) => ParentMsg;

  constructor(childSub: Sub<Msg>, mapper: (cm: Msg) => ParentMsg) {
    super();
    this.childSub = childSub;
    this.mapper = mapper;
  }

  init(dispatch: Dispatcher<ParentMsg>): void {
    this.childSub.init((m: Msg) => {
      dispatch(this.mapper(m));
    });
  }

  release(): void {
    this.childSub.release();
  }
}
