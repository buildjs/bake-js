var debug = require('debug')('bake'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    out = require('out'),
    formatter = require('formatter'),
    Recipe = require('./recipe'),
    semver = require('semver'),
    path = require('path'),
    _ = require('underscore'),
    reRequire = /^\;?\s*(?:\/\/|\#)\s*(?:req|dep)\:\s(.*)$/,
    reDelimitedModules = /\[([^\]]*[\s\,][^\]]*)\]/g,
    reDelim = /[\,\s]\s*/g,
    reRaw = /\.raw$/i,
    tplDownload = formatter('!{grey}<== !{blue}{{ name }}!{cyan}[{{ mods }}]!{gray}');

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
  this.quiet = opts.quiet;

  // initialise option toggleable members
  this.basePath = process.cwd();
  this.dataPath = this.opts.bakery;
}

util.inherits(Oven, EventEmitter);

Oven.prototype.addRecipe = function(text, filename) {
  var ext = path.extname(filename),
      name = path.basename(filename, ext).replace(reRaw, ''),
      fileType = ext.slice(1) || 'js',
      recipe, currentResults;

  // get the recipe
  recipe = this.resolved[name];

  if (! recipe) {
    recipe = this.resolved[name] = new Recipe(name);

    // flag the recipe as resolved and an entry point
    recipe.resolved = true;
    recipe.entrypoint = true;

    // synchronize the recipe basepath with the oven basepath
    recipe.basePath = this.basePath;
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
        oven.emit('warn', err);
      }

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
  );

};

Oven.prototype.require = function(name, currentRecipe) {
  debug('requiring ' + name + ', current recipe path: ' + currentRecipe.basePath);

  // resolve any pathing issues for local recipes
  // as their path will be relative to the recipe they have been loaded from
  if (Recipe.isLocal(name) && currentRecipe) {
    name = path.resolve(currentRecipe.basePath, name);
    debug('resolved to: ' + name);
  }

  // update the recipe required flag
  this.recipes[name] = this.recipes[name] || '';

  // return the resolved recipe name
  return name;
};

Oven.prototype._allRead = function() {
  return this._remaining().length === 0;
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
      var requirements = match[1],
          cleanRequiredModuleMatch = reDelimitedModules.exec(requirements);

      // clean module requirements from space and comma delimiters
      while (cleanRequiredModuleMatch) {
        var modules = cleanRequiredModuleMatch[1].replace(reDelim, ':');

        requirements = requirements.slice(0, cleanRequiredModuleMatch.index) +
          '[' + modules + ']' +
          requirements.slice(cleanRequiredModuleMatch.index + cleanRequiredModuleMatch[1].length + 2);

        cleanRequiredModuleMatch = reDelimitedModules.exec(requirements);
      }

      recipes = recipes.concat(requirements.split(reDelim));
    }
    // otherwise, pass the line through to the output
    else {
      output[output.length] = line;
    }
  });

  // filter out empty names
  recipes = recipes.filter(function(name) {
    return name;
  });

  // iterate through the requirements for this file, and create the requirements hash
  recipes.forEach(function(recipe, index) {
    recipes[index] = oven.require(recipe, currentRecipe);
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
      if (! recipe.ready) {
        oven.emit('warn', new Error('!{bold}SKIPPING RECIPE: !{underline}' + recipe.name));

        // resolved but not found
        recipe.resolved = true;

        // trigger the callback
        itemCallback();
        return;
      }

      if (! this.quiet) {
        out(tplDownload(recipe) + (recipe.refresh ? ' (refresh)' : ''));
      }

      recipe.fetch(function(err, results) {
        // check the results for any new requirements
        _.each(results, function(val, key) {
          var separator = key === 'js' ? '\n;' : '\n';

          results[key] = [oven._findRequires(recipe._join(val, key), recipe)];
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
  var updated = false;

  // sort the recipes in priority order
  var sorted = _.sortBy(_.toArray(this.resolved), function(item) {
    return item.requirements.length;
  }),
      postLoad,
      unresolved;

  function pushToEnd(index) {
    sorted = sorted.concat(sorted.splice(index, 1));
  }

  function getRecipeName(recipe) {
    return recipe.name;
  }

  // iterate through the sorted recipes and reorder where required
  do {
    // reset the invalid flag
    updated = false;

    // check for recipes in the sorted list that appear in the list
    // after a library that depends on it
    for (var ii = sorted.length; ii--; ) {
      // get the names of the recipes that appear after this on
      postLoad = sorted.slice(ii + 1).map(getRecipeName);

      // find the unresolved recipes in the list
      unresolved = _.intersection(postLoad, sorted[ii].requirements);

      // if we have unresolved recipes, push this recipe to the end
      if (unresolved.length > 0) {
        pushToEnd(ii);
        updated = true;
        break;
      }
    }
  } while(updated);

  return sorted;
};

Oven.prototype._readNext = function(callback) {
  var oven = this,
      recipes = this.recipes,
      resolved = this.resolved,
      next = this._remaining()[0],

      // create the new recipe
      recipe = next ? new Recipe(next, this.opts) : undefined,

      // check for an existing version of the recipe
      existingRecipe = recipe ? resolved[recipe.name] : undefined;


  // if we have no recipe, then return
  if (! recipe) return;

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
      oven.require(dep, recipe);
    });

    // trigger the callback
    callback();
  });

  recipe.on('error', function(err) {
    oven.emit('warn', err);
    callback();
  });

  // set the recipe basepath
  if (Recipe.isLocal(recipe.name)) {
    recipe.basePath = path.dirname(recipe.name);
  }
  else {
    recipe.basePath = this.basePath;
  }

  // load the recipe
  debug('loading recipe: ' + recipe.name + ', basepath = ' + recipe.basePath);

  recipe.load(this.dataPath);
};

Oven.prototype._remaining = function() {
  var resolved = this.resolved,
      remaining = _.filter(Object.keys(this.recipes), function(key) {
        var recipe = Recipe.parseName(key),
            existing = resolved[recipe.name],
            shouldLoad = true;

        // if we have an existing recipe, then check that all modules for the new
        // recipe have been satisfied by the existing recipe
        if (typeof existing == 'object') {
          // get the difference between the existing modules and the new recipe modules
          // the module is found
          shouldLoad = _.difference(recipe.mods, existing.mods).length > 0;
        }

        return shouldLoad;
      });

  return remaining;
};

module.exports = Oven;
