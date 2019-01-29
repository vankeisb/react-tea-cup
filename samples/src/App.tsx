import React, { Component } from 'react';
import {Program} from "react-tea-cup";
import * as Counter from './Samples/Counter'
import * as ParentChild from './Samples/ParentChild'

const App = () => (
  <div>
    <h1>Samples</h1>
    <p>
      This is the samples app for <code>react-tea-cup</code>.
    </p>
    <h2>Counter</h2>
    <Program init={Counter.init} view={Counter.view} update={Counter.update}/>
    <h2>Parent/child</h2>
    <Program init={ParentChild.init} view={ParentChild.view} update={ParentChild.update}/>
  </div>
)

export default App;
