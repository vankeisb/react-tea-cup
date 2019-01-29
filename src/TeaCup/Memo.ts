import {Dispatcher} from "./Dispatcher";


type F<M,T,R> = (d:Dispatcher<M>) => (t:T) => R

export function memo<M,T,R>(f:F<M,T,R>):(F<M,T,R>) {

    return function (this: Cache<T,R>, d:Dispatcher<M>) {
        const that: Cache<T,R> = this;
        return (t:T) => {
            if (that.input === t) {
                if (that.result === null) {
                    that.result = f(d)(t);
                }
                return that.result;
            } else {
                that.input = t;
                that.result = f(d)(t);
            }
            return that.result;
        }
    }.bind({
        input: null,
        result: null
    })
}

interface Cache<T,R> {
    input: T | null
    result: R | null
}