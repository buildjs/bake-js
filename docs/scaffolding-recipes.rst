.. _scaffolding-recipes:

===================
Scaffolding Recipes
===================

Work smarter, not harder.  With that in mind, I created a way to enable you to scaffold a library from a github repository::

    bake scaffold %owner% %project%
    
For instance, I recently scaffolded `Caolan McMahon <https://twitter.com/#!/caolan>`_'s microjs library `nimble <https://github.com/caolan/nimble>`_ with the following command::

    bake scaffold caolan nimble

Which generated the following recipe (placed in the ``library/recipes/nimble`` file)::

    # dsc: A really tiny functional JavaScript and async flow-control library
    # author: caolan
    # url: http://caolan.github.com/nimble
    # src: https://github.com/caolan/nimble
    # bug: https://github.com/caolan/nimble/issues

    [core]
    js <= github://caolan/nimble/nimble.js

The information generated here is gleaned from the `github api <https://develop.github.com>`_ and together with a bit of convention over configuration magic.  

Generally the main file that an author puts in their github repo is in the root folder with the name of the project with a ``.js`` extension (yes the case of a name that includes the .js extension is handled).

If for any reason your file sits in a different location, then you will need to modify the recipe to point to the correct location of the file.
