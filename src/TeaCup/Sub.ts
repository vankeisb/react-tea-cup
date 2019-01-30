import { Dispatcher } from "./Dispatcher";

export abstract class Sub<Msg> {

    protected dispatcher: Dispatcher<Msg> | undefined;

    static none<Msg>(): Sub<Msg> {
        return new SubNone()
    }

    static batch<Msg>(subs: Array<Sub<Msg>>) {
        return new BatchSub(subs);
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

    map<ParentMsg>(f:(m:Msg) => ParentMsg): Sub<ParentMsg> {
        return new MappedSub(this, f);
    }

}


class SubNone<Msg> extends Sub<Msg> {
}


class BatchSub<Msg> extends Sub<Msg> {

    private readonly subs: Array<Sub<Msg>>;

    constructor(subs: Array<Sub<Msg>>) {
        super();
        this.subs = subs;
    }


    init(dispatch: Dispatcher<Msg>): void {
        this.subs.forEach(s => s.init(dispatch));
    }

    release(): void {
        this.subs.forEach(s => s.release());
    }
}


class MappedSub<Msg, ParentMsg> extends Sub<ParentMsg> {

    private readonly childSub: Sub<Msg>;
    private readonly mapper: (cm:Msg) => ParentMsg;


    constructor(childSub: Sub<Msg>, mapper: (cm: Msg) => ParentMsg) {
        super();
        this.childSub = childSub;
        this.mapper = mapper;
    }


    init(dispatch: Dispatcher<ParentMsg>): void {
        this.childSub.init((m:Msg) => {
            dispatch(this.mapper(m))
        })
    }

    release(): void {
        this.childSub.release();
    }
}