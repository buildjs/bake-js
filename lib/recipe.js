var async = require('async'),
    debug = require('debug')('compose-parser'),
    events = require('events'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    reField = /^\s*\#\s*(\w+)\:\s*(.*)$/,
    reLineBreaks = /\n/gm;
    reCommaDelim = /\,\s*/;

function Recipe(name) {
    // initialise members
    this.requirements = [];
    this.name = name;
    this.data = '';
}

util.inherits(Recipe, events.EventEmitter);

Recipe.prototype._checkAliases = function(targetPath, callback) {
    var parser = this,
        dataPath = path.join(targetPath, 'aliases', this.name);
    
    // attempt to open an alias file
    debug('checking whether the recipe "' + this.name + '" is an alias');
    fs.readFile(dataPath, 'utf8', function(err, data) {
        if (! err) {
            parser.name = data.replace(reLineBreaks, '');
        }
        
        callback();
    });
};

Recipe.prototype._parse = function(callback) {
    var match, recipe = this;
    
    // iterate through the data lines and check them
    debug(this.name + ' recipe - parsing contents');
    (this.data || '').split(/\n/).forEach(function(line) {
        match = reField.exec(line);
        
        if (match) {
            recipe[match[1]] = match[2];
        }
    });
    
    callback();
};


Recipe.prototype._read = function(targetPath, callback) {
    var parser = this,
        dataPath = path.join(targetPath, 'recipes', this.name);
    
    // read the file, and process the input
    debug('loading recipe from: ' + dataPath);
    fs.readFile(dataPath, 'utf8', function(err, data) {
        if (! err) {
            parser.data = data;
        }
        
        callback(err);
    });
};

Recipe.prototype.load = function(targetPath) {
    var parser = this;
    
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
};

// define a `req` property to deal with parsing the string requirements into an array
Object.defineProperty(Recipe.prototype, 'req', {
    set: function(value) {
        this.requirements = value.split(reCommaDelim);
    }
});

module.exports = Recipe;