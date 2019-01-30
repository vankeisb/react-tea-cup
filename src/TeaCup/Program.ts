import {Component, ReactNode} from 'react';
import {Dispatcher} from "./Dispatcher";
import {Cmd} from "./Cmd";
import { Sub } from './Sub';


interface ProgramProps<Model,Msg> {
    init: () => [Model, Cmd<Msg>]
    view: (dispatch: Dispatcher<Msg>, model: Model) => ReactNode
    update: (msg: Msg, model: Model) => [Model, Cmd<Msg>]
    subscriptions: (model: Model) => Sub<Msg>
    debug?: boolean
}

interface ProgramState<Model> {
    currentModel: Model
    currentSub: Sub<any>
}


const noOpLog = (..._: any[]) => {};

class Guid {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
}

export class Program<Model,Msg> extends Component<ProgramProps<Model,Msg>, ProgramState<Model>> {

    private count: number = 0;
    private readonly uuid = Guid.newGuid();

    private logger() {
        // @ts-ignore
        const teaDebug: any = window["teaDebug"];
        const debugEnabled = teaDebug || this.props.debug;
        if (debugEnabled) {
            this.count = this.count + 1;
            const c = this.count;
            return (...msgs: any[]) => {
                const args = [this.uuid, "[dispatch-" + c + "]"].concat(msgs);
                console.log(args);
            }
        } else {
            return noOpLog;
        }
    }


    dispatch(msg:Msg) {

        const debug = this.logger();

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

        // run commands in a separate timout, to
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
        const mac = props.init();
        const sub = props.subscriptions(mac[0]);
        this.state = {
            currentModel: mac[0],
            currentSub: sub
        };
        // connect to sub
        const d = this.dispatch.bind(this);
        sub.init(d);
        // trigger initial command
        mac[1].run(d);
    }

    render(): ReactNode {
        if (this.state.currentModel === undefined) {
            // console.log("render : no model, returning null");
            return null;
        }
        const model = this.state.currentModel;
        // console.log("render : calling view");
        return this.props.view(this.dispatch.bind(this), model);
    }


}