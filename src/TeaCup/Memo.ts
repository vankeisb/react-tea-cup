import * as React from "react";

export function memo<T>(t:T) {
    return (f:(t:T) => React.ReactNode) => {
        return React.createElement(
            Memo,
            {
                value: t,
                renderer: (x:any) => {
                    return f(x)
                }
            }
        )
    }
}


interface MemoProps {
    value: any
    renderer: (x:any) => React.ReactNode
}


class Memo<T> extends React.Component<MemoProps> {

    render(): React.ReactNode {
        return this.props.renderer(this.props.value)
    }


    shouldComponentUpdate(nextProps: Readonly<MemoProps>, nextState: Readonly<{}>, nextContext: any): boolean {
        return this.props.value !== nextProps.value;
    }
}
