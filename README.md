[![Build Status](https://travis-ci.org/vankeisb/react-tea-cup.svg?branch=develop)](https://travis-ci.org/vankeisb/react-tea-cup) ![](https://img.shields.io/github/tag/vankeisb/react-tea-cup.svg?label=latest&style=flat)

Want some TEA in your React ?

`react-tea-cup` is a very thin library that helps following The Elm Architecture, in React. 

**Disclaimer: This is an early inception, playground project ! Use at your own risk.**

# Why ?

Elm and React follow different paths. One tries to advocate for a single stack (Elm), whereas the other 
is very open and already has several "flavors".

This is an attempt to implement our beloved TEA pattern, with React (and TypeScript).

## Features

Has to be :
* Simple
    * Very easy to understand for TEA-friendly people
    * Easy for people with some Redux knowledge
* As close to TEA as possible
    * Model, Msg, init, view, update, subs, fx managers
* As safe as we can 
    * hey, TS isn't Elm...
* Integrable with other "styles" of React
    * Redux, Stateful components etc


## Concepts

* React for vdom/rendering
* "pure" view/update 
* `Cmd` for side effects 
* `Html.program` equivalent (turns your `view`, `update`, etc. into a React `Component`)
* Support for parent/child (`Cmd.map`, `Html.map`)
* `Html.lazy` equivalent (memoization) for performance
    

# Install & use

    npm i react-tea-cup --save
    
See the [Samples](./samples), e.g. the infamous [Counter](./samples/src/Samples/Counter.tsx) !    