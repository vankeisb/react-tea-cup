import {Just, Maybe, Nothing} from "./Maybe";
import {element} from "prop-types";

export class List<T> {

    private readonly elems:Array<T>;

    private constructor(elems: Array<T>) {
        this.elems = [...elems];
    }

    static fromArray<T>(ts:Array<T>): List<T> {
        return new List<T>(ts)
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
            return EMPTY_LIST;
        } else {
            const tailArray = [...this.elems];
            tailArray.shift();
            return new List(tailArray);
        }
    }

    private static empty<T>(): List<T> {
        return EMPTY_LIST;
    }

    toArray(): Array<T> {
        return [...this.elems];
    }

}


const EMPTY_LIST = List.fromArray([]);