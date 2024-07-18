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

import { view, Msg, update } from "./Counter";
import { render, fireEvent } from '@testing-library/react';
import { extendJest, Testing } from "react-tea-cup";
import * as matchers from '@testing-library/jest-dom/matchers'

extendJest(expect);
const testing = new Testing<Msg>();
expect.extend(matchers)

describe("Test Counter", () => {

    describe("view state", () => {

        test("render counter", () => {
            const { container } = render(view(testing.noop, 13))
            expect(container.querySelector('.counter')).not.toBeNull();
            expect(container.querySelector('.counter > span')).toHaveTextContent("13");
        });

        test("render buttons", () => {
            const { container } = render(view(testing.noop, 1));
            expect(container.querySelectorAll('.counter > button')).toHaveLength(2);
            expect(container.querySelectorAll('.counter > button').item(0)).toHaveTextContent('-');
            expect(container.querySelectorAll('.counter > button').item(1)).toHaveTextContent('+');
        });

        test("snapshot", () => {
            const { container } = render(view(testing.noop, 1313))
            expect(container).toMatchSnapshot();
        });
    });

    describe("clicks generate messages", () => {

        test("decrement", () => {
            const { container } = render(view(testing.dispatcher, 1));
            fireEvent.click(container.querySelectorAll('.counter > button').item(0));
            expect(testing).toHaveDispatchedMsg({ type: "dec" });
        });

        test("increment", () => {
            const { container } = render(view(testing.dispatcher, 1));
            fireEvent.click(container.querySelectorAll('.counter > button').item(1));
            expect(testing).toHaveDispatchedMsg({ type: "inc" });
        });

    });

    describe("messages update state", () => {
        test("decrement", () => {
            const [newState] = update({ type: "dec" }, 13);
            expect(newState).toBe(12);
        });

        test("increment", () => {
            const [newState] = update({ type: "inc" }, 13);
            expect(newState).toBe(14);
        });
    });

});

