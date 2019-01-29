import * as React from "react";
export declare function memo<T>(t: T): (f: (t: T) => React.ReactNode) => React.ComponentElement<MemoProps, Memo<{}>>;
interface MemoProps {
    value: any;
    renderer: (x: any) => React.ReactNode;
}
declare class Memo<T> extends React.Component<MemoProps> {
    render(): React.ReactNode;
    shouldComponentUpdate(nextProps: Readonly<MemoProps>, nextState: Readonly<{}>, nextContext: any): boolean;
}
export {};
