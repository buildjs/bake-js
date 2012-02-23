var getit = require('getit'),
    climate = require('climate'),
    path = require('path'),
    fs = require('fs'),
    zlib = require('zlib'),
    Buffers = require('buffers'),
    tar = require('tar'),
    composer;

function Composer() {
}

Composer.prototype.extractRecipes = function(source, callback) {
    zlib.gunzip(source, function(err, unzipped) {
        var writeComplete;
        
        if (err) {
            callback(err);
        }
        else {
            // TODO: extract just the /library path from the tar 
            var extractor = new tar.Extract({ path: path.resolve(__dirname, '../data/recipes' ) });
            writeComplete = extractor.write(unzipped);

            if (! writeComplete) {
                extractor.on('drain', function() {
                    extractor.end();
                    callback();
                });
            }
            else {
                extractor.end();
                callback();
            }
        }
    });
};

Composer.prototype.updateRecipes = function(callback) {
    var composer = this,
        targetArchive = 'https://github.com/DamonOehlman/compose-js/tarball/master',
        buf = new Buffers();
        source = getit(targetArchive);
        
    source.on('data', buf.push.bind(buf));
    source.on('end', function() {
        composer.extractRecipes(buf.toBuffer(), callback);
    });
};

// create a new composer
composer = new Composer();

exports = module.exports = function() {
    var repl = climate.repl('compose>'),
        inputLine = process.argv.slice(2).join(' ');
        
    // provide the repl a reference to the composer
    repl.composer = composer;
    repl.loadActions(path.resolve(__dirname, 'commands'), function() {
        repl.run(inputLine);
    });
    
    /*
    if (inputLine) {
        repl.on('done', repl.run.bind(repl, 'quit'));
    }
    */
};

exports.composer = composer;