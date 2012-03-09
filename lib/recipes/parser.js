var async = require('async'),
    events = require('events'),
    fs = require('fs'),
    util = require('util');

function RecipeParser(targetPath, name) {
    var parser = this;
    
    // initialise members
    this.requirements = [];
    this.name = name;
    this.data = '';

    // run the parser tasks in series
    async.series([
        this._checkAliases.bind(this, targetPath),
        this._read.bind(this, targetPath),
        this._parse.bind(this)
    ], function(err) {
        if (err) {
            parser.emit('error', err);
        }
        else {
            parser.emit('ready');
        }
    });
    
    this._read(targetPath, recipe);
}

util.inherits(RecipeParser, events.EventEmitter);

RecipeParser.prototype._checkAliases = function(targetPath, callback) {
    var parser = this;
    
    // attempt to open an alias file
    fs.readFile(path.join(targetPath, 'aliases', this.name), 'utf8', function(err, data) {
        if (! err) {
            parser.name = data.replace(reLineBreaks, '');
        }
        
        callback();
    });
};

RecipeParser.prototype._parse = function(callback) {
    callback();
};


RecipeParser.prototype._read = function(targetPath, callback) {
    var parser = this;
    
    // read the file, and process the input
    fs.readFile(path.join(targetPath, 'recipes', this.name), 'utf8', function(err, data) {
        if (! err) {
            parser.data = data;
        }
        
        callback(err);
    });
};

module.exports = RecipeParser;