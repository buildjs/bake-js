var path = require('path'),
    fs = require('fs'),
    out = require('out');
    
module.exports = function(opts) {
    var pathRecipes = (opts || {}).local ?
        path.resolve(__dirname, '../../library/recipes') :
        path.resolve(__dirname, '../../data/recipes.local/recipes');

    fs.readdir(pathRecipes, function(err, files) {
        (files || []).forEach(function(file) {
            out('=> {0}', file);
        });
    });
};