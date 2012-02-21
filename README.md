# ComposeJS

## Initial Thoughts

Package management for client-side Javascript is a somewhat broken environment at the moment.  While I'm reasonably happy with some of the work I've done with regards to build tools, tools like [Interleave](/DamonOehlman/interleave) really don't do much to improve the "composability" of smaller JS libraries (such as those found on the [microjs.com](http://microjs.com/) site).

I've been investing more and more into writing smaller, more composable JS libraries but things still just don't feel quite right when it comes to bringing them together in a web application.  

Interleave certainly doesn't solve the problem, and while tools like [Ender](http://ender.no.de) look really promising, requirements on having a client-side JS library published to NPM are less than ideal.  I don't have a problem with publishing them there (although there is some additional pollution of an already difficult to search repository), it's more the fact that some libraries I use __a lot__ (such as [eve](https://github.com/DmitryBaranovskiy/eve)) aren't available through ender.

So at this stage, I'm thinking about writing a very small, simple tool that will take a [homebrew](https://github.com/mxcl/homebrew) like approach to providing recipes for how to install small js libraries.