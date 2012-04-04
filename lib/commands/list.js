var path = require('path'),
    fs = require('fs'),
    out = require('out'),
    finder = require('../helpers/finder');
    
module.exports = function(opts) {
    finder.list(opts, function(err, recipes) {
        out('available recipes:\n');
        
        recipes.forEach(function(recipe) {
            out(' => {0}', recipe.name);
        });
    });
};