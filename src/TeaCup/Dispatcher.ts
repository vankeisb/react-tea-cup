/**
 * Dispatcher for Msgs.
 */
export type Dispatcher<Msg> = (m:Msg) => void;

/**
 * Map a dispatcher's Msg type, useful mostly for parent-child.
 * @param d the dispatcher
 * @param mapper the mapping function
 */
export function map<P,C>(d:Dispatcher<P>, mapper: (c:C) => P): Dispatcher<C> {
    return (c:C) => {
        d(mapper(c))
    }
}

