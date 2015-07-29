var async = require('async');
var debug = require('debug')('bake');
var getit = require('getit');
var path = require('path');
var rigger = require('rigger');
var fs = require('fs');
var out = require('out');
var formatter = require('formatter');
var Oven = require('./lib/oven.js');
var _ = require('underscore');

/**
  # bake-js

  Bake is a javascript __application__ build tool that is designed to make
  building web apps as simple as possible.

  It's core reason for existence is to help with managing the dependencies web
  applications will require, and to make it simple for you to include libraries
  without having to know where those libraries actually come from.

  ## NOTE: Project Inactive

  Development on this project has all but stopped, as
  [the primary author](https://github.com/DamonOehlman) is a
  [big fan of browserify](https://twitter.com/DamonOehlman/status/466146817608912896).

  ## Documentation

  Full documentation for bake is available at:

  <http://bakejs.readthedocs.org/>

**/

function _help() {
  var commands = [],
      files = fs.readdirSync(path.resolve(__dirname, 'commands')),
      actionHelp = formatter('    {{ 0|len:30 }}{{ 1 }}');

  // now iterate through the commands and provide some output
  out('  Available Actions:\n');

  (files || []).forEach(function(file) {
    commands.push({
      name: path.basename(file, '.js'),
      module: require('./commands/' + file)
    });
  });

  commands.forEach(function(command) {
    out(actionHelp(command.name, command.module.desc));
  });

  out(' ');
}

function _process(files, opts, callback) {
  var oven, writer, recipe;

  // remap args if required
  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  // ensure we have opts
  opts = opts || {};

  // default the build type to oldschool
  opts.buildstyle = opts.buildstyle || 'glob';
  opts.output = opts.output || 'dist';

  // load the required writer
  if (! opts.dummyRun) {
    try {
      writer = require('./lib/writers/' + opts.buildstyle);
    }
    catch (e) {
      callback(new Error('Unable to load the writer for buildstyle: ' + opts.buildstyle));
      return;
    }
  }

  // create the oven
  oven = new Oven(opts);

  // if the files argument is not an array, make it one
  if (! Array.isArray(files)) {
    files = [files];
  }

  if (! opts.quiet) {
    oven.on('warn', function(err) {
      out(err.message);
    });
  }

  // process each of the files specified
  async.forEach(
    files,

    function(targetFile, itemCallback) {
      if (! opts.quiet) {
        out('!{grey}reading: !{grey,underline}{0}', targetFile);
      }

      rigger(path.resolve(targetFile), function(err, data) {
        if (err) {
          itemCallback(err);
        }
        else {
          // tell the process what the base path is
          oven.basePath = path.resolve(path.dirname(targetFile));

          // add the recipe
          recipe = oven.addRecipe(data, path.basename(targetFile));

          // route events correctly
          oven.on('done', function(recipes) {
            if (writer) {
              if (! opts.quiet) {
                out('\n!{grey}=== SORTING RECIPES IN ORDER OF REQUIREMENT\n    !{magenta}' + _.pluck(recipes, 'name').join('\n    !{magenta}'));
                out('\n!{grey}=== GENERATING OUTPUT FILES');
              }

              // get the writer to write the files
              writer(recipe.name, recipes, opts, function(err) {
                // remove the item recipe
                delete oven.recipes[recipe.name];

                // trigger the item callback
                itemCallback(err);
              });
            }
            else {
              itemCallback();
            }
          });

          oven.on('error', itemCallback);

          if (! opts.quiet) out('\n!{grey}=== LOADING RECIPE REQUIREMENTS');
          oven.process();
        }
      });

    },

    callback
  );

  return oven;
}

exports = module.exports = function(args, program) {
  var action = typeof args == 'string' ? args : args[0];

  if (! action) {
    out(program ? program.helpInformation() : 'An action or file is required');
    return;
  }

  // use the local bakery path if one not provided
  program.bakery = program.bakery || path.resolve(__dirname, '../data/bakery');

  // if the action maps to a path, then process that path
  fs.stat(action, function(err, stats) {
    if ((! err) && (stats.isFile() || stats.isDirectory())) {
      var files = [action];

      // if the target path is a directory, then get the files from that directory
      if (stats.isDirectory()) {
        files = (fs.readdirSync(action) || []).map(function(file) {
          return path.join(action, file);
        });
      }

      _process(files, program, function(err) {
        if (err) {
          out.error(err);
        }
        else {
          out('\n!{grey}=== DONE !{check, green}');
        }
      }, stats.isDirectory());
    }
    else {
      var handler;

      try {
        handler = require('./commands/' + action);
      }
      catch (e) {
      }

      if (typeof handler == 'function') {
        handler.apply(null, args.slice(1).concat(program));
      }
    }
  });
};

exports.help = _help;
exports.process = _process;
