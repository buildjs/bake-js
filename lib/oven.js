var debug = require('debug')('bake'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    out = require('out'),
    Recipe = require('./recipe'),
    semver = require('semver'),
    path = require('path'),
    _ = require('underscore'),
    reRequire = /^\s*(?:\/\/|\#)\s*(?:req|dep)\:\s(.*)$/,
    reDelim = /\,\s*/,
    reRaw = /\.raw$/i;

function Oven(opts) {
    EventEmitter.call(this);
    
    // save the opts locally
    this.opts = opts || {};
    
    this.readable = true;
    this.writable = true;
    this.input = '';
    this.output = '';
    this.recipes = {};
    this.resolved = {};
    this.fetched = [];
    
    // initialise option toggleable members
    this.basePath = process.cwd();
    this.dataPath = this.opts.bakery;
}

util.inherits(Oven, EventEmitter);

Oven.prototype._allRead = function() {
    var resolved = this.resolved,
        remaining = _.filter(Object.keys(this.recipes), function(key) {
            return typeof resolved[Recipe.parseName(key).name] != 'object';
        });
        
    return remaining.length === 0;
};

Oven.prototype._checkRecipes = function(callback) {
    // iterate through the requirements and load each of the recipes from the local data path
    loader.check(this.requirements, function(err, updatedRequirements) {
        if (! err) {
            this.requirements = updatedRequirements;
        }
        
        callback(err);
    });
};

Oven.prototype._findRequires = function(text, currentRecipe) {
    var output = [],
        oven = this,
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
        oven.recipes[recipe] = oven.recipes[recipe] || '';
    });
    
    // if we have a recipe that we are finding requirements for, then update the 
    // dependencies so library ordering will be correct
    if (currentRecipe) {
        currentRecipe.requirements = _.uniq(currentRecipe.requirements.concat(recipes));
    }
    
    return output.join('\n') + '\n';
};

Oven.prototype._fetch = function(recipes, callback) {
    var oven = this;
    
    async.forEach(
        // filter out recipes that are already resolved
        recipes.filter(function(recipe) {
            return !recipe.resolved;
        }),
         
        function(recipe, itemCallback) {
            out('!{grey}<== !{blue}' + recipe.name + (recipe.refresh ? ' !{gray}(refresh)' : ''));
            
            recipe.fetch(function(err, results) {
                // check the results for any new requirements
                _.each(results, function(val, key) {
                    results[key] = oven._findRequires(val.join('\n'), recipe);
                });
                
                // update the recipe results
                recipe.results = results;
                recipe.resolved = true;
                
                // trigger the callback
                itemCallback(err);
            });
        },
        callback
    );
};

Oven.prototype._getSortedRecipes = function() {
    // sort the recipes in priority order
    // TODO: improve this algorithm
    return _.sortBy(_.toArray(this.resolved), function(item) {
        return item.requirements.length;
    });
};

Oven.prototype._readNext = function(callback) {
    var recipes = this.recipes, 
        resolved = this.resolved,
        next = _.find(Object.keys(this.recipes), function(key) {
            return typeof resolved[Recipe.parseName(key).name] != 'object';
        }),
        
        // create the new recipe
        recipe = new Recipe(next, this.opts),
        
        // check for an existing version of the recipe
        existingRecipe = resolved[recipe.name];
        
    // let's check existing recipes to see if we have already loaded that recipe
    if (typeof existingRecipe == 'object') {
        // update the recipe mods
        recipe.mods = _.uniq(existingRecipe.mods.concat(recipe.mods));

        // if either recipe has a version specified, then update to use the latest version specified
        if (recipe.version || existingRecipe.version) {
            if (semver.gt(existingRecipe.version, recipe.version)) {
                recipe.version = existingRecipe.version;
            }
        }
        
        // flag a refresh
        recipe.refresh = true;
    }

    // ensure the recipe exists in the resolved list
    resolved[recipe.name] = recipe;
        
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

Oven.prototype.addRecipe = function(text, filename) {
    var ext = path.extname(filename),
        name = path.basename(filename, ext).replace(reRaw, ''),
        fileType = ext.slice(1) || 'js',
        recipe, currentResults;
        
    // get the recipe
    recipe = this.resolved[name];
    
    if (! recipe) {
        recipe = this.resolved[name] = new Recipe(name);
        recipe.resolved = true;
    }

    // get the current results for the fileType
    currentResults = recipe.results[fileType] || [];
    
    // find the libraries in the text
    recipe.results[fileType] = currentResults.concat(this._findRequires(text, recipe));
    
    // return the recipe
    return recipe;
};

Oven.prototype.process = function(text, fileType) {
    var oven = this;
    
    // resolve the requirements in order as they may well be order important
    // TODO: make this efficient (i.e. bring down libraries with no deps in parallel)
    async.until(
        this._allRead.bind(this),
        this._readNext.bind(this),
        function(err) {
            if (err) {
                oven.emit('error', err);
            }
            else {
                oven._fetch(oven._getSortedRecipes(), function(err) {
                    if (err) {
                        oven.emit('error', err);
                    }
                    else if (oven._allRead()) {
                        oven.emit('done', oven._getSortedRecipes());
                    }
                    else {
                        oven.process();
                    }
                });
            }
        }
    );

};

module.exports = Oven;