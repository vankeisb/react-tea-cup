# react-tea-cup manual

This document describes the overall design of tea-cup, and 
of some libraries that have been ported from / inspired by Elm.

## Model-View-Update

For a tea-cup app, you'll need at least :

* a `Model` : this is the state of your application
* an `init` function that creates the initial `Model`, and possibly trigger initial side effects
* a `view` function that renders your `Model` as React VDOM (TSX)
* some `Messages` : those are emitted when events occur
* an `update` function that modifies the `Model` and possibly trigger side effects for your `Message`s

You may also use Subscriptions, which are explained a bit later.

### Model

The model can be anything. Type, interface, it's up to you to decide. In any case, 
*state should be immutable* ! This is a really important point : always make sure your 
state cannot be mutated.

```typescript jsx
// state is a number !
type Model = number

// state is a complex object
interface Model {
    readonly foo: Foo
    readonly bar: string
    readonly stuff: ReadonlyArray<Things>
    ...
}
```

### init

The `init` function is responsible for creating the initial `Model` for the app, and 
to trigger initial side effects, if any (e.g. send an HTTP request, read Local Storage, etc).

```typescript jsx
function init(): [Model, Cmd<Msg>] {
    ...
}
```

### View

The `view` function is responsible of turning your `Model` into React Nodes.

It needs to declare a `Dispatcher<Msg>` as its first arg, and the `Model` as the second arg, and 
it returns a React.Node (usually via TSX) :

```typescript jsx
function view(dispatch:Dispatcher<Msg>, model: Model) {
    return (
        <div>
            ...
            <button onClick={dispatch(sendEmail(model.users.map(u => u.email)))}
        </div>
    )   
}   
```

The `view` function is invoked by tea-cup at every `update`, for every `Msg` that is dispatched.

    
### Messages 

Messages are the dynamic part of your application. They represent anything that happened, 
and that requires to update the model, and render the app again. Messages are dispatched in order 
to respond to DOM events (or to side effects), and you have to implement their behaviour in the 
`update` function. 

Messages in tea-cup can be expressed in different ways, unlike in Elm where you'll always use 
a union type. tea-cup offers several options for implementing Msgs, it is up to you to 
choose the form that suits you best.

#### Discriminated unions

Using discriminated unions allows you to model your Messages as data, and have the update 
logic somewhere else (in the `update` function) :

```typescript jsx
// the messages for our app
type Msg 
    = { type: "foo" }
    | { type: "bar", blah: string, stuff: ReadonlyArray<Things> }
    | ...
    
// the update function 
function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.type) {
        case "foo":
            ...
        case "bar":
            ...
    }
}
```

This is the more "Elm-like" way to model your Messages. Unfortunately, 
discriminated unions are far from being as powerful and pleasant as 
they are in Elm, and using them has drawbacks :

* boilerplate
* no constructor functions

#### Classes           
    
You may also use a more OOP approach, by defining an abstract class (or interface) for
your `Msg` and have messages hold both data and behavior for this message :

```typescript jsx
// the base message class
abstract class Msg {
    abstract execute(model:Model): [Model, Cmd<Msg>] 
} 

// a concrete Msg
class ButtonClicked extends Msg {
    readonly userId: string
    
    execute(model:Model): [Model, Cmd<Msg>] {
        ...
    }
}

// update function gets very simple !
function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    return msg.execute(model)
}
```
    
Drawbacks : 
* boilerplate
* messages are not sealed


#### Functions

A last variant is to use plain functions for encapsulating the data (via capture) and 
the behaviour of the `Msg`s :

```typescript jsx
// Msg type : a function
type Msg = (model:Model) => [Model, Cmd<Msg>]

// a simple msg with no payload
const btnClicked: Msg = model => {
    ...
}

// msg with some payload : func returning a func
function sendEmail(recipients: ReadonlyArray<string>): Msg {
    return model => {
        recipients.map...
        ...
    }
} 

// update just delegates to msg 
function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    return msg(model)
}
```
    
> This variant is probably the one requiring the less boilerplate, as 
you have no switch block, no class declaration, and a constructor function, all in one.

Drawbacks:
* a bit harder to debug (no msg type, only a func, and captured state)
* messages are not sealed     

#### Dispatching

Unlike in Elm, where you always _return_ Messages, in tea-cup you need to 
explicitly _dispatch_ the Messages. This is done using a so-called `Dispatcher<Msg>`, 
which is passed to you by tea-cup.

Example of a message dispatch using discriminated unions :

```typescript jsx
// somewhere in view
<button 
    onClick={dispatch({
        type: "add-user", 
        userId: model.selectedUser.id
    })}>
    Add user
</button>
```
         

### Update
    
As explained above, the `update` function can be implemented in different ways, depending on how you model your 
messages. In any case, `update` needs the `Msg` and the current `Model`, and it should 
return the next model, as well as side effects to trigger, if any (via `Cmd`) :

