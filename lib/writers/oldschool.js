var async = require('async'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    _ = require('underscore'),
    out = require('out');

module.exports = function(name, recipes, opts, callback) {
    var combined = {},
        targetPath = path.resolve(opts.output);

    _.each(recipes, function(recipe) {
        _.each(recipe.results, function(data, key) {
            combined[key] = (combined[key] || []).concat(data);
        });
    });

    out('\ngenerating oldschool build in folder: ' + targetPath);
    mkdirp(targetPath, function(err) {
        if (err) {
            callback(err);
        }
        else {
            async.forEach(
                Object.keys(combined),
                function(key, itemCallback) {
                    var outputFile = path.join(targetPath, name + '.' + key);
                    
                    out('!{grey}==> !{lime}' + outputFile);
                    fs.writeFile(outputFile, combined[key].join('\n'), 'utf8', itemCallback);
                },
                
                callback
            );
        }
    });
};