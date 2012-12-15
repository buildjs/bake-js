# BakeJS

Bake is a javascript __application__ build tool that is designed to make building web apps as simple as possible.  

It's core reason for existence is to help with managing the dependencies web applications will require, and to make it simple for you to include libraries without having to know where those libraries actually come from.

## Comparison to Other Build Tools

Bake is quite different to other build tools, and in general works very well in partnership with these tools.  It is fairly common for us at [Sidelab](http://www.sidelab.com/) to combine something like [grunt](https://github.com/cowboy/grunt) with bake (using a `Makefile` or similar) to create a streamlined process for building an application.

With regards to build tools that actually perform similar functionality, you should investigate [Ender](https://github.com/ender-js/Ender) to determine which tool is a better fit for your needs.  The essential difference is that Bake pulls in dependencies from directly from the web, whereas Ender uses [NPM](http://npmjs.org/) as it's source of modules.  Neither approach is more right than the other, but depending on your needs one will likely be a better fit.

Additionally, if you are developing using [NodeJS](http://nodejs.org/) and prefer to work with [CommonJS](http://www.commonjs.org/) style `require` statements (and some of the inbuilt Node libraries) then something like [Browserify](https://github.com/substack/node-browserify) might be a better fit for your needs.  It is somewhat magical in the way it works :)

So why use Bake?  Bake is designed to work with the current development styles of building web applications now.  Additionally, it has been built to support other module require patterns such as [AMD](https://github.com/amdjs/amdjs-api) as they become more popular.  If this is the kind of thing you are after, then read on.

## Getting Started: Installation

To be completed.

## Getting Started: Building a Simple Project

To be completed.

## Documentation

Full documentation for bake is available at:

<http://bakejs.readthedocs.org/>
