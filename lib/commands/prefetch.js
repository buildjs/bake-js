var async = require('async'),
    out = require('out'),
    finder = require('../helpers/finder'),
    formatter = require('formatter'),
    line = formatter('{{name|len:22}} | {{desc|len:60}}');
    
module.exports = function(opts) {
    finder.all(opts, function(err, recipes) {
        if (! err) {
            async.forEach(
                recipes,
                
                function(recipe, itemCallback) {
                    out('!{grey}fetching  {0}', recipe.name);
                    recipe.fetch(function(err) {
                        if (! err) {
                            out('!{grey}retrieved {0}', recipe.name);
                        }
                        else {
                            out('!{maroon}unable to retrieve {0}', recipe.name);
                        }

                        itemCallback(err);
                    });
                },
                
                function(err) {
                    if (! err) {
                        out('!{green}fetched recipes');
                    }
                    else {
                        out.error(err);
                    }
                }
            );
        }
        else {
            out.error(err);
        }
    });
};