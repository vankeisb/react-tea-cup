# react-tea-cup manual

This document describes the overall design of tea-cup, and 
of some libraries that we ported from Elm, such as Maybe 
or Result.

## Model-View-Update

This part is very similar to Elm. For a tea-cup app, you'll need at least :

* a `Model` : this is the state of your application
* some `Messages` : those are emitted when side effects occur (clicks, ajax requests, ...)
* a `view` function that renders your `Model` as React VDOM (TSX)
* an `update` function that modifies the `Model` and possibly trigger side effects for your `Message`s

You may also use Subscriptions, which are explained a bit later.

### Model

The model can be anything. Type, interface, it's up to you to decide. In any case, 
*state should be immutable* ! This is a really important point. TS cannot force immutability
but it can help to achieve it... Always make sure your state cannot be mutated.

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

    
### Messages 

Messages in tea-cup can be expressed in different ways, unlike in Elm where you'll always use 
a union type. tea-cup offers several options for implementing Msgs, it is up to you to 
choose the form that suits you best.

#### Discriminated unions

Using dicriminated unions allows you to model your Messages as data, and have the update 
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

A last variant is to use plain functions for encasulating the data (via capture) and 
the behaviour of the `Msg`s :

```typescript jsx
// Msg type : a function
type Msg = (model:Model) => [Model, Cmd<Msg]

// a concrete Msg
const btnClicked: Msg = model => {
    ...
}

// msg with some payload
function sendEmail(recipients: ReadonlyArray<string>): Msg {
    return model => {
        recipients.map...
        ...
    }
} 

// here too, update is therefore very simple 
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
which is passed to your code where you need it.

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
         

### View

The `view` function is almost the same as in Elm, except that :

* it needs to declare a `Dispatcher<Msg>` as its first arg, and the `Model` as the second arg
* it returns some React.Node (usually via TSX)

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

### Update
    
As explained above, the `update` function can have several forms, depending on how you model your 
messages. In any case, `update` needs the `Msg` and the current `Model`, and it should 
return the next model, as well as side effects to trigger, if any (via `Cmd`) :

```typescript jsx
function update(msg:Msg, model:Model): [Model, Cmd<Msg>] {
    ...
}
```

### Side effects

Side effects happen outside of your program. Keyboard or Mouse events, HTTP calls, Web Sockets... 
All this is handled in your TEA "Model -> View -> Update" loop. 

It happens outside, but :
* you want to trigger some effects (e.g. _send_ an HTTP request)
* you want to get notified of stuff that has happened (e.g. get the response of an HTTP request, respond to a click on the document, etc.)   

Side effects are managed by so-called "Effect Managers". They are 
external modules that encapsulate non-pure, low-level stuff. You interact with them via 
"Commands" and "Subscriptions".

#### Commands

Commands are declarative. You basically create a Command in order to tell the runtime to actually do 
something for you, and notify you with a Message when it's done.

> Most of the time you won't need to implement your own Commands, unless you are 
writing an Effect Manager of your own.

It's part of the `update` function's job to return commands in order to instruct the runtime that 
it has to perform side effects.

#### Tasks

A `Task` is an asynchronous unit of work that may either succeed, or fail. 

Like Commands, Tasks are declarative :  you don't execute them yourself. It's the runtime's job.

In order to request for execution of a Task, you need to turn it into a Command, and 
return it from your update function : 

```typescript jsx
// create a task that fetches 
// stuff over HTTP
const fetchTask: Task<Error,Response> = ...
  
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
cleanly available in tea-cup. 

    
#### Subscriptions

Subscriptions allow you to be notified of events happening outside of your program, and 
turn them into `Msg`s that you handle in `update`. Such events can be global 
keyboard or mouse events on the document, web socket messages, etc.

In order to subscribe, you provide the `subscriptions` function :

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

## Utilities

### Maybe

### Result

### Decoders

### Http

### Animation





