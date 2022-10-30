# Quickstart

This is a quick introduction to using tea-cup. It shows how to create 
a simple Counter application, from scratch. 

## Setup

You'll need to setup the project before you get to actual coding.

### Create the project

You need a React project in order to start using tea-cup.
In order to keep things simple, we'll use the infamous `create-react-app` :

    yarn create react-app my-app --template typescript
    cd my-app
    
### Add tea-cup to your dependencies

    yarn add -D react-tea-cup tea-cup-core
    
### Run the dev server

We'll start the dev server, and let it recompile everything 
when we save files :

    yarn start
    
This should also open your default browser to http://localhost:3000
and show you the default generated app.

## Implementing the counter

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

## Sending HTTP requests

The following example shows how to use Http requests, involving Tasks 
and Cmds.

Replace the contents of `App.tsx` with the following, code :

```typescript jsx
import {Http, Cmd, Task, Result, Dispatcher, Decode, Decoder, Maybe, nothing, Sub, Program, just} from "react-tea-cup";
import * as React from 'react'


interface Model {
  // name of the repo
  readonly repo: string
  // use Maybe of Result to model state :
  // * nothing : loading commits
  // * just(error) : last fetch has failed, we have the error
  // * just(commit[]) : last fetch succeeded, we havbe the commits
  readonly commits: Maybe<Result<Error,ReadonlyArray<Commit>>>
}
    
interface Commit {
  readonly sha: string
  readonly author: string
}
  

type Msg 
  // repo name changed 
  = { type: "repo-changed", value: string }
  // trigger a fetch of commits
  | { type: "fetch" }
  // got fetch response, or an error
  | { type: "got-commits", commits: Result<Error,ReadonlyArray<Commit>> }


function init(repo: string): [Model, Cmd<Msg>] {
  return [
    {
      repo: repo, // store initial repo name
      commits: nothing // initial state is "loading"
    },
    fetchCommits(repo) // initial fetch
  ]
}

function view(dispatch: Dispatcher<Msg>, model: Model) {
  return (
    <>
      <h1>
        Fetch data using Http module
      </h1>
      <input
        type="text"
        value={model.repo}
        onChange={e => {
          // update repo name on input change
          const value = (e.target as HTMLInputElement).value;
          dispatch({
            type: "repo-changed",
            value: value
          })
        }}/>
      <button
        disabled={
          // disable the button if we are fetching
          model.commits.type === "Nothing"
        }
        onClick={() => 
          // fetch commits on click
          dispatch({ type: "fetch" })
        }      
      >
        Fetch commits
      </button>
      <hr/>
      { 
        model.commits
          // commits are present : map the result
          .map(commitsResult => 
            // use Result.match to map the result 
            // depending if it's ok, or an error
            commitsResult.match(
              // all good, we have commits, build the vdom
              commits => 
                <ul>
                  { commits.map(commit => 
                      <li key={commit.sha}>
                        {commit.sha} - {commit.author}
                      </li>
                  )}
                </ul>,
              // in case there's an error, show it
              error =>                     
                <p>Fetch error : {error.message}</p>
            )          
          )
          // commits == nothing, we are currently fetching
          .withDefault(
            <p>Fetching...</p>
          )
      }
    </>
  )
}

function update(msg:Msg, model:Model): [Model, Cmd<Msg>] {
  switch (msg.type) {
    case "repo-changed":
      // just change the repo in Model
      return [
        { ...model, repo: msg.value },
        Cmd.none()
      ]
    case "fetch":
      // indicate that we are fetching (set commits to nothing)
      // and trigger thje fetch
      return [
        { ...model, commits: nothing },
        fetchCommits(model.repo)
      ]
    case "got-commits":
      // got the fetch response, assign it to 
      // the Model
      return [
        { ...model, commits: just(msg.commits) },
        Cmd.none()
      ]
  }
}

// no subs in this example
function subscriptions(model:Model): Sub<Msg> {
  return Sub.none()
}

// create and return a Cmd that fetches commits 
// for the passed repo
function fetchCommits(repo: string): Cmd<Msg> {
  // create a Task that fetches the commits or fails with an Error
  const fetchTask: Task<Error,ReadonlyArray<Commit>> =
    Http.jsonBody(
      // create a fetch Task
      Http.fetch(`https://api.github.com/repos/${repo}/commits`),
      // decode the response with this decoder
      Decode.array(commitDecoder)
    );

  // Msg creator function
  function gotCommits(r:Result<Error,ReadonlyArray<Commit>>): Msg {
    return {
      type: "got-commits",
      commits: r
    }
  }
    
  // "perform" the Task, and indicate which message
  // needs to be used for handling the response
  return Task.attempt(fetchTask,gotCommits);
}


// create a Msg to handle the response of the fetch 

// A decoder for Commit objects
const commitDecoder: Decoder<Commit> =
  Decode.map2(
    (sha:string, author:string) => {
        return {
            sha: sha,
            author: author
        }
    },
    Decode.field("sha", Decode.str),
    Decode.at(["commit", "author","name"], Decode.str)
  );


// wire the program
const App = () => (
  <Program
    init={() => init("Microsoft/TypeScript")}
    view={view}
    update={update}
    subscriptions={subscriptions}
  />
);

export default App;
```