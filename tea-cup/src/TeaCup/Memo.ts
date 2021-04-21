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

import * as React from 'react';

function compareRefEquals<T>(o1: T, o2: T): boolean {
  return o1 === o2;
}

/**
 * Memoize the view for passed data.
 * @param t the data to memoize.
 * @param compareFn optional comparison function. Defaults to ref equality
 */
export function memo<T>(t: T, compareFn?: (o1: T, o2: T) => boolean) {
  const equals = compareFn ?? compareRefEquals;
  return (f: (t: T) => React.ReactNode) => {
    return React.createElement(Memo, {
      value: t,
      renderer: (x: any) => {
        return f(x);
      },
      compareFn: equals,
    });
  };
}

interface MemoProps {
  value: any;
  renderer: (x: any) => React.ReactNode;
  compareFn: (o1: any, o2: any) => boolean;
}

class Memo<T> extends React.Component<MemoProps> {
  render(): React.ReactNode {
    return this.props.renderer(this.props.value);
  }

  shouldComponentUpdate(nextProps: Readonly<MemoProps>, nextState: Readonly<{}>, nextContext: any): boolean {
    return this.props.compareFn(this.props.value, nextProps.value);
  }
}
