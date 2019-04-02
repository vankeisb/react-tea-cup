/**
 * Maybe is either "just something", ot "nothing" !
 */
export type Maybe<T> = Just<T> | Nothing<T>

/**
 * A Maybe with something inside
 */
export class Just<T> {
    readonly type: 'Just' = 'Just';
    readonly value: T;


    constructor(value: T) {
        this.value = value;
    }

    map<T2>(f:(t:T) => T2): Maybe<T2> {
        return new Just(f(this.value));
    }

    withDefault(_:T): T {
        return this.value;
    }
}


/**
 * Wrap an object into a Maybe
 * @param t the object to wrap
 */
export function just<T>(t:T): Maybe<T> {
    return new Just<T>(t);
}

/**
 * An "empty" Maybe
 */
export class Nothing<T> {
    readonly type: 'Nothing' = 'Nothing';
    static value: Nothing<never> = new Nothing();

    private constructor() {}

    map<T2>(f:(t:T) => T2): Maybe<T2> {
        return Nothing.value;
    }

    withDefault(d:T): T {
        return d;
    }
}


/**
 * The "nothing" maybe.
 */
export const nothing: Maybe<never> = Nothing.value;


/**
 * Make a Maybe with a "nullable" object
 * @param t the object, or undef, or null
 */
export function maybeOf<T>(t:T | undefined | null): Maybe<T> {
    if (t === undefined || t === null) {
        return nothing;
    } else {
        return just(t);
    }
}