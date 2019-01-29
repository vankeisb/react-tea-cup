import { Component, ReactNode } from 'react';
import { Dispatcher } from "./Dispatcher";
import { Cmd } from "./Cmd";
interface ProgramProps<Model, Msg> {
    init: () => Model;
    view: (dispatch: Dispatcher<Msg>) => (model: Model) => ReactNode;
    update: (msg: Msg, model: Model) => [Model, Cmd<Msg>];
}
interface ProgramState<Model> {
    currentModel?: Model;
}
export declare class Program<Model, Msg> extends Component<ProgramProps<Model, Msg>, ProgramState<Model>> {
    dispatch(msg: Msg): void;
    constructor(props: Readonly<ProgramProps<Model, Msg>>);
    render(): React.ReactNode;
}
export {};
