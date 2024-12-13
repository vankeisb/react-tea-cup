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
import {Cmd, Dispatcher, just, Maybe, noCmd, nothing, Sub} from 'tea-cup-core';
import {DocumentEvents} from "react-tea-cup";

export type Model = {
    selected: Maybe<string>
    mouseUpCounter: number
};

export type Msg = {
        type: 'selected',
        value: string
    }
    | { type: 'mouse-up' };

export function init(): [Model, Cmd<Msg>] {
    return noCmd({
        selected: nothing,
        mouseUpCounter: 0
    });
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    const value = model.selected.withDefault("select me");
    return (
        <div className="select">
            <p><em>(Use me with Firefox, too.)</em></p>
            <select value={value}
                    onChange={e => {
                        console.log("FW onChange", e.target.value)
                        dispatch({type: 'selected', value: e.target.value});
                    }}
            >
                <option value={"select me"}>Select me...</option>
                {Array.of(1, 2, 3, 4, 5)
                    .map(i =>
                        <option
                            key={i}
                            value={i}>
                            {`Option ${i}`}
                        </option>)
                }
            </select>
            <br/>
            <p>{`Saw ${model.mouseUpCounter} mouse up events.`}</p>
        </div>
    );
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case 'selected': {
            const model1: Model = {
                ...model,
                selected: msg.value !== 'select me' ? just(msg.value) : nothing
            };
            return [model1, Cmd.none()];
        }
        case "mouse-up": {
            const model1: Model = {
                ...model,
                mouseUpCounter: model.mouseUpCounter + 1
            };
            return [model1, Cmd.none()];
        }
    }
}

const documentEvents = new DocumentEvents<Msg>();

export function subscriptions(_model: Model): Sub<Msg> {
    return Sub.batch([
        documentEvents.on('mouseup', () => (
            {
                type: 'mouse-up',
            } as Msg
        ), {passive: true, capture: false}),
    ]);
}
