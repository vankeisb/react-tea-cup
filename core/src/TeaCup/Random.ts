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

import { Task } from './Task';
import { ok, Result } from './Result';

/**
 * Generate Rantom numbers.
 */
export class Random {
  /**
   * Generate a random int between lo and hi
   * @param lo
   * @param hi
   */
  static fromIntervalInclusive(lo: number, hi: number): Task<never, number> {
    return new RandomTask(lo, hi);
  }
}

class RandomTask extends Task<never, number> {
  private readonly lo: number;
  private readonly hi: number;

  constructor(lo: number, hi: number) {
    super();
    this.lo = lo;
    this.hi = hi;
  }

  execute(callback: (r: Result<never, number>) => void): void {
    callback(ok(randomIntFromInterval(this.lo, this.hi)));
  }
}

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
