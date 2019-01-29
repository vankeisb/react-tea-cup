import { Dispatcher } from "./Dispatcher";
export declare abstract class Cmd<Msg> {
    static none<Msg>(): Cmd<Msg>;
    abstract run(dispatch: Dispatcher<Msg>): void;
    map<ParentMsg>(mapper: (c: Msg) => ParentMsg): Cmd<ParentMsg>;
}
export declare function noCmd<Model, Msg>(model: Model): [Model, Cmd<Msg>];
