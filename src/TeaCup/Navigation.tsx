import {Program, ProgramProps} from "./Program";
import {Cmd, noCmd} from "./Cmd";
import {Dispatcher} from "./Dispatcher";
import {Sub} from "./Sub";
import {Task} from "./Task";
import {Ok, Result} from "./Result";
import * as React from 'react';
import {Component, createRef, FunctionComponent, ReactNode, RefObject} from "react";
import {just, Maybe, nothing} from "./Maybe";


export interface NavProps<Model,Msg> {
    readonly onUrlChange: (l:Location) => Msg,
    readonly init: (l:Location) => [Model, Cmd<Msg>],
    readonly view: (dispatch: Dispatcher<Msg>, m:Model) => ReactNode,
    readonly update: (msg:Msg, model: Model) => [Model, Cmd<Msg>]
    readonly subscriptions: (model: Model) => Sub<Msg>
}


export class ProgramWithNav<Model, Msg> extends Component<NavProps<Model,Msg>, any> {

    private listener: Maybe<EventListener>;
    private readonly ref: RefObject<Program<Model,Msg>> = createRef();

    constructor(props: Readonly<NavProps<Model, Msg>>) {
        super(props);
        this.listener = nothing;
    }


    render(): React.ReactNode {
        return (
            <Program
                init={() => this.props.init(window.location)}
                view={this.props.view}
                update={this.props.update}
                subscriptions={this.props.subscriptions}
                ref={this.ref}/>
        )
    }


    componentDidMount(): void {
        console.log("ProgramWithNav.componentDidMount");
        const l = () => {
            if (this.ref.current) {
                this.ref.current.dispatch(this.props.onUrlChange(window.location))
            }
        };
        this.listener = just(l);
        window.addEventListener("popstate", l);
    }

    componentWillMount(): void {
        console.log("ProgramWithNav.componentWillUnmount");
        if (this.listener.type === "Just") {
            window.removeEventListener("popstate", this.listener.value);
            this.listener = nothing;
        }
    }
}


//
//
// export class ProgramWithNavigation<Model,Msg> extends ProgramBase<Model,Msg,NavProps<Model,Msg>> {
//
//
//     constructor(props: Readonly<NavProps<Model, Msg>>) {
//         super({
//             init: () =>
//                 props.init(document.location),
//             view: props.view,
//             update: props.update,
//             subscriptions: props.subscriptions
//         });
//     }
//
//
//
// }

export function newUrl(url: string): Task<never,Location> {
    return new NewUrlTask(url);
}


class NewUrlTask extends Task<never,Location> {

    readonly url: string;

    constructor(url: string) {
        super();
        this.url = url;
    }

    execute(callback: (r: Result<never, Location>) => void): void {
        window.history.pushState({}, "", this.url);
        callback(new Ok(document.location));
    }


}
