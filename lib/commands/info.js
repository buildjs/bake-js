var path = require('path'),
    fs = require('fs'),
    out = require('out'),
    Recipe = require('../recipe'),
    bakery = require('../helpers/bakery');
    
exports = module.exports = function(project, opts) {
    var recipe = new Recipe(project);
        
    recipe.on('ready', function() {
        out('{0}', JSON.stringify(recipe, null, 2));
    });
    
    recipe.on('error', function(err) {
        out('!{red}{0}', err);
    });
        
    recipe.load(bakery.getPath(opts, true));
};

exports.desc = 'Provide info on the specified recipe';