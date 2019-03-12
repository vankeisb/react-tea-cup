import React from 'react';
import {
    Cmd,
    Dispatcher,
    ProgramWithNav,
    map,
    Sub,
    noCmd,
    newUrl,
    Task,
    Router,
    route0,
    str,
    route1, route2, int, just, Maybe, nothing, maybeOf, QueryParams
} from "react-tea-cup";
import * as Counter from './Samples/Counter'
import * as ParentChild from './Samples/ParentChild'
import * as Raf from './Samples/Raf'
import * as Perf from './Samples/Perf'
import * as Rand from './Samples/Rand'
import * as ClassMsgs from './Samples/ClassMsgs'
import * as Sful from './Samples/StatefulInView'



enum Tab {
    All, Open, Closed
}


type Route
    = { _tag: "home" }
    | { _tag: "samples" }
    | { _tag: "todos", tab: Tab }
    | { _tag: "todo", id: string }


function homeRoute() : Route  {
    return {_tag: "home"}
}

function samplesRoute() : Route {
    return {_tag: "samples"}
}

function todosRoute(tab: Tab = Tab.All) : Route {
    return {_tag: "todos", tab: tab };
}

function todoRoute(id:string): Route {
    return {_tag: "todo", id: id }
}


const router: Router<Route> = new Router<Route>(
    route0.map(() => homeRoute()),
    route1(str("todos")).map((_:string, q:QueryParams) => {
        return todosRoute(
            q.getHash()
                .map((h: string) => {
                    switch (h) {
                        case "open":
                            return Tab.Open;
                        case "closed":
                            return Tab.Closed;
                        default:
                            return Tab.All;
                    }
                })
                .withDefault(Tab.All)
        )
    }),
    route2(str("todos"), str()).map((_:string, id:string) => todoRoute(id)),
    route1(str("samples")).map((_:string) => samplesRoute())
);


function routeToUrl(route: Route): string {
    switch (route._tag) {
        case "home":
            return "/";
        case "samples":
            return "/samples";
        case "todos":
            let hash;
            switch (route.tab) {
                case Tab.All:
                    hash = "";
                    break;
                case Tab.Open:
                    hash = "#open";
                    break;
                case Tab.Closed:
                    hash = "#closed";
                    break;
            }
            return `/todos${hash}`;
        case "todo":
            return `/todos/${route.id}`;
    }
}


function navigateTo(route: Route): Msg {
    return { type: "newUrl", url: routeToUrl(route) };
}


interface TodoItem {
    readonly id: string;
    readonly text: string;
    readonly done: boolean;
}


interface Model {
    readonly counter: Counter.Model
    readonly parentChild: ParentChild.Model
    readonly raf: Raf.Model
    readonly perf: Perf.Model
    readonly rand: Rand.Model
    readonly clsm: ClassMsgs.Model
    readonly sful: Sful.Model
    readonly route: Maybe<Route>
    readonly todos: ReadonlyArray<TodoItem>
}


type Msg
    = { type: "counter", child: Counter.Msg }
    | { type: "parentChild", child: ParentChild.Msg }
    | { type: "raf", child: Raf.Msg }
    | { type: "perf", child: Perf.Msg }
    | { type: "rand", child: Rand.Msg }
    | { type: "clsm", child: ClassMsgs.Msg }
    | { type: "sful", child: Sful.Msg }
    | { type: "urlChange", location: Location }
    | { type: "newUrl", url: string }
    | { type: "noop" }
    | { type: "tabClicked", tab: Tab }
    

const NoOp: Msg = { type: "noop" };


function init(location:Location): [Model, Cmd<Msg>] {

    const counter = Counter.init();
    const parentChild = ParentChild.init();
    const raf = Raf.init();
    const perf = Perf.init();
    const rand = Rand.init();
    const clsm = ClassMsgs.init();
    const sful = Sful.init();
    const h = location.hash.startsWith("#") ? location.hash.substring(1) : location.hash;
    return [
        {
            counter: counter[0],
            parentChild: parentChild[0],
            raf: raf[0],
            perf: perf[0],
            rand: rand[0],
            clsm: clsm[0],
            sful: sful[0],
            route: router.parseLocation(location),
            todos: [
                {
                    id: "1",
                    text: "Wash your dog",
                    done: false
                },
                {
                    id: "2",
                    text: "Walk your car",
                    done: true
                }
            ]
        },
        Cmd.batch([
            counter[1].map(mapCounter),
            parentChild[1].map(mapParentChild),
            raf[1].map(mapRaf),
            perf[1].map(mapPerf),
            rand[1].map(mapRand),
            clsm[1].map(mapClsm),
            sful[1].map(mapSful),
        ])
    ]
}


