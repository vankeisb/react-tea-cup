/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import React from 'react';
import {
  Cmd,
  DevTools,
  Dispatcher,
  just,
  map,
  Maybe,
  maybeOf,
  newUrl,
  noCmd,
  nothing,
  ProgramWithNav,
  QueryParams,
  route0,
  route1,
  route2,
  Router,
  str,
  Sub,
  Task,
  withReduxDevTools,
} from 'react-tea-cup';
import * as Counter from './Samples/Counter';
import * as ParentChild from './Samples/ParentChild';
import * as Raf from './Samples/Raf';
import * as Perf from './Samples/Perf';
import * as Rand from './Samples/Rand';
import * as ClassMsgs from './Samples/ClassMsgs';
import * as Sful from './Samples/StatefulInView';
import * as Rest from './Samples/Rest';
import * as TimeSample from './Samples/TimeSample';
import * as EventsSample from './Samples/EventsSample';

enum Tab {
  All,
  Open,
  Closed,
}

type Route = { _tag: 'home' } | { _tag: 'samples' } | { _tag: 'todos'; tab: Tab } | { _tag: 'todo'; id: string };

function homeRoute(): Route {
  return { _tag: 'home' };
}

function samplesRoute(): Route {
  return { _tag: 'samples' };
}

function todosRoute(tab: Tab = Tab.All): Route {
  return { _tag: 'todos', tab: tab };
}

function todoRoute(id: string): Route {
  return { _tag: 'todo', id: id };
}

const router: Router<Route> = new Router<Route>(
  route0.map(() => homeRoute()),
  route1(str('todos')).map((_: string, q: QueryParams) => {
    return todosRoute(
      q
        .getHash()
        .map((h: string) => {
          switch (h) {
            case 'open':
              return Tab.Open;
            case 'closed':
              return Tab.Closed;
            default:
              return Tab.All;
          }
        })
        .withDefault(Tab.All),
    );
  }),
  route2(str('todos'), str()).map((_: string, id: string) => todoRoute(id)),
  route1(str('samples')).map((_: string) => samplesRoute()),
);

function routeToUrl(route: Route): string {
  switch (route._tag) {
    case 'home':
      return '/';
    case 'samples':
      return '/samples';
    case 'todos':
      let hash;
      switch (route.tab) {
        case Tab.All:
          hash = '';
          break;
        case Tab.Open:
          hash = '#open';
          break;
        case Tab.Closed:
          hash = '#closed';
          break;
      }
      return `/todos${hash}`;
    case 'todo':
      return `/todos/${route.id}`;
  }
}

function navigateTo(route: Route): Msg {
  return { type: 'newUrl', url: routeToUrl(route) };
}

interface TodoItem {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
}

interface TodoMvc {
  readonly todos: ReadonlyArray<TodoItem>;
  readonly tab: Tab;
  readonly todoId: Maybe<string>;
}

type Model =
  | { tag: 'home' }
  | { tag: 'samples'; samples: Samples }
  | { tag: 'todo-mvc'; todoMvc: TodoMvc }
  | { tag: 'not-found' };

interface Samples {
  readonly counter: Counter.Model;
  readonly parentChild: ParentChild.Model;
  readonly raf: Raf.Model;
  readonly perf: Perf.Model;
  readonly rand: Rand.Model;
  readonly clsm: ClassMsgs.Model;
  readonly sful: Sful.Model;
  readonly rest: Rest.Model;
  readonly time: TimeSample.Model;
  readonly events: EventsSample.Model;
}

type Msg =
  | { type: 'counter'; child: Counter.Msg }
  | { type: 'parentChild'; child: ParentChild.Msg }
  | { type: 'raf'; child: Raf.Msg }
  | { type: 'perf'; child: Perf.Msg }
  | { type: 'rand'; child: Rand.Msg }
  | { type: 'clsm'; child: ClassMsgs.Msg }
  | { type: 'sful'; child: Sful.Msg }
  | { type: 'rest'; child: Rest.Msg }
  | { type: 'timeSample'; child: TimeSample.Msg }
  | { type: 'eventsSample'; child: EventsSample.Msg }
  | { type: 'urlChange'; location: Location }
  | { type: 'newUrl'; url: string }
  | { type: 'noop' }
  | { type: 'tabClicked'; tab: Tab };

