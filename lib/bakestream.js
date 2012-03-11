var async = require('async'),
    Stream = require('stream').Stream,
    util = require('util'),
    out = require('out'),
    Recipe = require('./recipe'),
    path = require('path'),
    _ = require('underscore'),
    fetch = require('./fetch'),
    reRequire = /^\s*(?:\/\/|\#)\s*(?:req|dep)\:\s(.*)$/,
    reDelim = /\,\s*/,
    dataPath = path.resolve(__dirname, '../data/recipes.local/');

function BakeStream(opts) {
    Stream.call(this);
    
    opts = opts || {};
    
    this.readable = true;
    this.writable = true;
    this.input = '';
    this.output = '';
    this.recipes = {};
    this.out = opts.quiet ? function() {} : out;
}

util.inherits(BakeStream, Stream);

BakeStream.prototype._allRead = function() {
    var recipes = this.recipes,
        remaining = _.filter(Object.keys(recipes), function(key) {
            return typeof recipes[key] != 'object';
        });
        
    return remaining.length === 0;
};

BakeStream.prototype._checkRecipes = function(callback) {
    // iterate through the requirements and load each of the recipes from the local data path
    loader.check(this.requirements, function(err, updatedRequirements) {
        if (! err) {
            this.requirements = updatedRequirements;
        }
        
        callback(err);
    });
};

BakeStream.prototype._findRequires = function() {
    var output = [],
        stream = this,
        // reset the requirements
        recipes = [];
    
    (this.input || '').split(/\n/).forEach(function(line) {
        var match = reRequire.exec(line);
        
        // if we have a match on this line, then add the requirements
        if (match) {
            recipes = recipes.concat(match[1].split(reDelim));
        }
        // otherwise, pass the line through to the output
        else {
            output[output.length] = line;
        }
    });
    
    // update member variables
    this.output = output.join('\n') + '\n';
    
    // iterate through the requirements for this file, and create the requirements hash
    recipes.forEach(function(recipe) {
        stream.recipes[recipe] = '';
    });
};

BakeStream.prototype._readNext = function(callback) {
    var recipes = this.recipes,
        next = _.find(Object.keys(this.recipes), function(key) {
            return typeof recipes[key] != 'object';
        }),
        
        // assign the recipe to the recipe parser    
        recipe = recipes[next] = new Recipe(next);

    // when the recipe is ready, add any new dependencies to the dependency tree
    recipe.on('ready', function() {
        (recipe.requirements || []).forEach(function(dep) {
            // ensure the dependency is captured
            recipes[dep] = recipes[dep] || '';
        });
        
        // trigger the callback
        callback();
    });
    
    recipe.on('error', function(err) {
        callback(err);
    });
    
    // load the recipe
    recipe.load(dataPath);
};

BakeStream.prototype._resolveRecipes = function(callback) {
    var stream = this;
    
    /*
    async.forEachSeries(
        this.requirements,

        function(item, itemCallback) {
            stream.out('Resolving dependency: ' + item);
            
            // download the item
            loader.download(item, function(err, contents) {
                // if there was no error, then emit the contents
                if (! err) {
                    
                }
                // otherwise, emit an error comment
                else {
                    
                }
                
                itemCallback(err);
            });
        },

        callback
    );
    */
};

BakeStream.prototype.end = function(buffer) {
    var stream = this;
    
    // parse the input data looking for requirements
    this.out('!{grey}parsing file');
    
    // find the requirements for this file
    this._findRequires();
    
    // resolve the requirements in order as they may well be order important
    // TODO: make this efficient (i.e. bring down libraries with no deps in parallel)
    async.until(
        this._allRead.bind(this),
        this._readNext.bind(this),
        function(err) {
            if (err) {
                stream.emit('error', err);
            }
            else {
                // fetch the recipe contents
                fetch(_.toArray(stream.recipes), stream.out, function(err, fetched) {
                    if (err) {
                        stream.emit('error', err);
                    }
                    else {
                        // iterate through the fetched recipes
                        _.each(fetched, function(recipe) {
                            // stream the resolved requirements
                            stream.emit('data', recipe.data);
                        });

                        // stream the original file with the req comments stripped
                        stream.emit('data', stream.output);

                        // end the stream
                        stream.emit('end');
                    }
                });
            }
        }
    );
};

BakeStream.prototype.write = function(buffer) {
    this.input += buffer.toString();
};

module.exports = BakeStream;