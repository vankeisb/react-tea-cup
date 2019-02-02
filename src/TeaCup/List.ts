import {Just, Maybe, Nothing} from "./Maybe";
import {element} from "prop-types";

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

    head(): Maybe<T> {
        if (this.length() === 0) {
            return Nothing();
        } else {
            return Just(this.elems[0]);
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

    static empty<T>(): List<T> {
        return new List<T>([]);
    }

    toArray(): Array<T> {
        return [...this.elems];
    }

}
