var path = require('path'),
    fs = require('fs'),
    out = require('out'),
    finder = require('../helpers/finder'),
    line = require('formatter')('{{name|40}} - {{desc|100}}');
    
module.exports = function(opts) {
    finder.all(opts, function(err, recipes) {
        recipes.forEach(function(recipe) {
            // load the recipe
            recipe.load(opts.bakery);
            recipe.on('ready', function() {
                out(line(recipe));
            });
        });
    });
};