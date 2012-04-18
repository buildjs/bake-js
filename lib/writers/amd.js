var async = require('async'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    _ = require('underscore'),
    out = require('out'),
    Recipe = require('../recipe');
    
function _wrap(input, recipe) {
    var requires = recipe.requirements.map(function(name) {
            return Recipe.parseName(name).name;
        }),
        depsString = '[]';
        
    if (requires.length > 0) {
        depsString = '[\'' + requires.join('\', \'') + '\']';
    }
    
    // add the define header
    return 'define(\'' + recipe.name + '\', ' + depsString + ', function(' + requires.join(', ') + ') {\n' +
        Recipe.indent(input) + 
        '\n\n  return ' + recipe.name + ';\n' +
        '});';
}

module.exports = function(name, recipes, opts, callback) {
    var combined = {},
        targetPath = path.resolve(opts.output),
        allFiles = {};

    _.each(recipes, function(recipe) {
        _.each(recipe.results, function(data, key) {
            var output = recipe._join(data, key);
            
            // if we are on an entry point recipe, and in JS land, then wrap it
            if (recipe.entrypoint && key === 'js') {
                output = _wrap(output, recipe);
            }
            
            allFiles[recipe.name + '.' + key] = output;
        });
    });

    mkdirp(targetPath, function(err) {
        if (err) {
            callback(err);
        }
        else {
            async.forEach(
                Object.keys(allFiles),
                function(key, itemCallback) {
                    var outputFile = path.join(targetPath, key);
                        
                    out('!{grey}==> !{lime}' + outputFile);
                    fs.writeFile(outputFile, allFiles[key], 'utf8', itemCallback);
                },
                
                callback
            );
        }
    });
};