function mapCounter(m: Counter.Msg) : Msg {
        return {
                type: "counter",
                child: m
        }
}

function mapParentChild(m: ParentChild.Msg) : Msg {
        return {
                type: "parentChild",
                child: m
        }
}

function mapRaf(m: Raf.Msg) : Msg {
        return {
                type: "raf",
                child: m
        }
}

function mapPerf(m: Perf.Msg) : Msg {
        return {
                type: "perf",
                child: m
        }
}

function mapRand(m: Rand.Msg) : Msg {
    return {
        type: "rand",
        child: m
    }
}


function mapClsm(m: ClassMsgs.Msg) : Msg {
    return {
        type: "clsm",
        child: m
    }
}


function mapSful(m: Sful.Msg) : Msg {
    return {
        type: "sful",
        child: m
    }
}


function view(dispatch: Dispatcher<Msg>, model: Model) {
    return model.route
        .map((route:Route) => {
            switch (route._tag) {
                case "home":
                    return viewHome(dispatch);
                case "samples":
                    return viewSamples(dispatch, model);
                case "todos":
                    return viewTodos(dispatch, model, route.tab);
                case "todo":
                    return viewTodo(dispatch, model, route.id)
            }
        })
        .withDefault(
            <div>
                <h1>Page not found !</h1>
                <p>
                    The router didn't find a route, this is a client-side 404...
                </p>
            </div>
        )
}


function viewHome(dispatch: Dispatcher<Msg>) {
    return (
        <div>
            <h1>TeaCup sample app</h1>
            <p>
                Browse the
                {" "}
                <a href="#"
                    onClick={e => {
                        e.preventDefault();
                        dispatch(navigateTo(samplesRoute()));
                    }}>
                    samples
                </a>
                {" "}
                or try the
                {" "}
                <a href="#"
                    onClick={e => {
                        e.preventDefault();
                        dispatch(navigateTo(todosRoute()));
                    }}>
                    TodoMVC app
                </a>
                .
            </p>
        </div>
    )
}


function backToHome(d:Dispatcher<Msg>) {
    return (
        <div>
            <a href="#"
               onClick={e => {
                   e.preventDefault();
                   d(navigateTo(homeRoute()));
               }}>
                {"<-"} Back to home
            </a>
        </div>
   );
}


