This is a quick introduction to using tea-cup. It shows how to create 
a simple Counter application, from scratch. 

# Setup

You'll need to setup the project before you get to actual coding.

1/ Create the project

You need a React project in order to start using tea-cup.
In order to keep things simple, we'll use the infamous `create-react-app` :

    npx create-react-app my-app --typescript
    
2/ Add tea-cup to your dependencies

    npm install react-tea-cup --save
    
3/ Run the dev server

We'll start the dev server, and let it recompile everything 
when we save files :

    npm start
    
This should also open your default browser to http://localhost:3000
and show you the default generated app.

# Implementing the counter

Now let's add our usual TEA ingredients ! Open `src/App.tsx` in your 
favourite editor, and replace its contents with this :

```typescript jsx
import React from 'react';
// bare minimum to use tea-cup
import { Dispatcher, Cmd, Program, Sub } from 'react-tea-cup';

// a Model can be anything. Here, it's simply a number...
type Model = number;

// the Messages can be modeled in various ways. Here we choose 
// discriminated union types.
type Msg 
  = { type: "INCREMENT" }
  | { type: "DECREMENT" }


// init is called once, at application startup, and returns the 
// initial model, as well as commands if any.
function init(): [Model, Cmd<Msg>] {
  return [ 
    0, // initial model
    Cmd.none() // no initial commands
  ]
}


// view function takes the model, and returns a React node (TSX). 
// It also needs the dispatcher function, so that 
// the view can dispatch messages.
function view(dispatch:Dispatcher<Msg>, model: Model) {
  return (
    <div>
      <button onClick={() => dispatch({type: "DECREMENT"})}>-</button>
      <span>value = {model}</span>
      <button onClick={() => dispatch({type: "INCREMENT"})}>+</button>
    </div>
  )
}

// update function : handle the messages and return a [model, cmd] pair
function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
  switch (msg.type) {
    case "INCREMENT": 
      return [ model + 1, Cmd.none() ];
    case "DECREMENT":
      return [ model - 1, Cmd.none() ];
  }
}

// subs : return the subscriptions for the model, evaluated at every update.
function subscriptions(model: Model): Sub<Msg> {
  return Sub.none(); // no subs in this example
}

// App is a functional React component that delegates to <Program/>
// Program is where the whole wiring is done.
const App = () => (
  <Program
    init={init}
    view={view}
    update={update}
    subscriptions={subscriptions}
  />
);

export default App;
```


Save the file, the dev server should recompile and reload the page, where you 
should now have a working counter app !

The code is intentionally verbose and heavily commented.