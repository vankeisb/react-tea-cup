
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

import { Dispatcher, Cmd } from "react-tea-cup";
import diff from "jest-diff";

export function extendJest<M>(expect: jest.Expect) {
    expect.extend({
        toHaveDispatchedMsg(received: Testing<M>, expected: M) {
            const pass = this.equals(received.dispatched(), expected);

            const message = pass
                ? () => this.utils.matcherHint('toHaveDispatchedMsg', this.utils.printExpected(expected), this.utils.printReceived(received))
                : () => {
                    const diffString = diff(expected, received, {
                        expand: this.expand,
                    });
                    return (
                        this.utils.matcherHint('toHaveDispatchedMsg', undefined, undefined) +
                        '\n\n' +
                        (diffString && diffString.includes('- Expect')
                            ? `Difference:\n\n${diffString}`
                            : `Expected: ${this.utils.printExpected(expected)}\n` +
                            `Received: ${this.utils.printReceived(received)}`)
                    );
                };

            return { actual: received, message, pass };
        }
    });
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveDispatchedMsg<M>(value: M): CustomMatcherResult;
        }
    }
}

export class Testing<M> {
    private dispatchedMsg: M | undefined;

    public Testing() {
    }

    public readonly noop: Dispatcher<M> = () => { }

    public dispatcher(): Dispatcher<M> {
        this.dispatchedMsg = undefined;
        return (msg: M) => {
            this.dispatchedMsg = msg;
        }
    }

    public dispatched(): M | undefined {
        return this.dispatchedMsg;
    }

    public dispatchedFrom(cmd: Cmd<M>): Promise<M> {
        return new Promise<M>((resolve, reject) => {
            const dispatchedMsg = (msg: M) => {
                resolve(msg);
            };
            cmd.execute(dispatchedMsg);
        });
    }
}