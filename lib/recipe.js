var async = require('async'),
    debug = require('debug')('compose-parser'),
    events = require('events'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    reField = /^\s*\#\s*(\w+)\:\s*(.*)$/,
    reLocalFile = /^\./,
    reLineBreaks = /\n/gm,
    reCommaDelim = /\,\s*/,
    reSection = /\s*\[(\w+)\]/,
    reDownload = /^(\w*?)\s*\<\=\s*(.*)$/;

function Recipe(name) {
    // initialise members
    this.requirements = [];
    this.name = name;
    this.data = '';
    this.basePath = process.cwd();
}

util.inherits(Recipe, events.EventEmitter);

Recipe.prototype._checkAliases = function(targetPath, callback) {
    var parser = this,
        dataPath = path.join(targetPath, 'aliases', this.name);
    
    // attempt to open an alias file
    debug('checking whether the recipe "' + this.name + '" is an alias');
    fs.readFile(dataPath, 'utf8', function(err, data) {
        if (! err) {
            parser.alias = parser.name;
            parser.name = data.replace(reLineBreaks, '');
        }
        
        callback();
    });
};

Recipe.prototype._parse = function(callback) {
    var match, 
        recipe = this, 
        newData = '';
    
    // iterate through the data lines and check them
    debug(this.name + ' recipe - parsing contents');
    (this.data || '').split(/\n/).forEach(function(line) {
        match = reField.exec(line);
        
        if (match) {
            recipe[match[1]] = match[2];
        }
        else {
            newData += line + '\n';
        }
    });

    // parse the modules from the data
    this._parseSections(newData, callback);
};

Recipe.prototype._parseSections = function(data, callback) {
    var activeSection, sectionMatch, downloadMatch,
        sections = this.sections = {};
    
    // split the data on linebreaks
    data.split(/\n/).forEach(function(line) {
        sectionMatch = reSection.exec(line);
        if (sectionMatch) {
            // create the active section
            activeSection = sections[sectionMatch[1]] = {};
        }
        else {
            // check for a download match
            downloadMatch = reDownload.exec(line);
            
            // if we have a download match, then add it to the active section
            if (downloadMatch) {
                var fileType = downloadMatch[1] || 'js';
                
                // if the active section is currently undefined, then create the core section
                if (! activeSection) {
                    activeSection = sections.core = {};
                }
                
                // if the file type is not in the active section then add it
                if (! activeSection[fileType]) {
                    activeSection[fileType] = [];
                }
                
                // add the download to the file types in the active section
                activeSection[fileType].push(downloadMatch[2]);
            }
        }
    });
    
    // trigger the callback
    callback();
};


Recipe.prototype._read = function(targetPath, callback) {
    var parser = this,
        dataPath = path.join(targetPath, 'recipes', this.name);
    
    // if the name is a local file then use that file instead of the default locaation
    if (reLocalFile.test(this.name)) {
        dataPath = path.resolve(this.basePath, this.name);
    }
    
    // read the file, and process the input
    debug('loading recipe from: ' + dataPath);
    fs.readFile(dataPath, 'utf8', function(err, data) {
        if (! err) {
            parser.data = data;
        }
        else {
            debug(err);
            err = new Error('Unable to find "' + parser.name + '" recipe');
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

// define a dep property as an alias to req
Object.defineProperty(Recipe.prototype, 'dep', {
    set: function(value) {
        this.requirements = value.split(reCommaDelim);
    }
});

module.exports = Recipe;