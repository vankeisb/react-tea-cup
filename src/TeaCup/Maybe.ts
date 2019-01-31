export abstract class Maybe<T> {
    abstract map<T2>(f:(t:T) => T2) : Maybe<T2>
    abstract withDefault(t:T) : T
    abstract isPresent() : boolean
    abstract get() : T

    match<R>(ifJust: (t:T) => R, ifNothing: () => R): R {
        if (this.isPresent()) {
            return ifJust(this.get());
        } else {
            return ifNothing();
        }
    }

    static of<T>(t:T | undefined | null): Maybe<T> {
        if (t === undefined || t === null) {
            return new MNothing()
        } else {
            return new MJust(t);
        }
    }
}

export function Just<T>(t:T) : Maybe<T> {
    return new MJust(t);
}


export function Nothing<T>() : Maybe<T> {
    return NOTHING as Maybe<T>;
}


class MJust<T> extends Maybe<T> {

    readonly value: T;

    constructor(value: T) {
        super();
        this.value = value;
    }

    map<Y>(mapper: (t: T) => Y): Maybe<Y> {
        return new MJust(mapper(this.value));
    }

    withDefault(t:T): T {
        return this.value;
    }

    isPresent(): boolean {
        return true;
    }

    get(): T {
        return this.value;
    }

}


class MNothing<T> extends Maybe<T> {

    map<Y>(mapper: (t: T) => Y): Maybe<Y> {
        return new MNothing<Y>();
    }

    withDefault(t:T): T {
        return t;
    }

    isPresent(): boolean {
        return false;
    }

    get(): T {
        throw Error("trying to get value on Nothing");
    }

}

const NOTHING = new MNothing();
