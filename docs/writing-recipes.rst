.. _writing-recipes:

===============
Writing Recipes
===============


Recipes are simply plain text files that are stored in the `library/recipes <https://github.com/DamonOehlman/bake-js/tree/master/library/recipes>`_ folder in this repository.  For example, the backbone recipe is shown below::

    # dsc: Give your JS App some Backbone with Models, Views, Collections, and Events
    # tag: mvc, framework
    # url: http://backbonejs.org
    # src: https://github.com/documentcloud/backbone
    # bug: https://github.com/documentcloud/backbone/issues
    # req: underscore

    github://documentcloud/backbone/backbone.js

The structure of the file is pretty simple.  Lines starting with the hash character are used to describe attributes of the recipe, of which the most important one to take note of is the `req` attribute.  This attribute is used to specify other recipes that are require to make this library work correctly.  For multiple dependencies use a comma delimited list.

After the attribute definition section comes one or more `getit <https://github.com/DamonOehlman/getit>`_ URL schemes that reference the online location of the file(s) required to make this library work.  In the case of most libraries, this will be a single file, but you can include multiple lines here for multiple files if necessary.

It starts with a fork
=====================

The first thing you are going to want to do if you are interested in creating your own recipes is fork the `bake-js repository <https://github.com/DamonOehlman/bake-js>`_.  This will give you your own space to play and create recipes.

If you are handwriting a recipe, then the first thing to do is to create a file in the ``library/recipes`` folder in your forked repository.  The name of your file should be simply the name of the library you are creating a recipe for (with no file extension).

For instance, let's say I want to create a recipe for `Thomas Fuchs <https://twitter.com/#!/thomasfuchs>`_ `keymaster <https://github.com/madrobby/keymaster>`_ library.  I'd start by taking a look at the github page for the repo and I'd glean some info from there to start my recipe file.

The first thing I would do is work out the location of the actual JS file that will be used in the recipe.  My preference is to find a non-minified JS file.  In the case of keymaster the file is located at:

https://raw.github.com/madrobby/keymaster/master/keymaster.js

But since BakeJS uses `getit <https://github.com/DamonOehlman/getit>`_ under the hood we can use the custom github url scheme implemented in getit (but feel free to use the standard http url as well if you prefer). So, first cut of our keymaster recipe looks like this::

    github://madrobby/keymaster/keymaster.js

Yep, that's it - because keymaster has no dependencies our recipe really only needs to include the location of where it can be found on the web.

In general though, it's good practice to include some extra information about the library that will be displayed in the BakeJS front-end (eventually).  At a minimum I like to include the description of the library (generally the github description works nicely) and where the library can be found on the web.

With that additional information, the recipe looks like this::

    # dsc: A simple micro-library for defining and dispatching keyboard shortcuts.
    # url: https://github.com/madrobby/keymaster

    github://madrobby/keymaster/keymaster.js

Done.  I can now build apps that require keymaster by simply referencing keymaster in a ``dep`` comment.  e.g.:

.. code-block:: javascript

    // dep: keymaster

    // define short of 'a'
    key('a', function(){ alert('you pressed a!') });
    
Testing the new Recipe
======================

Before submitting a pull-request to include the recipe in the main repository, it's probably worth testing the recipe first.  If you try and run BakeJS in the normal way on your test file, you will see it fail::

    damo-mbair:bake-js damo$ ./bin/bake examples/keymaster.js 
    reading: examples/keymaster.js
    parsing file
    Error: Unable to find "keymaster" recipe
    
This is because your recipe exists in the library folder of the repo and not in the local copy of the remote recipes.  To rectify this situation, simply run BakeJS with the ``--local`` flag to tell it you'd like to use your local library instead::

    damo-mbair:bake-js damo$ ./bin/bake --local examples/keymaster.js
    reading: examples/keymaster.js
    parsing file
    <= keymaster:   github://madrobby/keymaster/keymaster.js
    ✓ done

Everything being well, you should have seen your small example file combined with the dependency printed to STDOUT.  Looks like your recipe works and is ready to be submitted.

Submitting your Recipe
======================

Once you have created your recipe and know that it works, then simply `submit a pull request <https://github.com/DamonOehlman/bake-js/pull/new/master>`_ for your new recipe.

In general, the new recipe will be accepted straight in and available for everybody next time they run a ``bake update``.
