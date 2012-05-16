var async = require('async'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    _ = require('underscore'),
    out = require('out'),
    Recipe = require('../recipe'),
    formatter = require('formatter'),
    globit = formatter('{{1}}\n\n if (typeof {{0}} != \'undefined\') glob.{{0}} = {{0}};');
    
module.exports = function(name, recipes, opts, callback) {
    var combined = {},
        targetPath = path.resolve(opts.output);

    _.each(recipes, function(recipe) {
        _.each(recipe.results, function(data, key) {
            combined[key] = (combined[key] || []).concat(data);
        });
    });

    mkdirp(targetPath, function(err) {
        if (err) {
            callback(err);
        }
        else {
            async.forEach(
                Object.keys(combined),
                function(key, itemCallback) {
                    var outputFile = path.join(targetPath, name + '.' + key),
                        separator = key === 'js' ? '\n;' : '\n';
                    
                    out('!{grey}==> !{lime}' + outputFile);
                    fs.writeFile(outputFile, combined[key].join(separator), 'utf8', itemCallback);
                },
                
                callback
            );
        }
    });
};