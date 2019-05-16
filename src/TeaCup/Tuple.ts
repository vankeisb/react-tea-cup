/**
 * Helper for managing tuples.
 */
export class Tuple<A,B> {

    readonly a: A;
    readonly b: B;

    constructor(a: A, b: B) {
        this.a = a;
        this.b = b;
    }

    /**
     * Transform to a native tuple (array-like)
     */
    toNative(): [A, B] {
        return [this.a, this.b];
    }

    mapFirst<C>(f:(a:A) => C): Tuple<C, B> {
        return new Tuple<C, B>(f(this.a), this.b);
    }

    mapSecond<C>(f:(b:B) => C): Tuple<A, C> {
        return new Tuple<A, C>(this.a, f(this.b));
    }

    mapBoth<C,D>(f1:(a:A) => C, f2:(b:B) => D): Tuple<C,D> {
        return new Tuple<C,D>(f1(this.a), f2(this.b));
    }

    static fromNative<A,B>(t:[A,B]): Tuple<A,B> {
        return new Tuple(t[0], t[1])
    }

    /**
     * Create a new tuple with passed values
     * @param a the first value
     * @param b the second value
     */
    static t2<A,B>(a:A, b:B): Tuple<A,B> {
        return new Tuple<A, B>(a, b);
    }

    /**
     * Create a native tuple with passed values
     * @param a the first value
     * @param b the second value
     */
    static t2n<A,B>(a:A, b:B): [A,B] {
        return [a, b];
    }

}