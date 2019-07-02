import * as React from "react";
import {Cmd, Dispatcher, noCmd, Sub, Task, Time} from "react-tea-cup";


export interface Model {
    readonly currentTime: number;
    readonly inTime: boolean;
    readonly inProgress: boolean;
    readonly ticking: boolean;
    readonly ticks1: number;
    readonly ticks2: number;
}

export type Msg
    = { tag: "get-cur-time" }
    | { tag: "got-cur-time", currentTime: number }
    | { tag: "get-in" }
    | { tag: "got-in", result: number }
    | { tag: "toggle-tick" }
    | { tag: "got-tick", isFirst: boolean }


function gotCurTime(currentTime: number): Msg  {
    return {
        tag: "got-cur-time",
        currentTime
    }
}

function gotInTime(r: number): Msg {
    return {
        tag: "got-in",
        result: r
    }
}

function gotTick(isFirst: boolean): () => Msg {
    return () => ({
        tag: "got-tick",
        isFirst
    })
}


export function init(): [Model, Cmd<Msg>] {
    return noCmd({
        currentTime: -1,
        inTime: false,
        inProgress: false,
        ticking: false,
        ticks1: 0,
        ticks2: 0
    })
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <>
            <div>
                Current time : {model.currentTime}
                { " " }
                <button
                    onClick={() =>
                        dispatch({ tag: "get-cur-time" })
                    }
                >
                    Get current time
                </button>
            </div>
            <div>
                In :
                {
                    model.inProgress
                        ? "..."
                        : (model.inTime ? "true" : "false")
                }
                { " " }
                <button
                    onClick={() => dispatch({tag: "get-in"})}
                    disabled={model.inProgress}
                >
                    Trigger in
                </button>
            </div>
            <div>
                Ticks1 : {model.ticks1}, ticks2 : {model.ticks2}
                { " " }
                <button
                    onClick={() => dispatch({tag: "toggle-tick"})}
                >
                    { model.ticking ? "stop ticking" : "start ticking" }
                </button>
            </div>
        </>
    )
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.tag) {
        case "get-cur-time": {
            return [
                {
                    ...model, currentTime: -1
                },
                Task.perform(
                    Time.now(),
                    gotCurTime
                )
            ]
        }
        case "got-cur-time": {
            return noCmd({
                ...model, currentTime: msg.currentTime
            })
        }
        case "get-in": {
            return [
                { ...model, inTime: false, inProgress: true },
                Task.perform(
                    Time.in(1000),
                    gotInTime
                )
            ]
        }
        case "got-in": {
            return noCmd({
                ...model, inTime: true, inProgress: false
            })
        }
        case "toggle-tick": {
            return noCmd({
                ...model, ticking: !model.ticking
            })
        }
        case "got-tick": {
            return noCmd(
                msg.isFirst
                    ? { ...model, ticks1: model.ticks1 + 1 }
                    : { ...model, ticks2: model.ticks2 + 1 }
            )
        }
    }
}

export function subscriptions(model: Model): Sub<Msg> {
    if (model.ticking) {
        return Sub.batch([
            Time.every(1000, gotTick(true)),
            Time.every(2000, gotTick(false))
        ])
    } else {
        return Sub.none();
    }
}
