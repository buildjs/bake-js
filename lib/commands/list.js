var path = require('path'),
    fs = require('fs'),
    out = require('out');
    
module.exports = function(opts) {
    fs.readdir(opts.bakery, function(err, files) {
        (files || []).forEach(function(file) {
            out('=> {0}', file);
        });
    });
};