===========
Why BakeJS?
===========

One of the successes of `homebrew <https://github.com/mxcl/homebrew>`_ seems to lie in how simple it is to fork the repo, create a new recipe and submit a pull request to have that recipe included in the main repo.  This is something that I think is missing in the land of client-side Javascript.

At the core of BakeJS that is the idea.  If you need a client-side library and an existing recipe doesn't exist, then you fork the repo, get to :ref:`writing-recipes` and then finally issue a pull request to have it included in the main repo.

It's a simple process, and you can contribute recipes even if you aren't the maintainer of the library.  Everybody wins.

Alternative Solutions - Ender
=============================

I absolutely tip my hat to `Dustin Diaz <https://github.com/ded>`_ for `Ender <https://github.com/ender-js/Ender>`_.  It works really well, has some great command-line tools for querying what is available and lots of other great features, however, it has one problem:

**Ender packages need to be managed in NPM**

Don't get me wrong, I love NPM, and I've written more than a couple node modules.  I just don't think it's the right place for client-side libraries.

A great case in point for me is a library that I do a lot with: `eve <https://github.com/DmitryBaranovskiy/eve>`_.  At this current point in time the npm deployed version of eve was not put there by `Dmitry Baranovskiy <http://twitter.com/DmitryBaranovsk>`_ and as such it cannot be maintained by Dmitry.

While I'm not going into the ins and outs of it here, its a problem, and working around the problem creates more clutter in NPM and confusion for all of us.