var path = require('path'),
    fs = require('fs'),
    out = require('out'),
    Recipe = require('../recipe'),
    bakery = require('../helpers/bakery');
    
exports = module.exports = function(project, opts) {
    var recipe;
    
    // check that we have been provided a project name
    // TODO: if not then test each of the recipes
    if (typeof project == 'object' && (! (project instanceof String))) {
        opts = project;
        project = '';
    }
    
    // initialise the recipe
    recipe = new Recipe(project, opts);

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
    
    recipe.load(bakery.getPath(opts, true));
};

exports.desc = 'Check that a recipe can be fetched correctly';