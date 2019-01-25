import {Component} from "react";
import React from "react";

export interface MyProps {
    foo: string
}

interface MyState {
    i: number
}

export class MyStatefulComponent extends Component<MyProps, MyState> {


    constructor(props: Readonly<MyProps>) {
        super(props);
        this.state = {
            i: 0
        }
    }

    render() {
        return (
            <div>
                <h3>I am stateful</h3>
                <p>
                Yo: {this.props.foo + " " + this.state.i}
                </p>
                <button onClick={() =>
                    this.setState({...this.state, i: this.state.i + 1 })
                }>
                    Click me
                </button>
            </div>
        );
    }
}