const NoOp: Msg = { type: 'noop' };

function initSamples(): [Model, Cmd<Msg>] {
  const counter = Counter.init();
  const parentChild = ParentChild.init();
  const raf = Raf.init();
  const perf = Perf.init();
  const rand = Rand.init();
  const clsm = ClassMsgs.init();
  const sful = Sful.init();
  const rest = Rest.init();
  const time = TimeSample.init();
  const events = EventsSample.init();
  return [
    {
      tag: 'samples',
      samples: {
        counter: counter[0],
        parentChild: parentChild[0],
        raf: raf[0],
        perf: perf[0],
        rand: rand[0],
        clsm: clsm[0],
        sful: sful[0],
        rest: rest[0],
        time: time[0],
        events: events[0],
      },
    },
    Cmd.batch([
      counter[1].map(mapCounter),
      parentChild[1].map(mapParentChild),
      raf[1].map(mapRaf),
      perf[1].map(mapPerf),
      rand[1].map(mapRand),
      clsm[1].map(mapClsm),
      sful[1].map(mapSful),
      rest[1].map(mapRest),
      time[1].map(mapTimeSample),
      events[1].map(mapEventsSample),
    ]),
  ];
}

const todos = [
  {
    id: '1',
    text: 'Wash your dog',
    done: false,
  },
  {
    id: '2',
    text: 'Walk your car',
    done: true,
  },
];

function init(location: Location): [Model, Cmd<Msg>] {
  function fromRoute(route: Route): [Model, Cmd<Msg>] {
    switch (route._tag) {
      case 'home':
        return noCmd({ tag: 'home' } as Model);
      case 'samples':
        return initSamples();
      case 'todos':
        return noCmd({
          tag: 'todo-mvc',
          todoMvc: {
            todos: todos,
            tab: route.tab,
            todoId: nothing,
          },
        } as Model);
      case 'todo':
        return noCmd({
          tag: 'todo-mvc',
          todoMvc: {
            todos: todos,
            tab: Tab.All,
            todoId: just(route.id),
          },
        } as Model);
    }
  }

  return router
    .parseLocation(location)
    .map(fromRoute)
    .withDefault(noCmd({ tag: 'not-found' } as Model));
}

function mapCounter(m: Counter.Msg): Msg {
  return {
    type: 'counter',
    child: m,
  };
}

function mapParentChild(m: ParentChild.Msg): Msg {
  return {
    type: 'parentChild',
    child: m,
  };
}

function mapRaf(m: Raf.Msg): Msg {
  return {
    type: 'raf',
    child: m,
  };
}

function mapPerf(m: Perf.Msg): Msg {
  return {
    type: 'perf',
    child: m,
  };
}

function mapRand(m: Rand.Msg): Msg {
  return {
    type: 'rand',
    child: m,
  };
}

function mapClsm(m: ClassMsgs.Msg): Msg {
  return {
    type: 'clsm',
    child: m,
  };
}

function mapSful(m: Sful.Msg): Msg {
  return {
    type: 'sful',
    child: m,
  };
}

function mapRest(m: Rest.Msg): Msg {
  return {
    type: 'rest',
    child: m,
  };
}

function mapTimeSample(m: TimeSample.Msg): Msg {
  return {
    type: 'timeSample',
    child: m,
  };
}

function mapEventsSample(m: EventsSample.Msg): Msg {
  return {
    type: 'eventsSample',
    child: m,
  };
}

function view(dispatch: Dispatcher<Msg>, model: Model) {
  switch (model.tag) {
    case 'home':
      return viewHome(dispatch);
    case 'samples':
      return viewSamples(dispatch, model.samples);
    case 'todo-mvc':
      return viewTodoMvc(dispatch, model.todoMvc);
    case 'not-found':
      return (
        <div>
          <h1>Page not found !</h1>
          <p>The router didn't find a route, this is a client-side 404...</p>
        </div>
      );
  }
}

function viewHome(dispatch: Dispatcher<Msg>) {
  return (
    <div>
      <h1>TeaCup sample app</h1>
      <p>
        Browse the{' '}
        <a
          href="#x"
          onClick={(e) => {
            e.preventDefault();
            dispatch(navigateTo(samplesRoute()));
          }}
        >
          samples
        </a>{' '}
        or try the{' '}
        <a
          href="#x"
          onClick={(e) => {
            e.preventDefault();
            dispatch(navigateTo(todosRoute()));
          }}
        >
          TodoMVC app
        </a>
        .
      </p>
    </div>
  );
}

