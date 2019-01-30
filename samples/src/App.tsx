import React from 'react';
import {Program} from "react-tea-cup";
import * as Counter from './Samples/Counter'
import * as ParentChild from './Samples/ParentChild'
import * as Raf from './Samples/Raf'

const App = () => (
  <div>
    <h1>Samples</h1>
    <p>
      This is the samples app for <code>react-tea-cup</code>.
    </p>
    <h2>Counter</h2>
    <Program init={Counter.init} view={Counter.view} update={Counter.update} subscriptions={Counter.subscriptions}/>
    <h2>Parent/child</h2>
    <Program init={ParentChild.init} view={ParentChild.view} update={ParentChild.update} subscriptions={ParentChild.subscriptions}/>
    <h2>Animation</h2>
    <Program init={Raf.init} view={Raf.view} update={Raf.update} subscriptions={Raf.subscriptions}/>
  </div>
);

export default App;