```typescript jsx
function update(msg:Msg, model:Model): [Model, Cmd<Msg>] {
    ...
}
```

## Side effects

Side effects happen outside of your program. Keyboard or Mouse events, HTTP calls, Web Sockets... 
All this is not directly handled in your TEA "Model -> View -> Update" loop, which has to stay pure. 

Side effects happen outside, but :
* you want to trigger some effects (e.g. _send_ an HTTP request)
* you want to get notified of stuff that has happened (e.g. get the response of an HTTP request, respond to a click on the document, etc.)   

Side effects are managed by so-called "Effect Managers". They are 
external modules that encapsulate the non-pure, low-level stuff. You interact with them via 
"Commands" and "Subscriptions".

### Commands

Commands encapsulate side effects. They are declarative : you create a Command, and then 
tell the runtime to execute it, and to notify you with a Message when it's done. You never 
excecute commands yourself.

It's part of the `update` function's job to return the commands, if any (along with 
the new `Model`).

```typescript jsx
function update(msg:Msg, model:Model): [Model, Cmd<Msg>] 
```

> Commands are usually returned by calls to Effect Managers. You can
implement your own `Cmd` subclasses for encapsulating side effects or calls
to native APIs and the like, but this is usually better done with Tasks, which 
are composable. 

### Tasks

A `Task` is a asynchronous unit of work that may either succeed, or fail. It can perform
side effects, like sending HTTP requests, accessing the Local Storage etc. 

Like Commands, Tasks are declarative :  you don't execute them yourself. It's the runtime's job.

In order to request for execution of a Task, you need to turn it into a Command, and 
return it from your update function : 

```typescript jsx
// create a task that fetches 
// stuff over HTTP using the 
// Http module
const fetchTask: Task<Error,Response> = Http.fetch(...)
  
// turn the Task into a Cmd, and 
// get the result as a Msg in a 
// subsequent update
const cmd: Cmd<Msg> = Task.attempt(fetchTask, onFetchResult)

// msg creator function.
// Your message receives the 
// result of the task : it's either 
// an Error, or a Response
function onFetchResult(r:Result<Error,Response>): Msg {
    ...
}
```

Tasks are base building blocks that can be combined, with `map` and `andThen`. They
are a good place to encapsulate some native, non-pure JS calls, and make those 
cleanly available in your TEA loop. 
    
### Subscriptions

Subscriptions allow you to be notified of events happening _outside_ of your program, and 
turn them into `Msg`s that you handle in `update`. Such events can be global 
keyboard or mouse events on the document, web socket messages, etc.

In order to subscribe, you need to implement the `subscriptions` function :

```typescript jsx
function subscriptions(model: Model) : Sub<Msg> {
    // conditionally subscribe to requestAnimationFrame
    // using the Animation module 
    if (model.isAnimated) {
        // need animation : return a sub and 
        // use a Msg to re-enter our update loop 
        return onAnimationFrame(t:number => {
            return {
                type:"tick",
                time: t
            }
        })
    } else {
        // no subs
        return Sub.none()
    }
}
```

As you can see, the `subscriptions` function takes the `Model` as its sole argument, 
allowing to conditionally subscribe to various things depending on the current state. 
This function is evaluated at every update.

## Program : Wiring everything up

Just like in Elm, you need to pass your `init`, `view`, `update` and `subscriptions` functions 
to a `Program` so that everything is wired up, and the magic happens.

tea-cup's `Program` is a (stateful) React Component, that acts as the root container of 
your application. You can include this program anywhere in your React App.

Here's a full recap :

```typescript jsx
interface Model {
    ...
}


type Msg 
    = ...


function init(): [Model, Cmd<Msg>] {
    ...
}

function view(dispatch:Dispatcher<Msg>, model:Model) {
    ...
}

function update(msg:Msg, model:Model): [Model, Cmd<Msg>] {
    ...
}

function subscriptions(model:Model): Sub<Msg> {
    ...
}

// wire our functions with a tea-cup Program
const program = ( 
    <Program
        init={init}
        view={view}
        update={update}
        subscriptions={subscriptions}
    />
);

// render this as a regular React component
ReactDOM.render(program, document.getElementById('root'))
```

## Performance

A React application that is made of stateful components does not render all 
components every time that one of them updates its local state. It usually will call `render()`
only on a subset of the whole component tree, without the developer needing to know 
(this is the theory : there are hooks in React especially to deal with this). This is good for the 
application's performance.

Redux, and probably other state management libs, also have a solution for rendering only 
what has changed (again, in theory). They will render only components that are "connected" 
to a subset of the whole state that has been updated.

In tea-cup, just like in Elm, there's one single update loop. Updating anything in the model
means that `Program.render()` is called, which in turns invokes the top-level 
`view` function, ending-up re-rendering the whole tree. This can lead to performance issues 
much faster than one could expect.

