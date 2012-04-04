var fs = require('fs'),
    path = require('path'),
    Recipe = require('../recipe'),
    reLeadingDot = /^\./;
    
exports.all = function(opts, callback) {
    var recipePath = path.join(opts.bakery, 'recipes'),
        recipes = [];

    // find the recipes
    fs.readdir(recipePath, function(err, files) {
        (files || []).forEach(function(file) {
            if (! reLeadingDot.test(file)) {
                recipes[recipes.length] = new Recipe(file);
            }
        });
        
        callback(err, recipes);
    });
};