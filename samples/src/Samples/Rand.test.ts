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

import { view, Msg, update, init } from "./Rand";
import { shallow } from 'enzyme';
import { Testing } from "react-tea-cup";
import { Cmd, nothing, just } from "tea-cup-core";
import { describe, test, expect } from "vitest";
import { configure } from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-16';
import 'jsdom-global/register';

const testing = new Testing<Msg>();
configure({ adapter: new EnzymeAdapter() });

describe("Test Rand", () => {

    describe("init state", () => {

        test("triggers message", () => {
            const [state, cmd] = init();
            expect(state).toEqual(nothing);
            expect(cmd).not.toEqual(Cmd.none());
        });

    });

    describe("view state", () => {

        test("render nothing", () => {
            const wrapper = shallow(view(testing.noop, nothing))
            expect(wrapper.find('div > p').at(0).text()).toEqual('This is a random number :');
        });

        test("render something", () => {
            const wrapper = shallow(view(testing.noop, just(13)));
            expect(wrapper.find('div > p').at(0).text()).toEqual('This is a random number :13');
        });

        test("render button", () => {
            const wrapper = shallow(view(testing.noop, just(13)));
            expect(wrapper.find('div > p').at(0).text()).toEqual('This is a random number :13');
            expect(wrapper.find('div > button')).toHaveLength(1);
            expect(wrapper.find('div > button').at(0).text()).toEqual('Randomize');
        });

        test("snapshot nothing", () => {
            const wrapper = shallow(view(testing.noop, nothing))
            expect(wrapper).toMatchSnapshot();
        });

        test("snapshot", () => {
            const wrapper = shallow(view(testing.noop, just(13)))
            expect(wrapper).toMatchSnapshot();
        });
    });

    describe("click generate message", () => {

        test("clicked message", () => {
            const wrapper = shallow(view(testing.dispatcher, nothing));
            wrapper.find('div > button').at(0).simulate('click');
            expect(testing.dispatched).toEqual({ type: "clicked" });
        });
    });

    describe("message updates state", () => {

        test("clicked", () => {
            const [newState, cmd] = update({ type: "clicked" }, just(13));
            expect(newState).toEqual(just(13));
            expect(cmd).not.toEqual(Cmd.none());
        });

        test("random-received", () => {
            const [newState, cmd] = update({ type: "random-received", value: 1313 }, just(13));
            expect(newState).toEqual(just(1313));
            expect(cmd).toEqual(Cmd.none());
        });

    });

});

