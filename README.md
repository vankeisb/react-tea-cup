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
    
    
# Conclusions (so far)


I am not yet really sold on the approach !

TEA really shines with Elm. The pattern is simple, and 
enforced by the language and libraries. With the React/TS stack, 
you cannot have the same level of guarantees. 
So even if TEA is "theoretically" doable with React, there 
will always be loose contracts, open doors and other uglyness.
Not to mention even more boilerplate. I think that Redux et al 
will suffer the same problems, if you have TS as a basis.

On the other hand, writing stateful React components can 
quickly become painful. It leads to distributed state, 
spaghetti code and other issues. Looks simple at first sight, 
but becomes hard to understand when the app scales.

So, in order to figure this out, I need to try a somehow complex UI, 
implemented with the two approaches : Stateful vs. TEA.
This thould bring interesting conclusions...  
     
    
## What's cool    

* Really TEA-like (minus everything else that's good in Elm, but still better than nothing)
* Simple to implement (so far)
* Interop at the `Component` level
* Easy to profile with standard tooling
    
## What sucks

* Boilerplate/Uglyness everywhere
    * null, undefined, NaN... back to square 1 (without the money)
    * Discriminated Unions with "switch/cast" looks so ugly vs. real tags + pattern matching
* Compiler often needs some help 
    * declare args, vars, use "as"...
    * pain with tagged types
* Compilation messages are ugly
* I miss my partials
* Exceptions !!! Exceptions !!!
* Open doors for crap everywhere (state, side effects, mutations...)

### To be investigated

* why do I need a catch-all for "unions" ? seems that sometimes it's needed, sometimes it is not... annoying.
* can't trust the debugger !! I've seen it report false variable values... sourcemap problem ? dev server problem ? go figure out...

# Memo vs PureComponent

We could be totally pure, by replacing view by a PureComponent, props-based.
Problem is that we could not easily embed stateful components then.

So we choose to let people explicity use memo() if needed. It's a small price to pay to stay open.