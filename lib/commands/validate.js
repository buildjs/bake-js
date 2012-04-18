var async = require('async'),
    path = require('path'),
    fs = require('fs'),
    out = require('out'),
    reStatusOK = /^2/,
    reTrailingJS = /\.js$/,
    reSkipFile = /^\./,
    assert = require('assert'),
    bakery = require('../helpers/bakery'),
    Recipe = require('../recipe');

exports = module.exports = function(opts) {
    var bakeryPath = bakery.getPath(opts, true);
    
    // read the recipes in the database and check that they are valid
    fs.readdir(path.join(bakeryPath, 'recipes'), function(err, files) {
        async.forEach(
            (files || []).filter(function(file) {
                return !reSkipFile.test(file);
            }),
            
            function(file, itemCallback) {
                // load as a recipe
                var recipe = new Recipe(file);
                
                // pass ready and error events back to the item callback
                recipe.on('ready', function() {
                    var err;
                    
                    try {
                        assert(recipe.sections.core, file + ' recipe is missing the core section');
                    }
                    catch (e) {
                        err = e;
                    }
                    
                    itemCallback(err);
                });
                
                recipe.on('error', itemCallback);
                
                // load the recipe from the current working directory
                recipe.load(bakeryPath);
            },
            
            function(err) {
                if (err) {
                    out('!{red}{0}', err);
                }
                else {
                    out('!{green}All recipes are formatted correctly');
                }
            }
        );
    });
};

exports.desc = 'Validate recipe files are in the valid format';