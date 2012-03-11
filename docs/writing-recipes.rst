===============
Writing Recipes
===============


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