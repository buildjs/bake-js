var async = require('async'),
    path = require('path'),
    fs = require('fs'),
    getit = require('getit'),
    _ = require('underscore'),
    RecipeParser = require('./parser'),
    dataPath = path.resolve(__dirname, '../../data/recipes.local/');

function _check(requirements, callback) {
    path.exists(dataPath, function(exists) {
        if (! exists) {
            callback(new Error('No local recipes, run "compose update" before attempting composition'));
        }
        
        // resolve requirements for each of the specified libraries
        async.forEach(
            requirements,
            
            function(item, itemCallback) {
                var recipe = new RecipeParser(dataPath, item);
                
                recipe.on('ready', function() {
                    if (recipe.requirements.length) {
                        _check(recipe.requirements, function(err, recipeRequirements) {
                            if (! err) {
                                requirements = recipeRequirements.concat(requirements);
                            }
                            
                            itemCallback(err);
                        });
                    }
                    else {
                        itemCallback();
                    }
                });
            },

            function(err) {
                callback(err, _.uniq(requirements));
            }
        );
    });
};

function _download(recipe, callback) {
    callback(null, '');
}

module.exports = {
    check: _check,
    download: _download
};