import {Dispatcher} from "./TeaCup/Dispatcher";
import React from 'react';
import {Cmd, noCmd} from "./TeaCup/Cmd";

export interface Model {
    value: string
}

export type Msg
    = { type: "add" }
    | { type: "remove" }


export function init(): Model {
    return {
        value: "abcdefg"
    }
}


export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div>
            <button
                disabled={model.value.length == 0}
                onClick={() => dispatch({type: "remove"})}>
                Remove char
            </button>
            <p>Text: <em>{model.value}</em></p>
            <button
                disabled={model.value.length == 0}
                onClick={() => dispatch({type: "add"})}>
                Add char
            </button>
        </div>
    )
}


export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "add":
            return noCmd({...model, value: model.value + "x"});
        case "remove":
            return noCmd(
                model.value.length > 0
                    ? {...model, value: model.value.substring(0, model.value.length - 1)}
                    : model
            );
    }
}