function backToHome(d: Dispatcher<Msg>) {
  return (
    <div>
      <a
        href="#x"
        onClick={(e) => {
          e.preventDefault();
          d(navigateTo(homeRoute()));
        }}
      >
        {'<-'} Back to home
      </a>
    </div>
  );
}

function viewTodoMvc(dispatch: Dispatcher<Msg>, todoMvc: TodoMvc) {
  return todoMvc.todoId
    .map((todoId: string) => viewTodo(dispatch, todoMvc, todoId))
    .withDefault(viewTodos(dispatch, todoMvc));
}

function viewTodos(dispatch: Dispatcher<Msg>, todoMvc: TodoMvc) {
  const { tab, todos } = todoMvc;

  function viewTab(t: Tab) {
    const active = t === tab;
    let label;
    switch (t) {
      case Tab.All:
        label = 'All';
        break;
      case Tab.Open:
        label = 'Open';
        break;
      case Tab.Closed:
        label = 'Closed';
        break;
    }
    return (
      <li>
        {active ? (
          <span>{label}</span>
        ) : (
            <a
              href="#x"
              onClick={(e) => {
                e.preventDefault();
                dispatch({ type: 'tabClicked', tab: t });
              }}
            >
              {label}
            </a>
          )}
      </li>
    );
  }

  return (
    <div>
      {backToHome(dispatch)}
      <h1>Todo MVC</h1>
      {todos.length === 0 ? (
        <p>You have nothing to do ! Neat !!</p>
      ) : (
          <div>
            <ul>
              {viewTab(Tab.All)}
              {viewTab(Tab.Open)}
              {viewTab(Tab.Closed)}
            </ul>
            <ul>
              {todos
                .filter((todo) => {
                  switch (tab) {
                    case Tab.All:
                      return true;
                    case Tab.Open:
                      return !todo.done;
                    case Tab.Closed:
                      return todo.done;
                  }
                  return false;
                })
                .map((todo) => {
                  const style = {
                    textDecoration: todo.done ? 'line-through' : 'none',
                  };
                  return (
                    <li key={todo.id} style={style}>
                      <a
                        href="#x"
                        onClick={(e) => {
                          e.preventDefault();
                          dispatch(navigateTo(todoRoute(todo.id)));
                        }}
                      >
                        {todo.text}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
    </div>
  );
}

function viewTodo(dispatch: Dispatcher<Msg>, todoMvc: TodoMvc, id: string) {
  const { todos } = todoMvc;
  const todo = maybeOf(todos.find((t) => t.id === id));
  return (
    <div>
      <div>
        <a
          href="#x"
          onClick={(e) => {
            e.preventDefault();
            dispatch(navigateTo(todosRoute()));
          }}
        >
          {'<-'} back to list
        </a>
      </div>
      {todo
        .map((t: TodoItem) => (
          <div>
            <h1>Todo</h1>
            {t.text}
          </div>
        ))
        .withDefault(
          <div>
            <h1>Todo not found !</h1>
            <p>There's no TODO for ID {id}.</p>
          </div>,
        )}
    </div>
  );
}

function viewSamples(dispatch: Dispatcher<Msg>, samples: Samples) {
  return (
    <div>
      {backToHome(dispatch)}
      <h1>Samples</h1>
      <p>
        This is the samples app for <code>react-tea-cup</code>.
      </p>
      <h2>Counter</h2>
      {Counter.view(map(dispatch, mapCounter), samples.counter)}
      <h2>Random</h2>
      {Rand.view(map(dispatch, mapRand), samples.rand)}
      <h2>Parent/child</h2>
      {ParentChild.view(map(dispatch, mapParentChild), samples.parentChild)}
      <h2>Raf</h2>
      {Raf.view(map(dispatch, mapRaf), samples.raf)}
      <h2>Performance</h2>
      {Perf.view(map(dispatch, mapPerf), samples.perf)}
      <h2>More OOP</h2>
      {ClassMsgs.view(map(dispatch, mapClsm), samples.clsm)}
      <h2>Stateful in view()</h2>
      {Sful.view(map(dispatch, mapSful), samples.sful)}
      <h2>Http / JSON</h2>
      {Rest.view(map(dispatch, mapRest), samples.rest)}
      <h2>Time</h2>
      {TimeSample.view(map(dispatch, mapTimeSample), samples.time)}
      <h2>Events</h2>
      {EventsSample.view(map(dispatch, mapEventsSample), samples.events)}
    </div>
  );
}

function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  function mapSample<CM>(f: (s: Samples) => [Samples, Cmd<Msg>]): [Model, Cmd<Msg>] {
    switch (model.tag) {
      case 'samples':
        const sac: [Samples, Cmd<Msg>] = f(model.samples);
        const newModel: Model = { ...model, samples: sac[0] };
        return [newModel, sac[1]];
      default:
        return noCmd(model);
    }
  }

  switch (msg.type) {
    case 'counter':
      return mapSample((s: Samples) => {
        const macCounter = Counter.update(msg.child, s.counter);
        return [{ ...s, counter: macCounter[0] }, macCounter[1].map(mapCounter)];
      });
    case 'parentChild':
      return mapSample((s: Samples) => {
        const macPc = ParentChild.update(msg.child, s.parentChild);
        return [{ ...s, parentChild: macPc[0] }, macPc[1].map(mapParentChild)];
      });

    case 'raf':
      return mapSample((s: Samples) => {
        const macRaf = Raf.update(msg.child, s.raf);
        return [{ ...s, raf: macRaf[0] }, macRaf[1].map(mapRaf)];
      });
    case 'perf':
      return mapSample((s: Samples) => {
        const macPerf = Perf.update(msg.child, s.perf);
        return [{ ...s, perf: macPerf[0] }, macPerf[1].map(mapPerf)];
      });
    case 'rand':
      return mapSample((s: Samples) => {
        const macRand = Rand.update(msg.child, s.rand);
        return [{ ...s, rand: macRand[0] }, macRand[1].map(mapRand)];
      });
    case 'clsm':
      return mapSample((s: Samples) => {
        const macClsm = ClassMsgs.update(msg.child, s.clsm);
        return [{ ...s, clsm: macClsm[0] }, macClsm[1].map(mapClsm)];
      });
    case 'sful':
      return mapSample((s: Samples) => {
        const macSful = Sful.update(msg.child, s.sful);
        return [{ ...s, sful: macSful[0] }, macSful[1].map(mapSful)];
      });
    case 'rest':
      return mapSample((s: Samples) => {
        const macRest = Rest.update(msg.child, s.rest);
        return [{ ...s, rest: macRest[0] }, macRest[1].map(mapRest)];
      });

    case 'timeSample':
      return mapSample((s: Samples) => {
        const macTime = TimeSample.update(msg.child, s.time);
        return [{ ...s, time: macTime[0] }, macTime[1].map(mapTimeSample)];
      });

    case 'eventsSample':
      return mapSample((s: Samples) => {
        const macEvents = EventsSample.update(msg.child, s.events);
        return [{ ...s, events: macEvents[0] }, macEvents[1].map(mapEventsSample)];
      });

    case 'urlChange':
      return init(msg.location);

    case 'newUrl':
      return [model, Task.perform(newUrl(msg.url), (_: Location) => NoOp)];
    case 'tabClicked':
      return [model, Task.perform(newUrl(routeToUrl(todosRoute(msg.tab))), (_: Location) => NoOp)];
    case 'noop':
      return noCmd(model);
  }
}

function subscriptions(model: Model): Sub<Msg> {
  switch (model.tag) {
    case 'samples':
      const { counter, parentChild, raf, time, events } = model.samples;
      return Sub.batch([
        Counter.subscriptions(counter).map(mapCounter),
        ParentChild.subscriptions(parentChild).map(mapParentChild),
        Raf.subscriptions(raf).map(mapRaf),
        TimeSample.subscriptions(time).map(mapTimeSample),
        EventsSample.subscriptions(events).map(mapEventsSample),
      ]);
    default:
      return Sub.none();
  }
}

function onUrlChange(l: Location): Msg {
  return {
    type: 'urlChange',
    location: l,
  };
}

const App = () => (
  <React.StrictMode>
    <ProgramWithNav
      init={init}
      view={view}
      update={update}
      subscriptions={subscriptions}
      onUrlChange={onUrlChange}
      devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />
  </React.StrictMode>
);

export default App;
