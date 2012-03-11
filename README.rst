=======
bake-js
=======

BakeJS is a project designed to ease the pain and complexity of creating client-side Javascript applications. It takes a similar approach to `homebrew </mxcl/homebrew>`_  in that it uses a github repository to define a number of recipes for building various JS libraries.

Installation
============

To get started with BakeJS first install the command line tools via npm.  If you don't already have `NodeJS <http://nodejs.org/>`_installed then you will need to install it to get access to npm.

    npm install -g bake-js
    

*Depending on your installation, you may need to run this with the ``sudo`` command.*

Once BakeJS is installed, you will then be able to access the ``bake`` command.  First thing you will want to do is fetch the current recipes from this github repo by running the `update` command:

    bake update

If everything has gone to plan, you should see the following output:

    retrieving recipes from remote server...
    extracting recipes
    ✓ done

The ``update`` command here performs the same task as ``brew update``, except that bake downloads the latest ``.tar.gz`` of this repo from github rather than interfacing with git.  General intention is that while the process will be less optimal with regards to bandwidth it is something that should work natively in Windows.

Baking your Application
=======================

Using BakeJS to generate an application file that is packaged with your application dependencies all into a single file is very simple.

The following is an example of how you might create an application that has dependencies on both `backbone <https://github.com/documentcloud/backbone>`_ and `eve <https://github.com/DmitryBaranovskiy/eve>`_:

_highlight: javascript

    // dep: backbone, eve

    var myApp = (function() {
        // your app code here...
    })();

Then run ``bake`` against your target file:

    bake examples/test.js

When run the dependencies are analysed, child dependencies resolved (e.g. underscore is specified as a dependency in the `backbone recipe </DamonOehlman/bake-js/blob/master/library/recipes/backbone>`_ and then all required files are pulled down from their remote sources and pushed to the start of the resulting output.

By default, bake writes output to ``STDOUT`` but in most cases you will want to redirect this output to a file, e.g.

    bake src/yourapp.js > dist/yourapp.js