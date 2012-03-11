=======================
Building vs Composition
=======================

BakeJS aims to make combining multiple JS libraries when building a JS-powered application simple.  It does not, however, aim to simplify the process of creating that library through allowing you to concatenate local files together into a single JS library.

We make this distinction where we consider the process behind creating a standalone Javascript library as **building** and bringing those libraries together for your application as **composition**.  BakeJS is a tool designed to help with composition.

If you are creating a JS library and looking for a tool to help you with building it, then BakeJS probably isn't the tool you are looking for.  Instead check out one of the following alternatives, but remember to look into :ref:`writing-recipes`:

- `Interleave <https://github.com/DamonOehlman/interleave>`_
- `Grunt <https://github.com/cowboy/grunt>`_