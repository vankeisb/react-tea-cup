import { Dispatcher } from "./Dispatcher";

export abstract class Sub<Msg> {

    static none<Msg>(): Sub<Msg> {
        return new SubNone()
    }

    abstract run(dispatch: Dispatcher<Msg>): void

}


class SubNone<Msg> extends Sub<Msg> {
    run(dispatch: Dispatcher<Msg>): void {
        // no-op
    }
}