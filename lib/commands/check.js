var path = require('path'),
    fs = require('fs'),
    out = require('out'),
    Recipe = require('../recipe');
    
module.exports = function(project, opts) {
    var recipe = new Recipe(project, opts);

    // ensure we are refreshing to check the actual repository
    opts.refresh = true;
    
    recipe.on('ready', function() {
        // fetch the recipe
        recipe.fetch(function(err, results) {
            if (err) {
                out('!{red}{0}', err);
            }
            else {
                out('!{check,green} recipe ok');
            }
        });
    });
    
    recipe.on('error', function(err) {
        out('!{red}{0}', err);
    });
        
    recipe.load();
};