var async = require('async'),
    debug = require('debug')('compose-parser'),
    events = require('events'),
    formatter = require('formatter'),
    path = require('path'),
    fs = require('fs'),
    getit = require('getit'),
    util = require('util'),
    _ = require('underscore'),
    reModules = /\[(.*?)\]$/,
    reField = /^\s*\#\s*(\w+)\:\s*(.*)$/,
    reLocalFile = /^\./,
    reLineBreaks = /\n/gm,
    reCommaDelim = /\,\s*/,
    reSection = /\s*\[(\w+)\]/,
    reDownload = /^(\w*?)\s*\<\=\s*(.*)$/;

function Recipe(name, opts) {
    // split the name at the @ character
    var parts = name.split('@'),
        modulesMatch = reModules.exec(parts[0]),
        mods = ['core'];
        
    // if the modules match works, then extract the desired modules
    if (modulesMatch) {
        mods = modulesMatch[1].toLowerCase().split(/\,\s*/);
        parts[0] = parts[0].slice(0, modulesMatch.index);
        
        // ensure we have core in the mods
        if (mods.indexOf('core') < 0) {
            mods.unshift('core');
        }
    }
    
    // ensure we have options
    opts = opts || {};
    
    // initialise members
    this.buildstyle = opts.buildstyle || 'oldschool';
    this.requirements = [];
    this.name = parts[0];
    this.version = parts[1];
    this.data = '';
    this.basePath = process.cwd();
    this.mods = mods;
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

    // if we have a stable version flag and no version specified in the recipe, set to stable
    this.version = this.version || this.stable;

    // parse the modules from the data
    this._parseSections(newData, callback);
};

Recipe.prototype._parseSections = function(data, callback) {
    var activeSection, sectionMatch, downloadMatch,
        sections = this.sections = {},
        recipe = this;
    
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
                activeSection[fileType].push(formatter(downloadMatch[2])(recipe));
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

Recipe.prototype.fetch = function(callback) {
    var sections,
        required = {},
        resolved = {},
        recipe = this;

    // iterate through the sections and compile the required files list
    this.mods.forEach(function(section) {
        _.each(recipe.sections[section], function(requires, key) {
            required[key] = (required[key] || []).concat(requires);
        });
    });

    async.forEach(
        Object.keys(required),
        
        function(fileType, itemCallback) {
            async.map(required[fileType], getit, function(err, results) {
                resolved[fileType] = results;
                itemCallback(err);
            });
        },
        
        function(err) {
            if (callback) {
                callback(err, resolved);
            }
        }
    );
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