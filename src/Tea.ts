    import React, {Component, ReactNode} from 'react';


export type Dispatcher<Msg> = (m:Msg) => void;


interface ProgramProps<Model,Msg> {
    init: () => Model
    view: (dispatch: Dispatcher<Msg>, model: Model) => ReactNode
    update: (msg: Msg, model: Model) => Model
}


interface ProgramState<Model> {
    currentModel?: Model
}



export class Program<Model,Msg> extends Component<ProgramProps<Model,Msg>, ProgramState<Model>> {

    dispatcher(state: ProgramState<Model>) {
        return (msg:Msg) => {
            console.log(">>> dispatch", msg);
            if (state.currentModel === undefined) {
                console.log("<<< dispatch : no model, nothing done");
                return;
            }
            console.log("dispatch : calling update()");
            const newModel = this.props.update(msg, state.currentModel);
            console.log("dispatch : new model obtained, setting state");
            this.setState({
                currentModel: newModel
            });
            console.log("dispatch : done");
        }
    }

    constructor(props: Readonly<ProgramProps<Model, Msg>>) {
        super(props);
        console.log("program ctor : calling init() and setting initial state");
        this.state = {
            currentModel: props.init()
        }
    }

    render(): React.ReactNode {
        if (this.state.currentModel === undefined) {
            console.log("render : no model, returning null");
            return null;
        }
        const model = this.state.currentModel;
        console.log("render : calling view");
        return this.props.view(this.dispatcher(this.state), model);
    }


}