function viewTodos(dispatch: Dispatcher<Msg>, model: Model, curTab: Tab) {

    function viewTab(t: Tab) {
        const active = t === curTab;
        let label;
        switch (t) {
            case Tab.All:
                label = "All";
                break;
            case Tab.Open:
                label = "Open";
                break;
            case Tab.Closed:
                label = "Closed";
                break;
        }
        return (
            <li>
                { active
                    ? (
                        <span>{label}</span>
                    )
                    : (
                        <a href="#"
                            onClick={e => {
                                e.preventDefault();
                                dispatch({type:"tabClicked", tab: t});
                            }}>
                            {label}
                        </a>
                    )
                }
            </li>
        )
    }

    return (
        <div>
            {backToHome(dispatch)}
            <h1>Todo MVC</h1>
            { model.todos.length === 0
                ? (
                    <p>
                        You have nothing to do ! Neat !!
                    </p>
                )
                : (
                    <div>
                        <ul>
                            {viewTab(Tab.All)}
                            {viewTab(Tab.Open)}
                            {viewTab(Tab.Closed)}
                        </ul>
                        <ul>
                            {model.todos
                                .filter(todo => {
                                    switch (curTab) {
                                        case Tab.All:
                                            return true;
                                        case Tab.Open:
                                            return !todo.done;
                                        case Tab.Closed:
                                            return todo.done;
                                    }
                                })
                                .map(todo => {
                                    const style = {
                                        textDecoration: todo.done ? "line-through" : "none"
                                    };
                                    return (
                                        <li
                                            key={todo.id}
                                            style={style}>
                                            <a
                                                href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    dispatch(navigateTo(todoRoute(todo.id)))
                                                }}>
                                                {todo.text}
                                            </a>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </div>
                )
            }
        </div>
    )
}


function viewTodo(dispatch: Dispatcher<Msg>, model: Model, id: string) {
    const todo = maybeOf(model.todos.find(t => t.id === id));
    return (
        <div>
            <div>
                <a href="#"
                    onClick={e => {
                        e.preventDefault();
                        dispatch(navigateTo(todosRoute()))
                    }}>
                    {"<-"} back to list
                </a>
            </div>
            { todo
                .map((t:TodoItem) =>
                        <div>
                            <h1>Todo</h1>
                            {t.text}
                        </div>
                )
                .withDefault(
                    <div>
                        <h1>Todo not found !</h1>
                        <p>
                            There's no TODO for ID {id}.
                        </p>
                    </div>
                )
            }
        </div>
    )
}


function viewSamples(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div>
            {backToHome(dispatch)}
            <h1>Samples</h1>
            <p>
                This is the samples app for <code>react-tea-cup</code>.
            </p>
            <h2>Counter</h2>
            {Counter.view(map(dispatch, mapCounter), model.counter)}
            <h2>Random</h2>
            {Rand.view(map(dispatch, mapRand), model.rand)}
            <h2>Parent/child</h2>
            {ParentChild.view(map(dispatch, mapParentChild), model.parentChild)}
            <h2>Raf</h2>
            {Raf.view(map(dispatch, mapRaf), model.raf)}
            <h2>Performance</h2>
            {Perf.view(map(dispatch, mapPerf), model.perf)}
            <h2>More OOP</h2>
            {ClassMsgs.view(map(dispatch, mapClsm), model.clsm)}
            <h2>Stateful in view()</h2>
            {Sful.view(map(dispatch, mapSful), model.sful)}
        </div>
    )
}


function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "counter":
            const macCounter = Counter.update(msg.child, model.counter);
            return [{...model, counter: macCounter[0]}, macCounter[1].map(mapCounter)];
        case "parentChild":
            const macPc = ParentChild.update(msg.child, model.parentChild);
            return [{...model, parentChild: macPc[0]}, macPc[1].map(mapParentChild)];
        case "raf":
            const macRaf = Raf.update(msg.child, model.raf);
            return [{...model, raf: macRaf[0]}, macRaf[1].map(mapRaf)];
        case "perf":
            const macPerf = Perf.update(msg.child, model.perf);
            return [{...model, perf: macPerf[0]}, macPerf[1].map(mapPerf)];
        case "rand":
            const macRand = Rand.update(msg.child, model.rand);
            return [{...model, rand: macRand[0]}, macRand[1].map(mapRand)];
        case "clsm":
            const macClsm = ClassMsgs.update(msg.child, model.clsm);
            return [{...model, clsm: macClsm[0]}, macClsm[1].map(mapClsm)];
        case "sful":
            const macSful = Sful.update(msg.child, model.sful);
            return [{...model, sful: macSful[0]}, macSful[1].map(mapSful)];
        case "urlChange":
            return noCmd({
                ...model,
                route: router.parseLocation(msg.location)
            });
        case "newUrl":
            return [
                model,
                Task.perform(
                    newUrl(msg.url),
                    (_:Location) => NoOp
                )
            ];
        case "tabClicked":
            return [
                model,
                Task.perform(
                    newUrl(routeToUrl(todosRoute(msg.tab))),
                    (_:Location) => NoOp
                )
            ];
        case "noop":
            return noCmd(model);
    }

}


function subscriptions(model: Model) : Sub<Msg> {
    return Sub.batch(
        [
            Counter.subscriptions(model.counter).map(mapCounter),
            ParentChild.subscriptions(model.parentChild).map(mapParentChild),
            Raf.subscriptions(model.raf).map(mapRaf)
        ]
    )
}


function onUrlChange(l:Location) : Msg {
    return {
        type: "urlChange",
        location: l
    }
}


const App = () => (
    <ProgramWithNav
        init={init}
        view={view}
        update={update}
        subscriptions={subscriptions}
        onUrlChange={onUrlChange}
    />
);



export default App;