The solution to this problem is to use memoization explicity in your view functions when you
see performance degrading in the rendering phase. Using a JS profiler will help you 
find the hotspots.  

Then, once you know which function takes too much to render, just memoize it :

```typescript jsx
function expensiveView(dispatcher: Dispatcher<Msg>, stuff:Stuff) {
    // memoize "stuff" : if it hasn't changed, then no need to build the vdom again 
    return memo(stuff)(stuff => 
        <div>
            {stuff.blah}
            ...
        </div>
    )    
}
```
 
> Of course this works only because you have immutable state...

## Mixing with Stateful Components

TODO

## Utilities

tea-cup includes a few useful stuff that we miss from Elm, such as Maybes, Decoders, etc.

### Maybe

A `Maybe` is either "just something", or "nothing" ! The concept is also known as an "Optional"
in other languages. 

It serves as a good replacement for optionals (`?`) in TS, which are not very functional and practical.

```typescript jsx
// TS optionals
function strLen(s?: string) {
    if (s === null || s === undefined) {
        return 0
    } else {
        return s.length
    }
}

// using a maybe
function strLen(s?: string) {
    return maybeOf(s).map(str => str.length).withDefault(0)
}
```

### Result

A `Result` represent the result of a computation that may either succed in a value, 
or fail with an error.

```typescript jsx
// a parser that either returns an Ast, 
// or fails with a parse error

interface ParseError {
    msg: string
    line: number
    col: number
}


interface Ast {
    ...
}

function parseStuff(text:string): Result<ParseError,Ast> {
    ...
    if (weHaveStuff) {
        // assuming it parsed, we return an Ok result 
        // with the ast
        return ok(ast)
    } else {
        // parsing error : return this into an Err result
        return err(parseErr)
    }
}


// invoke the parser and handle the result :
const parseResult: Result<ParseError,Ast> = parseStuff("...")

// results have map() and mapError()
const mappedResult: Result<string, number> = parseResult
    .map(ast => evaluateAst(ast))
    .mapError(parseError => parseError.msg + ` at line ${parseError.line}, col ${parseError.col}`)
    
// and even a match() method that is friendlier than a switch :
const reactElem = parseResult.match(
    ast => <p>Result = {evaluateAst(ast)}</p>,
    err => <div className="error">{err.msg}</div>
)
```

### Decoders

Elm needs Decoders and Encoders in order to convert values from Elm to JS, and inversely. This 
is needed because there's 2 disctinct type systems.

TS has the same type system as JS, so the need for decoder is is different. Here, we mostly want to 
_validate_ that some dynamic JS object is compliant to our TS types.

Decoders avoids to cast and have runtime errors later on. They fail early, at decoding-time, with a nice error message. 

```typescript jsx
class User {
    readonly name: string
    readonly age: number
    readonly roles: ReadonlyArray<string>
}

const o:any = JSON.parse(...)
```

A naïve way to turn an `any` into a TS type :

```typescript jsx
// let's just cast !
// BAD : who knows what's in "o" ?
const user: User = o as User
```

A safer way is to use a `Decoder` for the type `User` :

```typescript jsx
const userDecoder: Decoder<User> =
    // map a 3-field object
    Decoder.map3(
        // values have been decoded, return our typed object 
        (name:string, age:number, roles: ReadonlyArray<string>) => {
            return {
                name: name,
                age: age,
                roles: roles
            }
        },
        Decode.field("name", Decode.str), // decoder for string field "name"
        Decode.field("age", Decode.num), // decoder for number field "age"
        // decoder for string[] field "roles"
        Decode.field(
            "roles",
            Decode.array(Decode.str)           
        )
    )
    
// decoding yields a Result : it may have failed (with a message) !
const user: Result<string,User> = userDecoder.decodeValue(o)    
```

Decoders can be easily combined and reused easily, and allow to do some 
mapping/conversion along the way. They provide an elegant way of turning
non-structured JS objects into complex TS types, safely.

### Http

tea-cup ships with a simple yet useful `Http` module that makes the `fetch` API 
available as `Tasks`, and provides utilities for managing HTTP requests and responses.

```typescript jsx
interface User {
    ...
}

// decoder for User type
const userDecoder: Decoder<User> = ...

// task that will fetch the user over HTTP
// and decode the body as a User.
// If anything fails (non-OK response or invalid decoding),
// then you'll get an Error.
const fetchUserTask: Task<Error,User> = 
    Http.jsonBody(
        Http.fetch("https://..."),
        userDecoder
    );


// the task can be turned into a Cmd so that it can be 
// executed by the runtime, and we'll get the result in 
// a "fetch-user-result" message 
const fetchUserCmd: Cmd<Msg> = 
    Task.attempt(
        fetchUserTask,
        (r:Result<Error,User>) => {
            return {
                type: "fetch-user-result",
                result: r
            }
        }
    )
```

### Animation

tea-cup ships with an `Animation` Effect Manager that allows to use `requestAnimationFrame`
in your TEA loop.




