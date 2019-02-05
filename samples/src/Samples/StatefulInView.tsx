import {Cmd, Dispatcher, memo, noCmd} from "react-tea-cup";
import * as React from 'react';

export type Model = number


export type Msg = "add" | "remove"


export function init(): [Model, Cmd<Msg>] {
    return noCmd(0)
}


export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div>
            <p>I'm another counter, that embeds a stateful component in view()</p>
            <p>Value = {model}</p>
            <button onClick={() => dispatch("add")}>Add</button>
            <button onClick={() => dispatch("remove")}>Remove</button>
            <MyComponent initialValue={123} />
            {memoizedView(dispatch, model)}
        </div>
    )
}


function memoizedView(dispatch: Dispatcher<Msg>, model: Model) {
    return memo(model)((m:Model) =>
        <div>
            I am memoized, and I include another stateful component...
            <MyComponent initialValue={456}/>
        </div>
    )
}



export function update(msg: Msg, model: Model) : [Model, Cmd<Msg>] {
    switch (msg) {
        case "add":
            return noCmd(model + 1);
        case "remove":
            return noCmd(model - 1);
    }
}



type MyProps = Readonly<{
    initialValue: number
}>


type MyState = Readonly<{
    value: number
}>


class MyComponent extends React.Component<MyProps, MyState> {

    constructor(props: Readonly<MyProps>) {
        super(props);
        this.state = {
            value: props.initialValue
        };
    }


    render(): React.ReactNode {
        return (
            <div>
                I am stateful !
                My value is {this.state.value}, you can
                <button onClick={() => {
                    this.setState({
                        value: Math.random()
                    })
                }}>randomize</button> another value...
            </div>
        )
    }

}