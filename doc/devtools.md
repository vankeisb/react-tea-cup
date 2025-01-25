`react-tea-cup` includes developer tools for easier debugging and boosted productivity.

# Principles

TeaCup DevTools is basically like the Redux DevTools : it leverages 
the Model's immutability, and TEA, to help "debugging" and 
understanding what happens in your app :

* Records the Model before and after every update
* Time travel to previous Model states
* Init application with Model snapshot

# Activate Dev Tools

DevTools must be setup at application sartup time. You need to pass a `DevTools` instance
to the `Program`, like this :

```typescript jsx

import { DevTools } from "react-tea-cup";

// create tea-cup DevTools 
const devTools = new DevTools<Model, Msg>()
    .setVerbose(true) // verbose mode : will show logs for updates    
    .asGlobal();      // as a global var (on window)

// connect the DevTools to Program
<Program
    init={init}
    view={view}
    update={update}
    subscriptions={subscriptions}
    {...devTools.getProgramProps()} // <- passes some props for DevTools 
/>
```

# Usage

TeaCup DevTools are available by default as `teaCupDevTools` on the `window`. You can interact with the object in the browser's console :

```typescript jsx
    const evt12 = teaCupDevTools.events[12];
    const lastModel = teaCupDevTools.lastModel();
    teaCupDevTools.travelTo(12);
    teaCupDevTools.forward();
```

> Check out the DevTools class for more info about available methods.