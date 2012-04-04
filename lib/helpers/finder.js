var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    Recipe = require('../recipe'),
    reLeadingDot = /^\./;
    
exports.all = function(opts, callback) {
    var recipePath = path.join(opts.bakery, 'recipes'),
        recipes = [];

    // find the recipes
    fs.readdir(recipePath, function(err, files) {
        async.forEach(
            (files || []).filter(function(file) {
                return !reLeadingDot.test(file);
            }),
            
            function(file, itemCallback) {
                var recipe = recipes[recipes.length] = new Recipe(file, opts);
                
                recipe.load(opts.bakery);
                recipe.on('ready', itemCallback);
            },
            
            function(err) {
                callback(err, recipes);
            }
        );
    });
};