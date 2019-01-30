import {Component, ReactNode} from 'react';
import {Dispatcher} from "./Dispatcher";
import {Cmd} from "./Cmd";
import { Sub } from './Sub';


interface ProgramProps<Model,Msg> {
    init: () => Model
    view: (dispatch: Dispatcher<Msg>) => (model: Model) => ReactNode
    update: (msg: Msg, model: Model) => [Model, Cmd<Msg>]
    subscriptions: (dispatch: Dispatcher<Msg>) => (model: Model) => Sub<Msg>
}

interface ProgramState<Model> {
    currentModel?: Model
}


export class Program<Model,Msg> extends Component<ProgramProps<Model,Msg>, ProgramState<Model>> {

    dispatch(msg:Msg) {
        // console.log(">>> dispatch", msg);
        if (this.state.currentModel === undefined) {
            // console.log("<<< dispatch : no model, nothing done");
            return;
        }
        // console.log("dispatch : calling update()");
        const updated = this.props.update(msg, this.state.currentModel);
        // console.log("dispatch : new model obtained, setting state");
        this.setState({
            currentModel: updated[0]
        });

        const d = this.dispatch.bind(this);

        // console.log("dispatch: processing commands");
        updated[1].run(d);
        // console.log("dispatch : done");

        // const subs = this.props.subscriptions(this.di)
    }


    constructor(props: Readonly<ProgramProps<Model, Msg>>) {
        super(props);
        // console.log("program ctor : calling init() and setting initial state");
        this.state = {
            currentModel: props.init()
        }
    }

    render(): ReactNode {
        if (this.state.currentModel === undefined) {
            // console.log("render : no model, returning null");
            return null;
        }
        const model = this.state.currentModel;
        // console.log("render : calling view");
        return this.props.view(this.dispatch.bind(this))(model);
    }


}