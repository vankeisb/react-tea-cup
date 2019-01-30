import {Component, ReactNode} from 'react';
import {Dispatcher} from "./Dispatcher";
import {Cmd} from "./Cmd";
import { Sub } from './Sub';


interface ProgramProps<Model,Msg> {
    init: () => Model
    view: (dispatch: Dispatcher<Msg>) => (model: Model) => ReactNode
    update: (msg: Msg, model: Model) => [Model, Cmd<Msg>]
    subscriptions: (model: Model) => Sub<Msg>
}

interface ProgramState<Model> {
    currentModel: Model
    currentSub: Sub<any>
}


export class Program<Model,Msg> extends Component<ProgramProps<Model,Msg>, ProgramState<Model>> {

    private count: number = 0;

    dispatch(msg:Msg) {

        this.count = this.count + 1;
        const c = this.count;
        const debug = (...msgs: any[]) => {
            const args = [ "[dispatch-" + c + "]" ].concat(msgs);
            console.log(args);
        };
    
        debug(">>>", msg);
        const currentModel = this.state.currentModel;
        const updated = this.props.update(msg, currentModel);
        debug("updated", updated, "previousModel", currentModel);
        const newSub = this.props.subscriptions(updated[0]);
        const prevSub = this.state.currentSub;
        debug("new sub obtained", newSub);
        this.setState({
            currentModel: updated[0],
            currentSub: newSub
        });

        const d = this.dispatch.bind(this);

        debug("releasing previous sub", prevSub, "initializing", newSub);
        newSub.init(d);
        prevSub.release();

        // run commands and subs in a separate timout, to 
        // make sure that this dispatch is done
        setTimeout(() => {
            // console.log("dispatch: processing commands");
            debug("performing command", updated[1]);
            updated[1].run(d);
            debug("<<<  done");
        }, 0);

    }


    constructor(props: Readonly<ProgramProps<Model, Msg>>) {
        super(props);
        const model = props.init();
        const sub = props.subscriptions(model);
        this.state = {
            currentModel: model,
            currentSub: sub
        };
        // connect to sub
        const d = this.dispatch.bind(this);
        console.log("initial sub", sub);
        sub.init(d);
        // TODO trigger initial Cmd !
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