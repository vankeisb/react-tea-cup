import {Cmd, Dispatcher, noCmd, Random, Sub, Task} from "react-tea-cup";
import * as React from 'react'

export type Model = number


export type Msg
    = { type: "clicked" }
    | { type: "random-received", value: number }



function randomize(): Cmd<Msg> {
    return Task.perform(
        Random.fromIntervalInclusive(0, 100),
        i => {
            return {
                type: "random-received",
                value: i
            } as Msg
        }
    );
}


export function init(): [Model, Cmd<Msg>] {
    return [ 0, randomize() ]
}


export function view(d:Dispatcher<Msg>, model: Model) {
    return (
        <div>
            This is a random number : {model}
            <br/>
            <button onClick={_ => d({type: "clicked"})}>
                Randomize
            </button>
        </div>
    )
}


export function update(msg: Msg, model: Model) : [Model, Cmd<Msg>] {
    console.log("update", msg, model);
    switch (msg.type) {
        case "clicked":
            return [ model, randomize() ];
        case "random-received":
            return [ msg.value, Cmd.none() ];
    }
}


export function subscriptions(model: Model) {
    return Sub.none()
}
