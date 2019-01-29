export declare type Dispatcher<Msg> = (m: Msg) => void;
export declare function map<P, C>(d: Dispatcher<P>, mapper: (c: C) => P): Dispatcher<C>;
