Want some TEA in your React ?

# What ?

`react-tea-cup` is a very thin library that helps following The Elm Architecture pattern, in React. 

# Why ?

Elm and React follow different paths. One tries to advocate for a single stack (Elm), whereas the other 
is very open and already has several "flavors".

Also, all the React "TEA-alternatives" (ie Redux et al) seem very complex, overkill at best, and sometimes just bad.

This makes it hard for people to choose what flavor best fits them. Choice is good. Too much choice ? Maybe not so good...

So this is an attempt to implement our beloved TEA pattern, with React (and TypeScript).

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
    
    
# Pros & Cons (so far)    
    
## What's cool    

* Really TEA-like (minus everything else that's good in Elm, but still better than nothing)
* Simple to implement (so far)
* Interop at the `Component` level
    
## What sucks

* Boilerplate/Uglyness in "tagged types"
    * Discriminated Unions with "switch/cast" looks so ugly vs. real tags + pattern matching
* Compiler often needs some help 
    * declare args, vars, use "as"...
    * pain with tagged types
* Compilation messages are ugly
* I miss my partials
* Exceptions !!! Exceptions !!!
* Open doors for crap everywhere (state, side effects, mutations...)

# TODOs

Subs and Effect Managers...