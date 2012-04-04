var path = require('path'),
    fs = require('fs'),
    out = require('out'),
    finder = require('../helpers/finder'),
    formatter = require('formatter'),
    line = formatter('{{name|len:22}} | {{desc|len:60}}');
    
module.exports = function(opts) {
    finder.all(opts, function(err, recipes) {
        recipes.forEach(function(recipe) {
            out(line(recipe));
        });
    });
};