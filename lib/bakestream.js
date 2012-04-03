var async = require('async'),
    Stream = require('stream').Stream,
    util = require('util'),
    out = require('out'),
    Recipe = require('./recipe'),
    path = require('path'),
    _ = require('underscore'),
    fetch = require('./fetch'),
    reRequire = /^\s*(?:\/\/|\#)\s*(?:req|dep)\:\s(.*)$/,
    reDelim = /\,\s*/;

function BakeStream(opts) {
    Stream.call(this);
    
    opts = opts || {};
    
    this.readable = true;
    this.writable = true;
    this.input = '';
    this.output = '';
    this.recipes = {};
    this.fetched = [];
    
    // initialise option toggleable members
    this.out = opts.quiet ? function() {} : out;
    this.basePath = process.cwd();
    this.dataPath = opts.bakery;
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

BakeStream.prototype._complete = function() {
    var stream = this;
    
    _.each(this._getSortedRecipes(), function(recipe) {
        stream.emit('data', recipe.data);
    });

    // stream the original file with the req comments stripped
    stream.emit('data', stream.output);

    // end the stream
    stream.emit('end');
};

BakeStream.prototype._findRequires = function(text, currentRecipe) {
    var output = [],
        stream = this,
        // reset the requirements
        recipes = [];
        
    (text || '').split(/\n/).forEach(function(line) {
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
    
    // iterate through the requirements for this file, and create the requirements hash
    recipes.forEach(function(recipe) {
        stream.recipes[recipe] = stream.recipes[recipe] || '';
    });
    
    // if we have a recipe that we are finding requirements for, then update the 
    // dependencies so library ordering will be correct
    if (currentRecipe) {
        currentRecipe.requirements = _.uniq(currentRecipe.requirements.concat(recipes));
    }
    
    return output.join('\n') + '\n';
};

BakeStream.prototype._getSortedRecipes = function() {
    // sort the recipes in priority order
    // TODO: improve this algorithm
    return _.sortBy(_.toArray(this.recipes), function(item) {
        return item.requirements.length;
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
    recipe.basePath = this.basePath;
    recipe.load(this.dataPath);
};

BakeStream.prototype._resolveRecipes = function(callback) {
    var stream = this;
    
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
                // get the sorted recipes
                var recipes = stream._getSortedRecipes();
                
                // fetch the recipe contents
                fetch(recipes, stream.out, function(err, fetched) {
                    if (err) {
                        stream.emit('error', err);
                    }
                    else {
                        // iterate through the fetched recipes
                        _.each(fetched, function(recipe) {
                            // parse for additional includes
                            recipe.data = stream._findRequires(recipe.data, recipe);
                            
                            // update the stream fetched
                            stream.fetched.push(recipe);
                        });
                        
                        if (stream._allRead()) {
                            stream._complete();
                        }
                        else {
                            stream._resolveRecipes();
                        }
                    }
                });
            }
        }
    );
};

BakeStream.prototype.end = function(buffer) {
    var stream = this;
    
    // parse the input data looking for requirements
    this.out('!{grey}parsing file');
    
    // find the requirements for this file
    this.output = this._findRequires(this.input);
    
    // resolve the requirements
    stream._resolveRecipes();
};

BakeStream.prototype.write = function(buffer, encoding) {
    this.input += buffer.toString(encoding);
};

module.exports = BakeStream;