import React, {Component, ReactNode} from 'react';
// import './App.css';
import {Dispatcher, Program} from './Tea'


type Model = number


function init(): Model  {
    return 0;
}


function view(dispatch: Dispatcher<Msg>, model:Model) : ReactNode {
    return (
        <div>
            Value = {model.toString()}
            <button
                onClick={() => dispatch({ type: "inc" }) }>
                +
            </button>
            <button
                onClick={() => dispatch({ type: "dec"}) }>-</button>
        </div>
    );
}


type Msg = Increment | Decrement


interface Increment {
    type: "inc"
}


interface Decrement {
    type: "dec"
}


function update(msg: Msg, model: Model): Model {
    switch (msg.type) {
        case "inc":
            return model + 1;
        case "dec":
            return model - 1;
    }
}


class App extends Component {
  render() {
    return (
      <div className="App">
        <Program init={init} view={view} update={update}/>
      </div>
    );
  }
}

export default App;
