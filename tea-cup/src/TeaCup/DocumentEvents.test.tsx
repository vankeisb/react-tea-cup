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

import { JSDOM } from "jsdom"
import { onDocument, hardReset } from "./DocumentEvents";

const dom = new JSDOM()
global.document = dom.window.document

describe("DocumentEvents Test", () => {

    const addSpy = jest.fn()
    const removeSpy = jest.fn()

    document.addEventListener = addSpy
    document.removeEventListener = removeSpy

    afterEach(() => {
        addSpy.mockReset();
        removeSpy.mockReset();
        hardReset();
    })

    it("first sub adds listener", () => {
        const sub = onDocument('click', (e) => 'clicked');
        sub.init(() => ({}))

        expect(addSpy.mock.calls.length).toBe(1)
    })

    it("second sub adds no listener", () => {
        const sub = onDocument('click', (e) => 'clicked');
        sub.init(() => ({}))

        expect(addSpy.mock.calls.length).toBe(1)

        const sub2 = onDocument('click', (e) => 'clicked2');
        sub2.init(() => ({}))

        expect(addSpy.mock.calls.length).toBe(1)
    })

    it("last sub removes listener", () => {
        const sub = onDocument('click', (e) => 'clicked');
        sub.init(() => ({}))

        const sub2 = onDocument('click', (e) => 'clicked2');
        sub2.init(() => ({}))

        sub.release()
        expect(removeSpy.mock.calls.length).toBe(0)

        sub2.release()
        expect(removeSpy.mock.calls.length).toBe(1)
    })

    it("sub receives event from listener", () => {
        const msgs: string[] = [];
        const collectMsgs = (msg: string): void => {
            msgs.push(msg);
        };

        const sub = onDocument('click', (e) => 'clicked1');
        sub.init(collectMsgs);

        expect(addSpy.mock.calls.length).toBe(1)
        const listener = addSpy.mock.calls[0][1];

        listener({ event: 'event' });
        expect(msgs).toEqual(['clicked1']);
    })


    it("two subs receive events from listener", () => {
        const msgs: string[] = [];
        const collectMsgs = (msg: string): void => {
            msgs.push(msg);
        };

        const sub = onDocument('click', (e) => 'clicked1');
        const sub2 = onDocument('click', (e) => 'clicked2');

        sub.init(collectMsgs);
        sub2.init(collectMsgs);

        expect(addSpy.mock.calls.length).toBe(1)
        const listener = addSpy.mock.calls[0][1];

        listener({ event: 'event' });
        expect(msgs).toEqual(['clicked1', 'clicked2']);
    })


    it("sub stops receiving events from listener", () => {
        const sub = onDocument('click', (e) => 'clicked1');

        const msgs: string[] = [];
        sub.init((msg) => {
            msgs.push(msg)
        });

        expect(addSpy.mock.calls.length).toBe(1)
        const listener = addSpy.mock.calls[0][1];

        listener({ event: 'event' });
        listener({ event: 'event' });
        expect(msgs).toEqual(['clicked1', 'clicked1']);

        sub.release();
        listener({ event: 'event' });
        expect(msgs).toEqual(['clicked1', 'clicked1']);
    })

})