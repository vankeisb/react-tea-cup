import { Dispatcher } from "./Dispatcher";

export abstract class Sub<Msg> {

    protected dispatcher: Dispatcher<Msg> | undefined;

    static none<Msg>(): Sub<Msg> {
        return new SubNone()
    }

    init(dispatch: Dispatcher<Msg>): void {
        this.dispatcher = dispatch;
        this.onInit();
    }

    release(): void {
        this.dispatcher = undefined;
        this.onRelease();
    }

    protected dispatch(m:Msg): void {
        this.dispatcher && this.dispatcher(m);
    }

    protected onInit() {}

    protected onRelease() {}

}


class SubNone<Msg> extends Sub<Msg> {
}