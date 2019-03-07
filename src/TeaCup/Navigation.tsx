import {Program, ProgramProps} from "./Program";
import {Cmd, noCmd} from "./Cmd";
import {Dispatcher} from "./Dispatcher";
import {Sub} from "./Sub";
import {Task} from "./Task";
import {Ok, Result} from "./Result";
import * as React from 'react';
import {Component, createRef, ReactNode, RefObject} from "react";
import {just, Maybe, nothing} from "./Maybe";
import {number} from "prop-types";


export interface NavProps<Model,Msg> {
    readonly onUrlChange: (l:Location) => Msg,
    readonly init: (l:Location) => [Model, Cmd<Msg>],
    readonly view: (dispatch: Dispatcher<Msg>, m:Model) => ReactNode,
    readonly update: (msg:Msg, model: Model) => [Model, Cmd<Msg>]
    readonly subscriptions: (model: Model) => Sub<Msg>
}


export class ProgramWithNav<Model, Msg> extends Component<NavProps<Model,Msg>, any> {

    private listener: Maybe<EventListener>;
    private readonly ref: RefObject<Program<Model,Msg>> = createRef();

    constructor(props: Readonly<NavProps<Model, Msg>>) {
        super(props);
        this.listener = nothing;
    }


    render(): React.ReactNode {
        return (
            <Program
                init={() => this.props.init(window.location)}
                view={this.props.view}
                update={this.props.update}
                subscriptions={this.props.subscriptions}
                ref={this.ref}/>
        )
    }


    componentDidMount(): void {
        console.log("ProgramWithNav.componentDidMount");
        const l = () => {
            if (this.ref.current) {
                this.ref.current.dispatch(this.props.onUrlChange(window.location))
            }
        };
        this.listener = just(l);
        window.addEventListener("popstate", l);
    }

    componentWillMount(): void {
        console.log("ProgramWithNav.componentWillUnmount");
        if (this.listener.type === "Just") {
            window.removeEventListener("popstate", this.listener.value);
            this.listener = nothing;
        }
    }
}


export function newUrl(url: string): Task<never,Location> {
    return new NewUrlTask(url);
}


class NewUrlTask extends Task<never,Location> {

    readonly url: string;

    constructor(url: string) {
        super();
        this.url = url;
    }

    execute(callback: (r: Result<never, Location>) => void): void {
        const state = {};
        window.history.pushState(state, "", this.url);
        const popStateEvent = new PopStateEvent('popstate', { state: state });
        dispatchEvent(popStateEvent);
        callback(new Ok(document.location));
    }


}


export abstract class PathElem<T> {
    abstract mapPart(part:string): Maybe<T>;
}


class StrPathElem extends PathElem<string> {

    readonly s:string;

    constructor(s: string) {
        super();
        this.s = s;
    }

    mapPart(part: string): Maybe<string> {
        if (part === this.s) {
            return just(part);
        } else {
            return nothing;
        }
    }
}


class RegexPathElem<T> extends PathElem<T> {

    private readonly regex: RegExp;
    private readonly converter: (s:string) => Maybe<T>;


    constructor(regex: RegExp, converter: (s: string) => Maybe<T>) {
        super();
        this.regex = regex.compile();
        this.converter = converter;
    }

    mapPart(part: string): Maybe<T> {
        if (this.regex.test(part)) {
            return this.converter(part);
        } else {
            return nothing;
        }
    }

}

class IntPathElem extends RegexPathElem<number> {

    constructor() {
        super(new RegExp("^\\d+$"), s => {
            try {
                const i = parseInt(s, 10);
                if (isNaN(i)) {
                    return nothing;
                } else {
                    return just(i);
                }
            } catch (e) {
                return nothing;
            }
        });
    }

    static INSTANCE: IntPathElem = new IntPathElem();
}



export function str(s:string): PathElem<string> {
    return new StrPathElem(s);

}

export function int(): PathElem<number> {
    return IntPathElem.INSTANCE;
}


export function regex<T>(r:RegExp, converter: (s:string) => Maybe<T>): PathElem<T> {
    return new RegexPathElem(r, converter);
}



export function route0<R>(f:() => R): RouteDef<R> {
    return new RouteDef([], f);
}

export function route1<E,R>(e:PathElem<E>, f:(e:E) => R): RouteDef<R> {
    return new RouteDef([e], f);
}

export function route2<E1,E2,R>(e1:PathElem<E1>, e2: PathElem<E2>, f:(e1:E1, e2:E2) => R): RouteDef<R> {
    return new RouteDef([e1, e2], f);
}

export function route3<E1,E2,E3,R>(e1:PathElem<E1>, e2: PathElem<E2>, e3: PathElem<E3>, f:(e1:E1, e2:E2, e3:E3) => R): RouteDef<R> {
    return new RouteDef([e1, e2, e3], f);
}



export class RouteDef<R> {
    readonly pathElems: ReadonlyArray<PathElem<any>>;
    readonly f:Function;

    constructor(pathElems: ReadonlyArray<PathElem<any>>, f:Function) {
        this.pathElems = pathElems;
        this.f = f;
    }

    mapParts(parts: ReadonlyArray<string>): Maybe<R> {
        if (parts.length === this.pathElems.length) {
            // map every individual part, bail out if
            // something cannot be converted
            const mappedParts = [];
            for (let i = 0 ; i < parts.length ; i++) {
                const part = parts[i];
                const pe = this.pathElems[i];
                const mapped = pe.mapPart(part);
                switch (mapped.type) {
                    case "Just":
                        mappedParts.push(mapped.value);
                        break;
                    case "Nothing":
                        return nothing;
                }
            }
            // now we have mapped args, let's call the route's func
            const r: R = this.f.apply({}, mappedParts);
            return just(r);
        } else {
            return nothing;
        }
    }
}


export class Router<R> {

    readonly routeDefs: ReadonlyArray<RouteDef<R>>;

    constructor(routeDefs: ReadonlyArray<RouteDef<R>>) {
        this.routeDefs = routeDefs;
    }

    parsePath(path: string) : Maybe<R> {
        // extract path parts from location and split
        const p1 = path.startsWith("/") ? path.substring(1) : path;
        const p2 = p1.endsWith("/") ? p1.substring(0, p1.length - 2) : p1;
        const parts = p2 === "" ? [] : p2.split("/");
        // try all routes one after the other
        for (let i = 0; i < this.routeDefs.length; i++) {
            const d = this.routeDefs[i];
            const r = d.mapParts(parts);
            if (r.type === "Just") {
                return r;
            }
        }
        return nothing;
    }

}