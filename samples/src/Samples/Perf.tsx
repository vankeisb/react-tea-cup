import {Cmd, Dispatcher, memo, noCmd, Sub} from "react-tea-cup";
import * as React from 'react';


export type Model = Readonly<{
    value: number;
}>


function randomIntFromInterval(min: number,max: number)  {// min and max included
    return Math.floor(Math.random()*(max-min+1)+min);
}

function veryExpensiveView(model: Model) {
    let s = "";
    const now = new Date().getTime();
    const max = 1000 * (randomIntFromInterval(10, 20));
    for (let i=0; i<max; i++) {
        s = "heyhoooooo" + i;
        for (let j=0; j<max; j++) {
            // if (s.length > 10) {
            //     console.log(s);
            // }
        }
    }
    const elapsed = new Date().getTime() - now;
    return <span>{model.value} (that was long, took {elapsed} ms)</span>;
}


export type Msg = { type: "inc" }


export function init(): [Model, Cmd<Msg>] {
    return [
        { value: 0 },
        Cmd.none<Msg>()
    ]
}


export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return memo(model)((model:Model) => (
        <div>
            <p>
                Hello, I am very expensive to render.
                My current value is {veryExpensiveView(model)}.
            </p>
            <p>
                Therefore, I use Memo in order to avoid rendering when
                I don't need to (and impact the whole app !).
            </p>
            <button onClick={() => dispatch({type:"inc"})}>Increment me</button>
        </div>
    ))
}


export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "inc":
            return noCmd({
                ...model,
                value: model.value + 1
            })
    }
}