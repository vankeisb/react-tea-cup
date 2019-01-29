import {Dispatcher} from "./Dispatcher";

export function memo<M,T,R>(f:(d:Dispatcher<M>, t:T) => R):((d:Dispatcher<M>, t:T) => R) {

    return function (this: Cache<T,R>, d:Dispatcher<M>, x: T) {
        if (this.input === x) {
            if (this.result === null) {
                this.result = f(d, x);
            }
            return this.result;
        } else {
            this.input = x;
            this.result = f(d, x);
        }
        return this.result;
    }.bind({
        input: null,
        result: null
    })
}

interface Cache<T,R> {
    input: T | null
    result: R | null
}