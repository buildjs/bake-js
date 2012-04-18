var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    Recipe = require('../recipe'),
    bakery = require('./bakery'),
    reLeadingDot = /^\./;
    
exports.all = function(opts, callback) {
    var bakeryPath = bakery.getPath(opts, true),
        recipePath = path.join(bakeryPath, 'recipes'),
        recipes = [];

    // find the recipes
    fs.readdir(recipePath, function(err, files) {
        async.forEach(
            (files || []).filter(function(file) {
                return !reLeadingDot.test(file);
            }),
            
            function(file, itemCallback) {
                var recipe = recipes[recipes.length] = new Recipe(file, opts);
                
                recipe.load(bakeryPath);
                recipe.on('ready', itemCallback);
            },
            
            function(err) {
                callback(err, recipes);
            }
        );
    });
};