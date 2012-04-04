var debug = require('debug')('bake'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    out = require('out'),
    Recipe = require('./recipe'),
    path = require('path'),
    _ = require('underscore'),
    reRequire = /^\s*(?:\/\/|\#)\s*(?:req|dep)\:\s(.*)$/,
    reDelim = /\,\s*/;

function Oven(opts) {
    EventEmitter.call(this);
    
    // save the opts locally
    this.opts = opts || {};
    
    this.readable = true;
    this.writable = true;
    this.input = '';
    this.output = '';
    this.recipes = {};
    this.fetched = [];
    
    // initialise option toggleable members
    this.basePath = process.cwd();
    this.dataPath = this.opts.bakery;
}

util.inherits(Oven, EventEmitter);

Oven.prototype._allRead = function() {
    var recipes = this.recipes,
        remaining = _.filter(Object.keys(recipes), function(key) {
            return typeof recipes[key] != 'object';
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
            out('!{grey}<== !{blue}' + recipe.name);
            
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
    return _.sortBy(_.toArray(this.recipes), function(item) {
        return item.requirements.length;
    });
};

Oven.prototype._readNext = function(callback) {
    var recipes = this.recipes,
        next = _.find(Object.keys(this.recipes), function(key) {
            return typeof recipes[key] != 'object';
        }),
        
        // assign the recipe to the recipe parser    
        recipe = recipes[next] = new Recipe(next, this.opts);

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

Oven.prototype.addItem = function(text, fileType) {
    var main = this.recipes.main,
        currentResults;
    
    if (! main) {
        main = this.recipes.main = new Recipe('main');
        main.resolved = true;
    }

    // default the filetype to js
    fileType = fileType || 'js';
    
    // get the current results for the fileType
    currentResults = main.results[fileType] || [];
    
    // find the libraries in the text
    main.results[fileType] = currentResults.concat(this._findRequires(text, main));
    
    // return the recipe
    return main;
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