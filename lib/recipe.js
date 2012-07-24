var async = require('async'),
    debug = require('debug')('bake-recipe'),
    events = require('events'),
    formatter = require('formatter'),
    path = require('path'),
    fs = require('fs'),
    getit = require('getit'),
    util = require('util'),
    _ = require('underscore'),
    reModules = /\[(.*?)\]$/,
    reField = /^\s*\#\s*(\w+)\:\s*(.*)$/,
    reLocalFile = /^[\/\\\.]/,
    reLineBreaks = /\n/gm,
    reCommaDelim = /\,\s*/,
    reVarSection = /^(.*)\#(.*)$/,
    reSection = /\s*\[(\w+)\]/,
    reDownload = /^([\w\.\-]*?)\s*<\=\s*(.*)$/;
    
function _indent(content) {
    return (content || '').split('\n').map(function(line) {
        return '  ' + line;
    }).join('\n');
}

function _isLocal(name) {
    return reLocalFile.test(name);
}
    
function _parseName(name) {
    // split the name at the @ character
    var parts = name.split('@'),
        modulesMatch = reModules.exec(parts[0]),
        mods = ['core'];
        
    // if the modules match works, then extract the desired modules
    if (modulesMatch) {
        mods = modulesMatch[1].split(':');
        parts[0] = parts[0].slice(0, modulesMatch.index);
        
        // ensure we have core in the mods
        if (mods.indexOf('core') < 0) {
            mods.unshift('core');
        }
    }
    
    return {
        name: parts[0],
        version: parts[1],
        mods: mods
    };
}

function Recipe(name, opts) {
    // ensure we have options
    this.opts = opts || {};
    
    // initialise members
    this.buildstyle = this.opts.buildstyle || 'glob';
    this.requirements = [];
    this.data = '';
    this.basePath = process.cwd();
    this.results = {};
    this.ready = false;
    
    // add the name details
    _.extend(this, _parseName(name || ''));
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

/**
## _join(data, fileType)
This is a utility method that helps glue files together in a way that ensures that they 
work correctly (i.e. adding ; between libraries as a library may not necessarily have a trailing ;)
*/
Recipe.prototype._join = function(data, fileType) {
    var separator = fileType.toLowerCase() == 'js' ? '\n;' : '\n';

    return data.join(separator);
};

Recipe.prototype._parse = function(callback) {
    var match, 
        recipe = this, 
        newData = '';
    
    // iterate through the data lines and check them
    debug(this.name + ' recipe found - parsing contents');
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
        debug('local recipe detected (' + this.name + ') resolving against basepath: ' + this.basePath);
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
            err = new Error('!{bold}CANNOT OPEN:     !{underline}' + parser.name);
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
            parser.ready = true;
            parser.emit('ready');
        }
    });
};

Recipe.prototype.fetch = function(callback) {
    var required = {},
        resolved = {},
        recipe = this,
        errorItem,
        getItOpts = {
            cachePath: path.resolve(__dirname, '../data/_cache'),
            cacheAny: true,
            cwd: path.dirname(path.resolve(this.basePath, this.name)),
            preferLocal: !this.opts.refresh
        };
        
    // if we don't have sections, the this recipe isn't loaded
    if (! this.sections) {
        callback(new Error('recipe "' + this.name + '" not loaded, unable to fetch from bakery'));
        return;
    }

    // iterate through the sections and compile the required files list
    this.mods.forEach(function(section) {
        var varMatch = reVarSection.exec(section),
            searchExpr;
            
        // if this is a variable section, then create the search expression to find an replace
        // the appropriate variable
        // we will use a custom search expression here rather than a formatter to ensure that other
        // variables are not removed
        if (varMatch) {
            searchExpr = new RegExp('\\$' + varMatch[1], 'g');
            section = varMatch[1];
        }
        
        _.each(recipe.sections[section], function(requires, key) {
            if (searchExpr) {
                requires = requires.map(function(val) {
                    return val.replace(searchExpr, varMatch[2]);
                });
            }
            
            required[key] = (required[key] || []).concat(requires);
        });
    });

    async.forEach(
        Object.keys(required),
        
        function(fileType, itemCallback) {
            async.map(
                required[fileType], 
                function(item, dlCallback) {
                    getit(item, getItOpts, function(err, data) {
                        if (err) {
                            err = new Error('Unable to download: ' + recipe.name + ', could not resolve include: ' + item);
                        }
                        
                        dlCallback(err, data);
                    });
                },
                function(err, results) {
                    resolved[fileType] = results;
                    itemCallback(err);
                }
            );
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
        var recipe = this;
        
        // update the requirements
        this.requirements = value.split(reCommaDelim);
        
        // iterate through the requirements and update to absolute paths if it they are local
        this.requirements.forEach(function(req, index) {
            if (reLocalFile.test(req)) {
                recipe.requirements[index] = path.resolve(recipe.basePath, req);
            }
        });
    }
});

// define a `req` property to deal with parsing the string requirements into an array
Object.defineProperty(Recipe.prototype, 'dsc', {
    set: function(value) {
        this.desc = value;
    }
});

// define a dep property as an alias to req
Object.defineProperty(Recipe.prototype, 'dep', {
    set: function(value) {
        this.requirements = value.split(reCommaDelim);
    }
});

exports = module.exports = Recipe;
exports.parseName = _parseName;
exports.indent = _indent;
exports.isLocal = _isLocal;