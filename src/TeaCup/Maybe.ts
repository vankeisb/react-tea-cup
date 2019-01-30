export type Maybe<T>
    = Just<T>
    | Nothing<T>


export class Just<T> {
    readonly type: string = "just";
    readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    map<Y>(mapper: (t: T) => Y): Maybe<Y> {
        return new Just(mapper(this.value));
    }

    withDefault(t:T): T {
        return this.value;
    }

}


export class Nothing<T> {

    readonly type:string = "nothing";

    map<Y>(mapper: (t: T) => Y): Maybe<Y> {
        return new Nothing<Y>();
    }

    withDefault(t:T): T {
        return t;
    }

}


export function just<T>(t:T) : Maybe<T> {
    return new Just(t);
}


export function nothing<T>() : Maybe<T> {
    return new Nothing();
}


export function fromNullable<T>(t:T | undefined | null) {
    if (t === undefined || t === null) {
        return nothing();
    } else {
        return just(t);
    }
}