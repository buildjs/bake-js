# BakeJS

BakeJS is a project designed to ease the pain and complexity of creating client-side Javascript applications.

## Installation

To get started with BakeJS first install the command line tools via npm.  If you don't already have [NodeJS](http://nodejs.org/) installed then you will need to install it to get access to npm.

```
npm install -g bake-js
```

_Depending on your installation, you may need to run this with the `sudo` command._

Once BakeJS is installed, you will then be able to access the `bake` command.  First thing you will want to do is fetch the current recipes from this github repo by running the `update` command:

```
bake update
```

If everything has gone to plan, you should see the following output:

```
retrieving recipes from remote server...
extracting recipes
✓ done
```

While similar to the way the [homebrew](https://github.com/mxcl/homebrew) update command works except bake downloads the latest `.tar.gz` of this repo from github rather than interfacing with git.  General intention is that while the process will be less optimal with regards to bandwidth it is something that should work natively in Windows.

## Composing Applications

Using BakeJS to generate an application file that is packaged with your application dependencies all into a single file is very simple.

The following is an example of how you might create an application that has dependencies on both [backbone](https://github.com/documentcloud/backbone) and [eve](https://github.com/DmitryBaranovskiy/eve):

```js
// dep: backbone, eve

var myApp = (function() {
    // your app code here...
})();
```

Then run `bake` against your target file:

```
bake examples/test.js
```

When run the dependencies are analysed, child dependencies resolved (e.g. underscore is specified as a dependency in the [backbone recipe](/DamonOehlman/bake-js/blob/master/library/recipes/backbone)) and then all required files are pulled down from their remote sources and pushed to the start of the resulting output.

By default, bake writes output to `STDOUT` but in most cases you will want to redirect this output to a file.

## Writing Recipes

Recipes are simply plain text files that are stored in the [library/recipes](/DamonOehlman/bake-js/tree/master/library/recipes) folder in this repository.  For example, the backbone recipe is shown below:

```
# dsc: Give your JS App some Backbone with Models, Views, Collections, and Events
# tag: mvc, framework
# url: http://backbonejs.org
# src: https://github.com/documentcloud/backbone
# bug: https://github.com/documentcloud/backbone/issues
# req: underscore

github://documentcloud/backbone/backbone.js
```

The structure of the file is pretty simple.  Lines starting with the hash character are used to describe attributes of the recipe, of which the most important one to take note of is the `req` attribute.  This attribute is used to specify other recipes that are require to make this library work correctly.  For multiple dependencies use a comma delimited list.

After the attribute definition section comes one or more [getit](https://github.com/DamonOehlman/getit) URL schemes that reference the online location of the file(s) required to make this library work.  In the case of most libraries, this will be a single file, but you can include multiple lines here for multiple files if necessary.

## Companion Tools

BakeJS aims to make combining multiple JS libraries when building a JS-powered application simple.  It does not, however, aim to simplify the process of creating that library through allowing you to concatenate local files together into a single JS library.  

If you are writing a JS library, then I would highly recommend checking out one of the following tools, or alternatively, use a simple makefile to concatenate your files into a single JS file.  For many people this is the simplest and most effective way.