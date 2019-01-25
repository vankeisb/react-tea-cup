export type Dispatcher<Msg> = (m:Msg) => void;

export function map<P,C>(d:Dispatcher<P>, mapper: (c:C) => P): Dispatcher<C> {
    return (c:C) => {
        d(mapper(c))
    }
}

