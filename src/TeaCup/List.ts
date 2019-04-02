import {just, nothing, Maybe} from "./Maybe";

/**
 * Immutable list of data
 */
export class List<T> {

    private readonly elems:Array<T>;

    private constructor(elems: Array<T>) {
        this.elems = [...elems];
    }

    static fromArray<T>(ts:Array<T>): List<T> {
        if (ts.length === 0) {
            return List.empty();
        } else {
            return new List<T>(ts)
        }
    }

    static empty<T>(): List<T> {
        return new List<T>([]);
    }

    head(): Maybe<T> {
        if (this.length() === 0) {
            return nothing;
        } else {
            return just(this.elems[0]);
        }
    }

    length(): number {
        return this.elems.length;
    }

    tail(): List<T> {
        if (this.length() <= 1) {
            return new List([]);
        } else {
            const tailArray = [...this.elems];
            tailArray.shift();
            return new List<T>(tailArray);
        }
    }

    toArray(): Array<T> {
        return [...this.elems];
    }

    map<T2>(f:(t:T) => T2): List<T2> {
        return new List(this.elems.map(f))
    }

    mapWithIndex<T2>(f:(t:T, i:number) => T2): List<T2> {
        return new List(this.elems.map(f))
    }

}
