# ComposeJS

## Initial Thoughts

Package management for client-side Javascript is a somewhat broken environment at the moment.  While I'm reasonably happy with some of the work I've done with regards to build tools, tools like [Interleave](/DamonOehlman/interleave) really don't do much to improve the "composability" of smaller JS libraries (such as those found on the [microjs.com](http://microjs.com/) site).

I've been investing more and more into writing smaller, more composable JS libraries but things still just don't feel quite right when it comes to bringing them together in a web application.  

Interleave certainly doesn't solve the problem, and while tools like [Ender](http://ender.no.de) look really promising, requirements on having a client-side JS library published to NPM are less than ideal.  I don't have a problem with publishing them there (although there is some additional pollution of an already difficult to search repository), it's more the fact that some libraries I use __a lot__ (such as [eve](https://github.com/DmitryBaranovskiy/eve)) aren't available through ender.

So at this stage, I'm thinking about writing a very small, simple tool that will take a [homebrew](https://github.com/mxcl/homebrew) like approach to providing recipes for how to install small js libraries.  It will make use of the [getit](/DamonOehlman/getit) library to bring down files from a variety of sources, and cache those files locally for generally speedy build times.

## Structuring for Composability

If you are writing a microjs style library with zero dependencies, then you don't have to do anything special at all.  Just fork this library, and create a formula file for your library and make a pull request.  We'll bring it straight in 99.9% if the time.  

A proposed formula file is shown below, in this case for the eventing library eve:

```
# dsc: Tiny event helping JavaScript library.
# url: http://dmitry.baranovskiy.com/eve/
# bug: https://github.com/DmitryBaranovskiy/eve/issues

github://DmitryBaranovskiy/eve/eve.js
```

The formula file is a plain text file with hash comment lines that will be used to populate a simple online directory and search interface for compose-js.

### But my library has dependencies

Let's face it, if we are all building 0 dependency libraries, then something is wrong and JS really isn't going to get that far.  More than likely you are building on someone else's work and need that library available to do something meaningful.  My thoughts for dealing with this is making two versions of your library available in your source repo.  Firstly, one that includes all the prerequisite libraries in a single `js` file and another that has some flag comments saying which libraries are required when your library is being composed into a larger work.  At this stage I'm thinking a single line comment, immediately following by a plus (+) character would do the job nicely.

For instance, here is what I'm thinking with regards to my experimental [IoC](/DamonOehlman/ioc) library:

```js
//+ eve
//+ underscore
//+ matchme

(function(glob) {
    var reAttributes = /^(.*)\[(.*)\]$/,
        reAttr = /^(\+)?(\w+)\=?(.*)$/;
    
    // removed :)
    
    var IoC = new ControlScope();
    
    (typeof module != "undefined" && module.exports) ? (module.exports = IoC) : (typeof define != "undefined" ? (define("IoC", [], function() { return IoC; })) : (glob.IoC = IoC));
})(this);
```

The `compose` command line tool would interpret these comments and replace them with the appropriate recipe includes (using cached copies where available to speed up the build process).

In the event that the IoC library was composed with another library that uses eve (for example) or with an application that required eve the two composition directives (`//+ eve`) would be replaced by a single directive and eve would only be included once.  This is far from being a new or novel technique, but one that has typically not been done well with regards to online repositories and existing JS build solutions.

## Summary

In summary, the purpose of this project is to increase the re-usability of JS libraries and to make a distinction between building and composing JS libraries and applications. By making this distinction a few things become easier to deal with, including the fact that some libraries may choose to include a compile step during the build process making use of other find languages such as [coffee-script](http://coffeescript.org/) or [roy](http://roy.brianmckenna.org/).

If you have any thoughts on this, please feel free to leave an issue for discussion or hit me up on [Twitter](http://twitter.com/DamonOehlman).



